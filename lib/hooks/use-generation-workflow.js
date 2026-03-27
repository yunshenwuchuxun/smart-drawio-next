import { useCallback, useRef, useState } from 'react';

import { BLUEPRINT_PHASE } from '@/lib/blueprint-phase';
import { isConfigValid } from '@/lib/config';
import { postProcessDrawioCode, readSSEStream, sanitizeError, stripXmlHeaders } from '@/lib/drawio-code-utils';
import {
  isNetworkError,
  normalizeUserInput,
  parseGeneratedContent,
  resolveResponseErrorMessage,
} from '@/lib/generation-utils';
import { historyManager } from '@/lib/history-manager';
import { createContinuationPrompt, createOptimizationPrompt } from '@/lib/prompts';
import { applyThemePostProcessing } from '@/lib/theme-postprocess';
import { quickOptimize } from '@/lib/tool-registry';

function createHistoryEntry({ chartType, userInput, generatedCode, config }) {
  return {
    chartType,
    userInput,
    generatedCode,
    config: {
      name: config?.name || config?.type || 'server',
      model: config?.model || 'unknown',
    },
  };
}

function isMaxTokensStop(stopReason) {
  return stopReason === 'length' || stopReason === 'max_tokens';
}

export function useGenerationWorkflow({
  config,
  currentTheme,
  pushToHistory,
  suppressXmlChangeRef,
  onNotify,
  onRequireConfig,
  onShowCodePanel,
}) {
  const [generatedCode, setGeneratedCode] = useState('');
  const [generatedXml, setGeneratedXml] = useState('');
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
  const abortControllerRef = useRef(null);
  const pendingAutoContinueRef = useRef(false);

  const applyParseResult = useCallback((result) => {
    const postProcessed = applyThemePostProcessing(result.generatedXml, currentTheme);
    const nextXml = postProcessed.xml || result.generatedXml;
    const nextResult = {
      ...result,
      generatedXml: nextXml,
      generatedCode: nextXml || result.generatedCode,
    };

    setJsonError(nextResult.jsonError);
    setIsTruncated(nextResult.isTruncated);
    setCanContinue(nextResult.canContinue);
    setContinuationAttempts(nextResult.continuationAttempts);
    setGeneratedCode(nextResult.generatedCode);
    setGeneratedXml(nextResult.generatedXml);
    setElements(nextResult.elements);

    if (nextResult.notification) {
      onNotify(nextResult.notification);
    }

    return nextResult;
  }, [currentTheme, onNotify]);

  const tryParseAndApply = useCallback((code, autoRepair = false) => {
    try {
      const result = parseGeneratedContent(code, {
        autoRepair,
        continuationAttempts,
      });
      // Suppress the next draw.io autosave echo so it doesn't create
      // phantom history entries for this programmatic XML update.
      if (suppressXmlChangeRef) {
        suppressXmlChangeRef.current = true;
      }
      return applyParseResult(result);
    } catch (error) {
      console.error('Failed to parse generated code:', error);
      setJsonError(
        error instanceof SyntaxError
          ? `Syntax error: ${error.message}`
          : `Parse failed: ${error.message}`
      );
      return null;
    }
  }, [applyParseResult, continuationAttempts]);

  const streamGenerate = useCallback(async ({ body, signal, onChunk, fallbackError = 'Request failed' }) => {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      throw new Error(await resolveResponseErrorMessage(response, fallbackError));
    }

    return readSSEStream(response.body, onChunk);
  }, []);

  const resetGenerationErrors = useCallback(() => {
    setApiError(null);
    setJsonError(null);
  }, []);

  const handleStopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    pendingAutoContinueRef.current = false;
    setIsGenerating(false);
    setApiError(null);

    if (showBlueprint) {
      setBlueprintPhase(BLUEPRINT_PHASE.REVEAL);
    }
  }, [showBlueprint]);

  const handleBlueprintRevealComplete = useCallback(() => {
    setShowBlueprint(false);
    setBlueprintPhase(null);
  }, []);

  const handleContinueGeneration = useCallback(async () => {
    const isAutoContinue = pendingAutoContinueRef.current;
    pendingAutoContinueRef.current = false;

    if (!isAutoContinue && (!generatedCode.trim() || !isTruncated)) {
      return;
    }

    if (continuationAttempts >= 3) {
      onNotify({
        title: 'Continuation limit',
        message: 'The maximum of 3 continuation attempts has been reached.',
        type: 'warning',
      });
      setCanContinue(false);
      return;
    }

    if (!isConfigValid(config)) {
      onRequireConfig();
      return;
    }

    setContinuationAttempts((attempts) => attempts + 1);
    setIsGenerating(true);
    resetGenerationErrors();
    setCanContinue(false);
    abortControllerRef.current = new AbortController();

    const originalCode = generatedCode;
    const continuationPrompt = createContinuationPrompt(generatedCode, {
      originalRequest: currentInput,
      chartType: currentChartType,
    });

    try {
      const { text: accumulatedCode, meta } = await streamGenerate({
        body: {
          config,
          userInput: continuationPrompt,
          chartType: 'auto',
          theme: currentTheme,
          isContinuation: true,
        },
        signal: abortControllerRef.current.signal,
        onChunk: (code) => {
          const merged = `${originalCode}${stripXmlHeaders(code)}`;
          setGeneratedCode(postProcessDrawioCode(merged));
        },
        fallbackError: 'Continuation failed',
      });

      const processedCode = postProcessDrawioCode(`${originalCode}${stripXmlHeaders(accumulatedCode)}`);
      setGeneratedCode(processedCode);

      // Check chain auto-continue BEFORE applying to canvas
      const nextAttempt = continuationAttempts + 1;
      const shouldChainContinue =
        isMaxTokensStop(meta?.stopReason) && nextAttempt < 3;

      if (shouldChainContinue) {
        const parseResult = parseGeneratedContent(processedCode, {
          continuationAttempts: nextAttempt,
        });

        if (parseResult.status !== 'invalid') {
          setIsTruncated(true);
          setCanContinue(true);
          setJsonError(parseResult.jsonError);

          if (processedCode) {
            historyManager.addHistory(createHistoryEntry({
              chartType: currentChartType,
              userInput: `${currentInput} (continued)`,
              generatedCode: processedCode,
              config,
            }));
          }

          pendingAutoContinueRef.current = true;
          setIsGenerating(false);
          abortControllerRef.current = null;
          setTimeout(() => handleContinueGeneration(), 500);
          return;
        }
      }

      // Final continuation or not truncated: apply to canvas
      const appliedResult = tryParseAndApply(processedCode);

      if (processedCode) {
        historyManager.addHistory(createHistoryEntry({
          chartType: currentChartType,
          userInput: `${currentInput} (continued)`,
          generatedCode: appliedResult?.generatedCode || processedCode,
          config,
        }));
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        return;
      }

      setApiError(
        isNetworkError(error)
          ? 'Network request failed. Please check your connection.'
          : sanitizeError(error.message)
      );
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  }, [config, continuationAttempts, currentChartType, currentInput, currentTheme, generatedCode, isTruncated, onNotify, onRequireConfig, resetGenerationErrors, streamGenerate, tryParseAndApply]);

  const handleSendMessage = useCallback(async (userMessage, chartType = 'auto', isRetry = false) => {
    if (!isConfigValid(config)) {
      onRequireConfig();
      return;
    }

    setCurrentInput(userMessage);
    setCurrentChartType(chartType);
    setIsGenerating(true);
    resetGenerationErrors();
    setShowBlueprint(true);
    setBlueprintPhase(BLUEPRINT_PHASE.SCANNING);
    abortControllerRef.current = new AbortController();

    try {
      const cleanedUserInput = normalizeUserInput(userMessage);
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          userInput: cleanedUserInput,
          chartType,
          theme: currentTheme,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(await resolveResponseErrorMessage(response, 'Generate failed'));
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedCode = '';
      let buffer = '';
      let firstChunkReceived = false;
      let streamMeta = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '' || line.trim() === 'data: [DONE]') {
            continue;
          }

          if (!line.startsWith('data: ')) {
            continue;
          }

          try {
            const data = JSON.parse(line.slice(6));
            if (data.meta) {
              streamMeta = data.meta;
            } else if (data.content) {
              if (!firstChunkReceived) {
                firstChunkReceived = true;
                setBlueprintPhase(BLUEPRINT_PHASE.DRAFTING);
              }

              accumulatedCode += data.content;
              setGeneratedCode(postProcessDrawioCode(accumulatedCode));
            } else if (data.error) {
              throw new Error(data.error);
            }
          } catch (error) {
            if (error.message && !error.message.includes('Unexpected')) {
              setApiError(sanitizeError(`Stream parse error: ${error.message}`));
            }
            console.error('Failed to parse SSE:', error);
          }
        }
      }

      setBlueprintPhase(BLUEPRINT_PHASE.REVEAL);
      const processedCode = postProcessDrawioCode(accumulatedCode);
      setGeneratedCode(processedCode);

      // Check auto-continue BEFORE applying to canvas
      const shouldAutoContinue =
        isMaxTokensStop(streamMeta?.stopReason) && continuationAttempts < 3;

      if (shouldAutoContinue) {
        // Parse for status check only — do NOT apply to canvas
        const parseResult = parseGeneratedContent(processedCode, {
          continuationAttempts,
        });

        if (parseResult.status !== 'invalid') {
          setIsTruncated(true);
          setCanContinue(true);
          setJsonError(parseResult.jsonError);
          onShowCodePanel();

          if (userMessage && processedCode) {
            historyManager.addHistory(createHistoryEntry({
              chartType,
              userInput: userMessage,
              generatedCode: processedCode,
              config,
            }));
          }

          pendingAutoContinueRef.current = true;
          setIsGenerating(false);
          abortControllerRef.current = null;
          setTimeout(() => handleContinueGeneration(), 500);
          return;
        }
        // status === 'invalid': fall through to normal apply path
      }

      // Normal path: apply to canvas
      const appliedResult = tryParseAndApply(processedCode);
      onShowCodePanel();

      if (appliedResult?.generatedXml) {
        pushToHistory(appliedResult.generatedXml);
      }

      if (userMessage && processedCode) {
        historyManager.addHistory(createHistoryEntry({
          chartType,
          userInput: userMessage,
          generatedCode: appliedResult?.generatedCode || processedCode,
          config,
        }));
      }

      // Auto-retry once if response is invalid and this is not already a retry
      if (appliedResult?.status === 'invalid' && !isRetry) {
        setIsGenerating(false);
        abortControllerRef.current = null;
        setTimeout(() => handleSendMessage(userMessage, chartType, true), 500);
        return;
      }
    } catch (error) {
      console.error('Error generating code:', error);
      if (error.name === 'AbortError') {
        return;
      }

      setApiError(
        isNetworkError(error)
          ? 'Network request failed. Please check your connection.'
          : sanitizeError(error.message)
      );
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  }, [config, currentTheme, handleContinueGeneration, onRequireConfig, onShowCodePanel, resetGenerationErrors, tryParseAndApply]);

  const applyGeneratedCode = useCallback(async (setPendingState) => {
    setPendingState(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      tryParseAndApply(generatedCode);
    } catch (error) {
      console.error('Error applying code:', error);
    } finally {
      setPendingState(false);
    }
  }, [generatedCode, tryParseAndApply]);

  const handleApplyCode = useCallback(async () => {
    await applyGeneratedCode(setIsApplyingCode);
  }, [applyGeneratedCode]);

  const handleOptimizeCode = useCallback(() => {
    const code = generatedCode.trim();
    if (!code) return;

    setIsOptimizingCode(true);
    try {
      const result = quickOptimize(code);
      if (!result.changed) {
        onNotify({ title: '优化', message: '图表已是最优状态，无需调整。', type: 'info' });
        return;
      }
      pushToHistory(generatedXml);
      setGeneratedCode(result.xml);
      const applied = tryParseAndApply(result.xml);
      if (applied?.generatedXml) {
        pushToHistory(applied.generatedXml);
      }

      const summary = result.applied.map(a => a.message).join('；');
      onNotify({ title: '优化完成', message: summary || '优化已应用。', type: 'success' });
    } finally {
      setIsOptimizingCode(false);
    }
  }, [generatedCode, generatedXml, onNotify, pushToHistory, tryParseAndApply]);

  const handleClearCode = useCallback(() => {
    setGeneratedCode('');
  }, []);

  const handleOpenOptimizationPanel = useCallback(() => {
    if (!generatedCode.trim()) {
      onNotify({
        title: 'Hint',
        message: 'Generate diagram code before opening advanced optimization.',
        type: 'warning',
      });
      return;
    }

    setIsOptimizationPanelOpen(true);
  }, [generatedCode, onNotify]);

  const handleCloseOptimizationPanel = useCallback(() => {
    setIsOptimizationPanelOpen(false);
  }, []);

  const handleAdvancedOptimize = useCallback(async (suggestions) => {
    if (!generatedCode.trim()) {
      return;
    }

    if (!isConfigValid(config)) {
      onRequireConfig();
      return;
    }

    setIsOptimizationPanelOpen(false);
    setIsGenerating(true);
    resetGenerationErrors();
    abortControllerRef.current = new AbortController();

    try {
      pushToHistory(generatedXml);
      const optimizationPrompt = createOptimizationPrompt(generatedCode, suggestions);
      const { text: accumulatedCode } = await streamGenerate({
        body: {
          config,
          userInput: optimizationPrompt,
          chartType: 'auto',
          theme: currentTheme,
        },
        signal: abortControllerRef.current.signal,
        onChunk: (code) => setGeneratedCode(postProcessDrawioCode(code)),
        fallbackError: 'Optimize failed',
      });

      const processedCode = postProcessDrawioCode(accumulatedCode);
      setGeneratedCode(processedCode);
      const applied = tryParseAndApply(processedCode);
      if (applied?.generatedXml) {
        pushToHistory(applied.generatedXml);
      }
      onNotify({
        title: 'Optimization complete',
        message: 'The diagram code has been refreshed.',
        type: 'info',
      });
    } catch (error) {
      if (error.name === 'AbortError') {
        return;
      }

      setApiError(
        isNetworkError(error)
          ? 'Network request failed. Please check your connection.'
          : sanitizeError(error.message)
      );
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  }, [config, currentTheme, generatedCode, generatedXml, onNotify, onRequireConfig, pushToHistory, resetGenerationErrors, streamGenerate, tryParseAndApply]);

  const handleApplyHistory = useCallback((history) => {
    setCurrentInput(history.userInput);
    setCurrentChartType(history.chartType);
    setGeneratedCode(history.generatedCode);
    tryParseAndApply(history.generatedCode);
    onShowCodePanel();
  }, [onShowCodePanel, tryParseAndApply]);

  const handleDrawioXmlChange = useCallback((newXml) => {
    if (suppressXmlChangeRef?.current) {
      suppressXmlChangeRef.current = false;
      return;
    }
    if (newXml && newXml !== generatedXml) {
      pushToHistory(generatedXml);
      pushToHistory(newXml);
      setGeneratedXml(newXml);
      setGeneratedCode(newXml);
    }
  }, [generatedXml, pushToHistory, suppressXmlChangeRef]);

  return {
    apiError,
    blueprintPhase,
    canContinue,
    currentChartType,
    currentInput,
    elements,
    generatedCode,
    generatedXml,
    isApplyingCode,
    isGenerating,
    isOptimizationPanelOpen,
    isOptimizingCode,
    isTruncated,
    jsonError,
    setApiError,
    setGeneratedCode,
    setGeneratedXml,
    setJsonError,
    showBlueprint,
    handleAdvancedOptimize,
    handleApplyCode,
    handleApplyHistory,
    handleBlueprintRevealComplete,
    handleClearCode,
    handleCloseOptimizationPanel,
    handleContinueGeneration,
    handleDrawioXmlChange,
    handleOpenOptimizationPanel,
    handleOptimizeCode,
    handleSendMessage,
    handleStopGeneration,
  };
}
