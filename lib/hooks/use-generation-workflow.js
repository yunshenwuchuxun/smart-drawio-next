import { useCallback, useEffect, useRef, useState } from 'react';

import { BLUEPRINT_PHASE } from '@/lib/blueprint-phase';
import { isConfigValid } from '@/lib/config';
import { postProcessDrawioCode, readSSEStream, sanitizeError, stripXmlHeaders } from '@/lib/drawio-code-utils';
import { isNetworkError, normalizeUserInput, parseGeneratedContent, resolveResponseErrorMessage } from '@/lib/generation-utils';
import { historyManager } from '@/lib/history-manager';
import { createContinuationPrompt, createOptimizationPrompt } from '@/lib/prompts';
import { applyThemePostProcessing } from '@/lib/theme-postprocess';
import { quickOptimize } from '@/lib/tool-registry';
import { validateRepairedXml } from '@/lib/xml-repair';

const MAX_CONTINUATIONS = 3;
const EMPTY_DOCUMENT_SOURCES = new Set(['history', 'restore', 'clear', 'undo-redo', 'undo', 'redo']);
const AUTO_PRESERVE_DRAFT_SOURCES = new Set(['canvas', 'tool', 'undo-redo', 'undo', 'redo']);
const MXFILE_METADATA = new Set(['host', 'modified', 'agent', 'etag', 'version', 'type', 'pages', 'compressed']);
const GRAPH_EDITOR_ATTRIBUTES = new Set(['dx', 'dy', 'grid', 'gridSize', 'guides', 'tooltips', 'connect', 'arrows', 'fold']);
const GRAPH_DISPLAY_DEFAULTS = { page: '1', pageScale: '1', pageWidth: '850', pageHeight: '1100' };
const ELEMENT_TYPES = new Set(['rectangle', 'ellipse', 'diamond', 'text', 'arrow']);

function isMaxTokensStop(stopReason) {
  return stopReason === 'length' || stopReason === 'max_tokens';
}

function styleKey(style) {
  const blocks = [];
  let properties = new Map();
  const flushProperties = () => {
    if (properties.size) {
      blocks.push([...properties].sort(([a], [b]) => a.localeCompare(b)));
      properties = new Map();
    }
  };
  for (const token of style.split(';').map((part) => part.trim()).filter(Boolean)) {
    const separator = token.indexOf('=');
    if (separator < 0) {
      // Named styles can override earlier properties; keep their order.
      flushProperties();
      blocks.push(token);
    } else {
      properties.set(token.slice(0, separator).trim(), token.slice(separator + 1).trim());
    }
  }
  flushProperties();
  return blocks;
}

// Ignore serialization differences and draw.io's volatile mxfile metadata.
// Actual page names, cell attributes, geometry and labels remain in the key.
function documentKey(doc, missingPageIds) {
  let pageIndex = -1;
  const visit = (node) => {
    if (node.nodeType === 1) {
      const currentPage = node.tagName === 'diagram' ? ++pageIndex : -1;
      const attributes = [...node.attributes]
        .filter((attribute) => node.tagName !== 'mxfile' || !MXFILE_METADATA.has(attribute.name))
        .filter((attribute) => node.tagName !== 'mxGraphModel' || !GRAPH_EDITOR_ATTRIBUTES.has(attribute.name))
        .filter((attribute) => currentPage < 0 || attribute.name !== 'id' || !missingPageIds.has(currentPage))
        .map((attribute) => [attribute.name, attribute.name === 'style' ? styleKey(attribute.value) : attribute.value]);
      if (node.tagName === 'mxGraphModel') {
        for (const [name, defaultValue] of Object.entries(GRAPH_DISPLAY_DEFAULTS)) {
          if (!node.hasAttribute(name)) attributes.push([name, defaultValue]);
        }
      }
      if (currentPage >= 0 && !node.hasAttribute('name')) {
        attributes.push(['name', `Page-${currentPage + 1}`]);
      }
      attributes.sort(([a], [b]) => a.localeCompare(b));
      return [node.tagName, attributes, [...node.childNodes].map(visit).filter((child) => child !== null)];
    }
    if (node.nodeType === 3 || node.nodeType === 4) {
      return node.nodeValue.trim() ? node.nodeValue : null;
    }
    return null;
  };
  return JSON.stringify(visit(doc.documentElement));
}

function sameDocument(previousXml, nextXml) {
  if (previousXml === nextXml) return true;
  if (!previousXml || !nextXml) return false;
  const parser = new DOMParser();
  const previousDoc = parser.parseFromString(previousXml, 'application/xml');
  const nextDoc = parser.parseFromString(nextXml, 'application/xml');
  // A missing page id gets assigned by the editor. Ignore only those ids;
  // replacing an already explicit page id remains a document change.
  const missingPageIds = new Set([...previousDoc.getElementsByTagName('diagram')]
    .flatMap((diagram, index) => diagram.getAttribute('id') ? [] : [index]));
  return documentKey(previousDoc, missingPageIds) === documentKey(nextDoc, missingPageIds);
}

function validateDocument(xml, source) {
  if (typeof xml !== 'string') return 'Diagram XML must be a string.';
  if (!xml.trim()) {
    return EMPTY_DOCUMENT_SOURCES.has(source) ? null : 'Diagram XML is empty.';
  }
  const validation = validateRepairedXml(xml);
  if (!validation.isValid) return validation.error || 'Diagram XML is invalid. The current diagram was kept.';
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (!['mxfile', 'mxGraphModel'].includes(doc.documentElement?.tagName)) {
    return 'Expected a draw.io mxfile or mxGraphModel document.';
  }
  return null;
}

function isEmptyCanvasPlaceholder(xml) {
  if (!xml) return false;
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const diagrams = doc.getElementsByTagName('diagram');
  const models = doc.getElementsByTagName('mxGraphModel');
  if (diagrams.length !== 1 || models.length !== 1) return false;
  const cells = [...models[0].getElementsByTagName('mxCell')];
  return cells.length === 2
    && cells.some((cell) => cell.getAttribute('id') === '0')
    && cells.some((cell) => cell.getAttribute('id') === '1' && cell.getAttribute('parent') === '0')
    && cells.every((cell) => !cell.hasAttribute('vertex') && !cell.hasAttribute('edge'));
}

function escapeXml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

// Preserve legacy JSON output compatibility while committing one XML document.
function elementsToXml(elements) {
  const cells = elements.map((element, index) => {
    if (!element || typeof element !== 'object' || Array.isArray(element) || !ELEMENT_TYPES.has(element.type)) {
      throw new Error(`Invalid JSON diagram element at index ${index}: unsupported or missing type.`);
    }
    for (const name of ['x', 'y', 'width', 'height']) {
      if (element[name] !== undefined && (typeof element[name] !== 'number' || !Number.isFinite(element[name]))) {
        throw new Error(`Invalid JSON diagram element at index ${index}: ${name} must be a finite number.`);
      }
      if (element.type !== 'arrow' && ['width', 'height'].includes(name) && element[name] !== undefined && element[name] <= 0) {
        throw new Error(`Invalid JSON diagram element at index ${index}: ${name} must be positive.`);
      }
    }
    if ((element.text !== undefined && typeof element.text !== 'string')
      || (element.label !== undefined && (element.label === null || typeof element.label !== 'object' || Array.isArray(element.label)
        || (element.label.text !== undefined && typeof element.label.text !== 'string')))) {
      throw new Error(`Invalid JSON diagram element at index ${index}: text and label.text must be strings.`);
    }
    for (const name of ['backgroundColor', 'strokeColor']) {
      if (element[name] !== undefined && typeof element[name] !== 'string') {
        throw new Error(`Invalid JSON diagram element at index ${index}: ${name} must be a string.`);
      }
    }
    const id = index + 2;
    const x = element.x ?? 0;
    const y = element.y ?? 0;
    const width = element.width ?? 120;
    const height = element.height ?? 60;
    const label = escapeXml(element.type === 'text' ? element.text : element.label?.text);
    if (element.type === 'arrow') {
      return `<mxCell id="${id}" value="${label}" edge="1" parent="1" style="edgeStyle=orthogonalEdgeStyle;html=1;"><mxGeometry relative="1" as="geometry"><mxPoint x="${x}" y="${y}" as="sourcePoint"/><mxPoint x="${x + width}" y="${y + (Number(element.height) || 0)}" as="targetPoint"/></mxGeometry></mxCell>`;
    }
    const shape = { rectangle: 'rounded=1;', ellipse: 'ellipse;', diamond: 'rhombus;', text: 'text;strokeColor=none;fillColor=none;' }[element.type];
    const style = `${shape}whiteSpace=wrap;html=1;fillColor=${element.backgroundColor || '#ffffff'};strokeColor=${element.strokeColor || '#000000'};`;
    return `<mxCell id="${id}" value="${label}" vertex="1" parent="1" style="${escapeXml(style)}"><mxGeometry x="${x}" y="${y}" width="${width}" height="${height}" as="geometry"/></mxCell>`;
  }).join('');
  return `<mxfile><diagram name="Page-1"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>${cells}</root></mxGraphModel></diagram></mxfile>`;
}

export function useGenerationWorkflow({ config, currentTheme, pushToHistory, onNotify, onRequireConfig, onShowCodePanel }) {
  const [generatedCode, updateGeneratedCode] = useState('');
  const [generatedXml, updateGeneratedXml] = useState('');
  const [elements, setElements] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplyingCode, setIsApplyingCode] = useState(false);
  const [isOptimizingCode, setIsOptimizingCode] = useState(false);
  const [isOptimizationPanelOpen, setIsOptimizationPanelOpen] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [jsonError, setJsonError] = useState(null);
  const [currentInput, setCurrentInput] = useState('');
  const [currentChartType, setCurrentChartType] = useState('auto');
  const [isTruncated, setIsTruncated] = useState(false);
  const [canContinue, setCanContinue] = useState(false);
  const [continuationAttempts, setContinuationAttempts] = useState(0);
  const [blueprintPhase, setBlueprintPhase] = useState(null);
  const [showBlueprint, setShowBlueprint] = useState(false);
  const documentRef = useRef({ xml: '', code: '', input: '', chartType: 'auto', attempts: 0, truncated: false });
  const taskRef = useRef(null);
  const nextTaskIdRef = useRef(0);
  const callbacksRef = useRef(null);
  callbacksRef.current = { config, currentTheme, pushToHistory, onNotify, onRequireConfig, onShowCodePanel };

  const writeCode = useCallback((code) => {
    documentRef.current.code = code;
    updateGeneratedCode(code);
  }, []);

  const setParseState = useCallback((result, attempts = result.continuationAttempts ?? 0) => {
    documentRef.current.attempts = attempts;
    documentRef.current.truncated = result.isTruncated;
    setJsonError(result.jsonError ?? null);
    setIsTruncated(Boolean(result.isTruncated));
    setCanContinue(Boolean(result.canContinue) && attempts < MAX_CONTINUATIONS);
    setContinuationAttempts(attempts);
  }, []);

  const cancelTask = useCallback(() => {
    const task = taskRef.current;
    taskRef.current = null;
    if (task) {
      if (task.timer) clearTimeout(task.timer);
      task.controller.abort();
    }
  }, []);

  /** Commit an applied document, preserving a dirty editor draft on canvas saves. */
  const commitDocument = useCallback((xml, { source = 'programmatic', recordHistory = true, preserveDraft = false, taskId = null } = {}) => {
    const error = validateDocument(xml, source);
    if (error) {
      setJsonError(error);
      return { ok: false, error };
    }
    const previous = documentRef.current;
    const nextXml = xml.trim();
    // The iframe loads a synthetic empty mxfile when the app has no document.
    // Its delayed autosave can arrive after generation starts; it is still a
    // load echo, not a user edit that should supersede that task.
    if (source === 'canvas' && !previous.xml && isEmptyCanvasPlaceholder(nextXml)) {
      return { ok: true, xml: previous.xml, changed: false };
    }
    const changed = !sameDocument(previous.xml, nextXml);
    if (!changed && source === 'canvas') {
      return { ok: true, xml: previous.xml, changed: false };
    }
    // A user document operation supersedes any in-flight AI operation. A
    // generated commit carries its owner id and must still own the task.
    if (taskId !== null && taskRef.current?.id !== taskId) {
      return { ok: false, error: 'This generation task is no longer active.' };
    }
    const interruptedTask = taskRef.current && taskId === null;
    if (interruptedTask) {
      cancelTask();
      setIsGenerating(false);
      setBlueprintPhase(BLUEPRINT_PHASE.REVEAL);
    }
    const keepDraft = preserveDraft || (AUTO_PRESERVE_DRAFT_SOURCES.has(source) && previous.code !== previous.xml);
    if (changed && recordHistory) {
      callbacksRef.current.pushToHistory?.(previous.xml);
      callbacksRef.current.pushToHistory?.(nextXml);
    }
    previous.xml = nextXml;
    updateGeneratedXml(nextXml);
    setElements([]);
    if (!keepDraft) {
      writeCode(nextXml);
      setParseState({ isTruncated: false, canContinue: false, jsonError: null }, 0);
    } else if (interruptedTask) {
      setParseState(parseGeneratedContent(previous.code, {
        autoRepair: false,
        continuationAttempts: previous.attempts,
      }), previous.attempts);
    }
    return { ok: true, xml: nextXml, changed };
  }, [cancelTask, setParseState, writeCode]);

  useEffect(() => () => cancelTask(), [cancelTask]);

  const isCurrentTask = useCallback((task) => taskRef.current?.id === task.id && !task.controller.signal.aborted, []);

  const beginTask = useCallback((kind, details = {}) => {
    cancelTask();
    const task = {
      id: ++nextTaskIdRef.current,
      controller: new AbortController(),
      timer: null,
      kind,
      code: '',
      attempts: 0,
      config: callbacksRef.current.config,
      theme: callbacksRef.current.currentTheme,
      input: documentRef.current.input,
      chartType: documentRef.current.chartType,
      ...details,
    };
    taskRef.current = task;
    setIsGenerating(true);
    setApiError(null);
    setJsonError(null);
    return task;
  }, [cancelTask]);

  const waitForTask = useCallback((task) => new Promise((resolve, reject) => {
    const signal = task.controller.signal;
    const handleAbort = () => {
      clearTimeout(task.timer);
      task.timer = null;
      reject(new DOMException('Generation was cancelled.', 'AbortError'));
    };
    if (signal.aborted) {
      handleAbort();
      return;
    }
    signal.addEventListener('abort', handleAbort, { once: true });
    task.timer = setTimeout(() => {
      signal.removeEventListener('abort', handleAbort);
      task.timer = null;
      resolve();
    }, 500);
  }), []);

  const tryParseAndApply = useCallback((code, { source = 'programmatic', autoRepair = false, theme = callbacksRef.current.currentTheme, attempts = 0, taskId = null } = {}) => {
    try {
      const result = parseGeneratedContent(code, { autoRepair, continuationAttempts: attempts });
      writeCode(result.generatedCode ?? code);
      setParseState(result, attempts);
      const shouldApply = result.shouldApply ?? ['xml', 'repaired', 'json'].includes(result.status);
      if (!shouldApply) return { ...result, committed: false };
      let xml = result.status === 'json' ? elementsToXml(result.elements) : result.generatedXml;
      const processed = applyThemePostProcessing(xml, theme);
      xml = processed.xml || xml;
      const committed = commitDocument(xml, { source, taskId });
      if (!committed.ok) {
        return { ...result, status: 'invalid', shouldApply: false, committed: false, jsonError: committed.error };
      }
      if (result.notification) callbacksRef.current.onNotify?.(result.notification);
      return { ...result, generatedXml: committed.xml, generatedCode: committed.xml, committed: true };
    } catch (error) {
      const message = `Parse failed: ${error.message}`;
      setJsonError(message);
      return { status: 'invalid', shouldApply: false, committed: false, jsonError: message };
    }
  }, [commitDocument, setParseState, writeCode]);

  const streamGenerate = useCallback(async (task, body, onChunk) => {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: task.controller.signal,
    });
    if (!isCurrentTask(task)) throw new DOMException('Generation was cancelled.', 'AbortError');
    if (!response.ok) throw new Error(await resolveResponseErrorMessage(response, 'Generate failed'));
    return readSSEStream(response.body, (code) => {
      if (isCurrentTask(task)) onChunk(code);
    }, { signal: task.controller.signal });
  }, [isCurrentTask]);

  // A single task owns its complete request/continuation/retry chain. The
  // next request uses task.code, never an earlier React render's draft.
  const runGeneration = useCallback(async (task, { userInput, startWithContinuation = false, retryUsed = false } = {}) => {
    let continuing = startWithContinuation;
    try {
      while (isCurrentTask(task)) {
        if (continuing) {
          task.attempts += 1;
          documentRef.current.attempts = task.attempts;
          setContinuationAttempts(task.attempts);
          setCanContinue(false);
        }
        const originalCode = continuing ? task.code : '';
        const requestInput = continuing
          ? createContinuationPrompt(originalCode, { originalRequest: task.input, chartType: task.chartType })
          : userInput;
        const { text, meta } = await streamGenerate(task, {
          config: task.config,
          userInput: normalizeUserInput(requestInput),
          chartType: continuing || task.kind === 'optimization' ? 'auto' : task.chartType,
          theme: task.theme,
          ...(continuing ? { isContinuation: true } : {}),
        }, (code) => {
          task.code = postProcessDrawioCode(continuing ? `${originalCode}${stripXmlHeaders(code)}` : code);
          writeCode(task.code);
          if (task.kind === 'generation') setBlueprintPhase(BLUEPRINT_PHASE.DRAFTING);
        });
        if (!isCurrentTask(task)) return;
        task.code = postProcessDrawioCode(continuing ? `${originalCode}${stripXmlHeaders(text)}` : text);
        writeCode(task.code);
        const result = parseGeneratedContent(task.code, { autoRepair: false, continuationAttempts: task.attempts });
        const shouldApply = result.shouldApply ?? ['xml', 'repaired', 'json'].includes(result.status);
        if (isMaxTokensStop(meta?.stopReason) && !shouldApply && result.status === 'truncated') {
          setParseState(result, task.attempts);
          if (task.attempts < MAX_CONTINUATIONS) {
            await waitForTask(task);
            continuing = true;
            continue;
          }
        }
        const applied = tryParseAndApply(task.code, { source: task.kind, theme: task.theme, attempts: task.attempts, taskId: task.id });
        if (!isCurrentTask(task)) return;
        callbacksRef.current.onShowCodePanel?.();
        if (applied.status === 'invalid' && task.kind === 'generation' && !retryUsed) {
          retryUsed = true;
          continuing = false;
          task.attempts = 0;
          await waitForTask(task);
          continue;
        }
        if (task.code && (applied.committed || applied.status === 'truncated')) {
          historyManager.addHistory({
            chartType: task.chartType,
            userInput: task.input,
            generatedCode: applied.generatedCode || task.code,
            config: { name: task.config?.name || task.config?.type || 'server', model: task.config?.model || 'unknown' },
          });
        }
        if (task.kind === 'optimization' && applied.committed) {
          callbacksRef.current.onNotify?.({ title: 'Optimization complete', message: 'The diagram code has been refreshed.', type: 'info' });
        }
        return applied;
      }
    } catch (error) {
      if (!isCurrentTask(task) || error.name === 'AbortError') return;
      setApiError(isNetworkError(error)
        ? 'Network request failed. Please check your connection.'
        : sanitizeError(error.message));
      if (task.code) {
        const result = parseGeneratedContent(task.code, { autoRepair: false, continuationAttempts: task.attempts });
        setParseState(result, task.attempts);
      }
    } finally {
      if (isCurrentTask(task)) {
        taskRef.current = null;
        setIsGenerating(false);
        if (task.kind === 'generation') setBlueprintPhase(BLUEPRINT_PHASE.REVEAL);
      }
    }
  }, [isCurrentTask, setParseState, streamGenerate, tryParseAndApply, waitForTask, writeCode]);

  const handleStopGeneration = useCallback(() => {
    cancelTask();
    setIsGenerating(false);
    setApiError(null);
    setBlueprintPhase(BLUEPRINT_PHASE.REVEAL);
    if (documentRef.current.code) {
      const result = parseGeneratedContent(documentRef.current.code, {
        autoRepair: false,
        continuationAttempts: documentRef.current.attempts,
      });
      setParseState(result, documentRef.current.attempts);
    }
  }, [cancelTask, setParseState]);

  const handleBlueprintRevealComplete = useCallback(() => {
    if (taskRef.current?.kind === 'generation') return;
    setShowBlueprint(false);
    setBlueprintPhase(null);
  }, []);

  const handleSendMessage = useCallback(async (userMessage, chartType = 'auto', isRetry = false) => {
    if (!isConfigValid(callbacksRef.current.config)) {
      callbacksRef.current.onRequireConfig?.();
      return;
    }
    documentRef.current.input = userMessage;
    documentRef.current.chartType = chartType;
    documentRef.current.attempts = 0;
    documentRef.current.truncated = false;
    setCurrentInput(userMessage);
    setCurrentChartType(chartType);
    setContinuationAttempts(0);
    setIsTruncated(false);
    setCanContinue(false);
    setShowBlueprint(true);
    setBlueprintPhase(BLUEPRINT_PHASE.SCANNING);
    const task = beginTask('generation', { input: userMessage, chartType });
    return runGeneration(task, { userInput: userMessage, retryUsed: isRetry });
  }, [beginTask, runGeneration]);

  const handleContinueGeneration = useCallback(async () => {
    const document = documentRef.current;
    if (taskRef.current || !document.code.trim() || !document.truncated) return;
    if (document.attempts >= MAX_CONTINUATIONS) {
      callbacksRef.current.onNotify?.({ title: 'Continuation limit', message: 'The maximum of 3 continuation attempts has been reached.', type: 'warning' });
      setCanContinue(false);
      return;
    }
    if (!isConfigValid(callbacksRef.current.config)) {
      callbacksRef.current.onRequireConfig?.();
      return;
    }
    const task = beginTask('continuation', { code: document.code, attempts: document.attempts });
    return runGeneration(task, { startWithContinuation: true });
  }, [beginTask, runGeneration]);

  // Typing a draft cancels an active generation so subsequent chunks cannot
  // overwrite the user's edit. Internal stream updates use writeCode instead.
  const setGeneratedCode = useCallback((value) => {
    if (taskRef.current) handleStopGeneration();
    writeCode(typeof value === 'function' ? value(documentRef.current.code) : value ?? '');
  }, [handleStopGeneration, writeCode]);

  const setGeneratedXml = useCallback((value) => {
    const xml = typeof value === 'function' ? value(documentRef.current.xml) : value;
    return commitDocument(xml, { source: 'history', recordHistory: false });
  }, [commitDocument]);

  const handleApplyCode = useCallback(async () => {
    cancelTask();
    setIsGenerating(false);
    setIsApplyingCode(true);
    try {
      return tryParseAndApply(documentRef.current.code, { source: 'code', autoRepair: true });
    } finally {
      setIsApplyingCode(false);
    }
  }, [cancelTask, tryParseAndApply]);

  const handleOptimizeCode = useCallback(() => {
    const code = documentRef.current.code.trim();
    if (!code) return;
    const error = validateDocument(code, 'optimization');
    if (error) {
      setJsonError(error);
      return;
    }
    setIsOptimizingCode(true);
    try {
      const result = quickOptimize(code);
      if (!result.changed) {
        callbacksRef.current.onNotify?.({ title: '优化', message: '当前优化规则没有产生改动。', type: 'info' });
        return;
      }
      const committed = commitDocument(result.xml, { source: 'optimization' });
      if (committed.ok) {
        callbacksRef.current.onNotify?.({ title: '优化完成', message: result.applied.map((entry) => entry.message).join('；') || '优化已应用。', type: 'success' });
      }
      return committed;
    } finally {
      setIsOptimizingCode(false);
    }
  }, [commitDocument]);

  const handleClearCode = useCallback(() => {
    setGeneratedCode('');
    setParseState({ isTruncated: false, canContinue: false, jsonError: null }, 0);
  }, [setGeneratedCode, setParseState]);

  const handleOpenOptimizationPanel = useCallback(() => {
    if (!documentRef.current.code.trim()) {
      callbacksRef.current.onNotify?.({ title: 'Hint', message: 'Generate diagram code before opening advanced optimization.', type: 'warning' });
      return;
    }
    setIsOptimizationPanelOpen(true);
  }, []);
  const handleCloseOptimizationPanel = useCallback(() => setIsOptimizationPanelOpen(false), []);

  const handleAdvancedOptimize = useCallback(async (suggestions) => {
    if (!documentRef.current.code.trim()) return;
    if (!isConfigValid(callbacksRef.current.config)) {
      callbacksRef.current.onRequireConfig?.();
      return;
    }
    setIsOptimizationPanelOpen(false);
    const prompt = createOptimizationPrompt(documentRef.current.code, suggestions);
    const task = beginTask('optimization');
    return runGeneration(task, { userInput: prompt });
  }, [beginTask, runGeneration]);

  const handleApplyHistory = useCallback((history) => {
    cancelTask();
    setIsGenerating(false);
    documentRef.current.input = history.userInput;
    documentRef.current.chartType = history.chartType;
    setCurrentInput(history.userInput);
    setCurrentChartType(history.chartType);
    const result = tryParseAndApply(history.generatedCode, { source: 'history', autoRepair: false });
    callbacksRef.current.onShowCodePanel?.();
    return result;
  }, [cancelTask, tryParseAndApply]);

  const handleDrawioXmlChange = useCallback((xml) => commitDocument(xml, { source: 'canvas' }), [commitDocument]);

  const restoreWorkspace = useCallback((snapshot) => {
    if (!snapshot || typeof snapshot !== 'object') return { ok: false, error: 'Invalid workspace snapshot.' };
    const xml = snapshot.generatedXml ?? '';
    const error = validateDocument(xml, 'restore');
    if (error || (snapshot.generatedCode !== undefined && typeof snapshot.generatedCode !== 'string')) {
      return { ok: false, error: error || 'Invalid workspace draft.' };
    }
    cancelTask();
    setIsGenerating(false);
    setApiError(null);
    setShowBlueprint(false);
    setBlueprintPhase(null);
    commitDocument(xml, { source: 'restore', recordHistory: false });
    const draft = snapshot.generatedCode ?? xml;
    writeCode(draft);
    documentRef.current.input = snapshot.currentInput ?? '';
    documentRef.current.chartType = snapshot.currentChartType || 'auto';
    setCurrentInput(documentRef.current.input);
    setCurrentChartType(documentRef.current.chartType);
    if (draft !== xml && draft.trim()) {
      setParseState(parseGeneratedContent(draft, { autoRepair: false }), 0);
    }
    return { ok: true };
  }, [cancelTask, commitDocument, setParseState, writeCode]);

  return {
    apiError, blueprintPhase, canContinue, continuationAttempts, currentChartType, currentInput, elements,
    generatedCode, generatedXml, isApplyingCode, isGenerating, isOptimizationPanelOpen, isOptimizingCode,
    isTruncated, jsonError, setApiError, setGeneratedCode, setGeneratedXml, setJsonError, showBlueprint,
    commitDocument, restoreWorkspace, handleAdvancedOptimize, handleApplyCode, handleApplyHistory,
    handleBlueprintRevealComplete, handleClearCode, handleCloseOptimizationPanel, handleContinueGeneration,
    handleDrawioXmlChange, handleOpenOptimizationPanel, handleOptimizeCode, handleSendMessage, handleStopGeneration,
  };
}
