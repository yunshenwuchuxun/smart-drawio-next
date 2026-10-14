import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useGenerationWorkflow } from '@/lib/hooks/use-generation-workflow';
import { useXmlHistory } from '@/lib/hooks/use-xml-history';

vi.mock('@/lib/theme-postprocess', () => ({ applyThemePostProcessing: (xml) => ({ xml }) }));
vi.mock('@/lib/history-manager', () => ({ historyManager: { addHistory: vi.fn() } }));

const CONFIG = { type: 'openai', baseUrl: 'https://api.example.com', apiKey: 'test', model: 'test-model' };
const xml = (label) => `<mxfile><diagram name="Page-1"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="2" value="${label}" vertex="1" parent="1"><mxGeometry x="0" y="0" width="100" height="60" as="geometry"/></mxCell></root></mxGraphModel></diagram></mxfile>`;
const PARTIAL = '<mxfile><diagram name="Page-1"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="2" value="fresh';
const FINISH = ' output" vertex="1" parent="1"><mxGeometry x="0" y="0" width="100" height="60" as="geometry"/></mxCell></root></mxGraphModel></diagram></mxfile>';
const EMPTY_PLACEHOLDER = '<mxfile><diagram id="empty" name="Page-1"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel></diagram></mxfile>';
const normalizedEcho = (value) => value.replace('<mxfile>', '<mxfile pages="1" compressed="false">')
  .replace('<diagram name="Page-1">', '<diagram id="editor-assigned-id" name="Page-1">')
  .replace('<mxGraphModel>', '<mxGraphModel page="1" pageScale="1" pageWidth="850" pageHeight="1100" dx="200" dy="300" grid="1" gridSize="10">');

function response(events, done = true) {
  const encoder = new TextEncoder();
  return {
    ok: true,
    body: new ReadableStream({ start(controller) {
      for (const event of events) controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      if (done) controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    } }),
  };
}

function setup() {
  const props = { config: CONFIG, currentTheme: 'research', pushToHistory: vi.fn(), onNotify: vi.fn(), onRequireConfig: vi.fn(), onShowCodePanel: vi.fn() };
  return { ...renderHook(() => useGenerationWorkflow(props)), props };
}

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.useRealTimers(); });

async function flushStream() {
  await act(async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); });
}

describe('document commits and drafts', () => {
  it('records both sides of a code apply and rejects invalid XML without replacing the diagram', async () => {
    const { result, props } = setup();
    act(() => { result.current.commitDocument(xml('before')); });
    props.pushToHistory.mockClear();
    act(() => { result.current.setGeneratedCode(xml('after')); });
    await act(async () => { await result.current.handleApplyCode(); });
    expect(props.pushToHistory.mock.calls.map(([entry]) => entry)).toEqual([xml('before'), xml('after')]);
    act(() => { result.current.commitDocument('<mxfile><broken/></mxfile>'); });
    expect(result.current.generatedXml).toBe(xml('after'));
    expect(result.current.jsonError).toBeTruthy();
  });

  it.each([
    [{ type: 'unsupported' }],
    [{}],
    [null],
    [{ type: 'rectangle', x: 'bad' }],
    [{ type: 'rectangle', width: -1 }],
    [{ type: 'text', text: { invalid: true } }],
  ])('rejects invalid JSON elements and retains the original document and JSON draft: %j', async (...entries) => {
    const { result, props } = setup();
    const draft = JSON.stringify(entries);
    act(() => { result.current.commitDocument(xml('original')); result.current.setGeneratedCode(draft); });
    props.pushToHistory.mockClear();
    await act(async () => { await result.current.handleApplyCode(); });
    expect(result.current.generatedXml).toBe(xml('original'));
    expect(result.current.generatedCode).toBe(draft);
    expect(result.current.jsonError).toContain('Invalid JSON diagram element');
    expect(props.pushToHistory).not.toHaveBeenCalled();
  });

  it('treats an explicit empty JSON array as an undoable empty diagram', async () => {
    const { result, props } = setup();
    act(() => { result.current.commitDocument(xml('original')); result.current.setGeneratedCode('[]'); });
    props.pushToHistory.mockClear();
    await act(async () => { await result.current.handleApplyCode(); });
    const doc = new DOMParser().parseFromString(result.current.generatedXml, 'application/xml');
    expect(doc.getElementsByTagName('mxCell')).toHaveLength(2);
    expect(result.current.generatedXml).not.toContain('value="original"');
    expect(props.pushToHistory.mock.calls.map(([entry]) => entry)).toEqual([xml('original'), result.current.generatedXml]);
    expect(result.current.jsonError).toBeNull();
  });

  it('keeps the redo branch when the iframe adds packaging, a missing page id and default page display attributes', () => {
    const props = { config: CONFIG, currentTheme: 'research' };
    const { result } = renderHook(() => {
      const history = useXmlHistory({ onApplyXml: (value) => result.current.workflow.commitDocument(value, { source: 'undo-redo', recordHistory: false }) });
      const workflow = useGenerationWorkflow({ ...props, pushToHistory: history.pushToHistory });
      return { history, workflow };
    });
    act(() => { result.current.workflow.commitDocument(xml('A')); result.current.workflow.commitDocument(xml('B')); });
    act(() => { result.current.history.handleUndo(); });
    const snapshots = result.current.history.xmlHistory;
    expect(snapshots.length - result.current.history.historyIndex - 1).toBe(1);
    act(() => { result.current.workflow.handleDrawioXmlChange(normalizedEcho(xml('A'))); });
    expect(result.current.history.xmlHistory).toEqual(snapshots);
    expect(result.current.history.xmlHistory.length - result.current.history.historyIndex - 1).toBe(1);
    act(() => { result.current.history.handleRedo(); });
    expect(result.current.workflow.generatedXml).toBe(xml('B'));
  });

  it('retains real page size and explicit page identity changes', () => {
    const { result, props } = setup();
    const original = xml('original').replace('<diagram name=', '<diagram id="stable" name=');
    act(() => { result.current.commitDocument(original); });
    props.pushToHistory.mockClear();
    const resized = normalizedEcho(original).replace('pageWidth="850"', 'pageWidth="1200"');
    act(() => { result.current.handleDrawioXmlChange(resized); });
    expect(result.current.generatedXml).toContain('pageWidth="1200"');
    expect(props.pushToHistory).toHaveBeenCalledTimes(2);
    props.pushToHistory.mockClear();
    act(() => { result.current.handleDrawioXmlChange(resized.replace('id="stable"', 'id="new-page-id"')); });
    expect(result.current.generatedXml).toContain('id="new-page-id"');
    expect(props.pushToHistory).toHaveBeenCalledTimes(2);
  });

  it('recognizes serialized load echoes and keeps an unapplied editor draft on a real canvas edit', () => {
    const { result, props } = setup();
    act(() => { result.current.commitDocument(xml('original')); });
    act(() => { result.current.setGeneratedCode('<mxfile>my unfinished draft'); });
    props.pushToHistory.mockClear();
    const echo = xml('original').replace('<mxfile>', '<mxfile modified="yesterday" host="test">').replace(/\"/g, "'");
    act(() => { result.current.handleDrawioXmlChange(echo); });
    expect(result.current.generatedCode).toBe('<mxfile>my unfinished draft');
    expect(result.current.generatedXml).toBe(xml('original'));
    expect(props.pushToHistory).not.toHaveBeenCalled();
    act(() => { result.current.handleDrawioXmlChange(xml('canvas edit')); });
    expect(result.current.generatedXml).toBe(xml('canvas edit'));
    expect(result.current.generatedCode).toBe('<mxfile>my unfinished draft');
    expect(props.pushToHistory.mock.calls.map(([entry]) => entry)).toEqual([xml('original'), xml('canvas edit')]);
  });

  it('accepts the first real canvas edit after a programmatic update', () => {
    const { result } = setup();
    act(() => { result.current.commitDocument(xml('generated')); });
    act(() => { result.current.handleDrawioXmlChange(xml('first manual change')); });
    expect(result.current.generatedXml).toBe(xml('first manual change'));
    expect(result.current.generatedCode).toBe(xml('first manual change'));
  });

  it('commits the first real canvas node when the workspace has no document', () => {
    const { result, props } = setup();
    act(() => { result.current.handleDrawioXmlChange(xml('first real node')); });
    expect(result.current.generatedXml).toBe(xml('first real node'));
    expect(result.current.generatedCode).toBe(xml('first real node'));
    expect(props.pushToHistory.mock.calls.map(([entry]) => entry)).toEqual(['', xml('first real node')]);
  });

  it('commits clearing an existing diagram to an empty canvas', () => {
    const { result, props } = setup();
    act(() => { result.current.commitDocument(xml('existing node')); });
    props.pushToHistory.mockClear();
    act(() => { result.current.handleDrawioXmlChange(EMPTY_PLACEHOLDER); });
    expect(result.current.generatedXml).toBe(EMPTY_PLACEHOLDER);
    expect(result.current.generatedCode).toBe(EMPTY_PLACEHOLDER);
    expect(props.pushToHistory.mock.calls.map(([entry]) => entry)).toEqual([xml('existing node'), EMPTY_PLACEHOLDER]);
  });

  it('ignores viewport/editor defaults and equivalent style serialization, while retaining real style changes', () => {
    const { result, props } = setup();
    const original = xml('styled').replace('vertex="1"', 'style="rounded=1;fillColor=#ffffff;" vertex="1"');
    act(() => { result.current.commitDocument(original); });
    act(() => { result.current.setGeneratedCode('my unapplied draft'); });
    props.pushToHistory.mockClear();
    const echo = original.replace('<mxGraphModel>', '<mxGraphModel dx="100" dy="200" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1">')
      .replace('rounded=1;fillColor=#ffffff;', 'fillColor=#ffffff;rounded=1');
    act(() => { result.current.handleDrawioXmlChange(echo); });
    expect(result.current.generatedXml).toBe(original);
    expect(result.current.generatedCode).toBe('my unapplied draft');
    expect(props.pushToHistory).not.toHaveBeenCalled();
    act(() => { result.current.handleDrawioXmlChange(echo.replace('#ffffff', '#ff0000')); });
    expect(result.current.generatedXml).toContain('#ff0000');
    expect(props.pushToHistory).toHaveBeenCalledTimes(2);
  });

  it.each(['tool', 'undo-redo'])('%s operations retain dirty drafts but update a clean editor', (source) => {
    const { result } = setup();
    act(() => { result.current.commitDocument(xml('first')); });
    act(() => { result.current.commitDocument(xml('clean update'), { source }); });
    expect(result.current.generatedCode).toBe(xml('clean update'));
    act(() => { result.current.setGeneratedCode(xml('unapplied code')); });
    act(() => { result.current.commitDocument(xml('second update'), { source }); });
    expect(result.current.generatedXml).toBe(xml('second update'));
    expect(result.current.generatedCode).toBe(xml('unapplied code'));
  });

  it('restores applied XML and a separate invalid draft, and accepts the empty undo starting point', () => {
    const { result, props } = setup();
    act(() => { result.current.restoreWorkspace({ generatedXml: xml('saved'), generatedCode: PARTIAL, currentInput: 'saved request', currentChartType: 'flowchart' }); });
    expect(result.current.generatedXml).toBe(xml('saved'));
    expect(result.current.generatedCode).toBe(PARTIAL);
    expect(result.current.currentInput).toBe('saved request');
    expect(result.current.currentChartType).toBe('flowchart');
    expect(result.current.canContinue).toBe(true);
    expect(props.pushToHistory).not.toHaveBeenCalled();
    act(() => { result.current.commitDocument('', { source: 'history', recordHistory: false }); });
    expect(result.current.generatedXml).toBe('');
    expect(result.current.generatedCode).toBe('');
  });
});

describe('generation task lifecycle', () => {
  it('ignores a delayed initial empty-canvas autosave during generation', async () => {
    let streamController;
    const encoder = new TextEncoder();
    const fetch = vi.fn().mockResolvedValue({ ok: true, body: new ReadableStream({ start(controller) { streamController = controller; } }) });
    vi.stubGlobal('fetch', fetch);
    const { result, props } = setup();
    let pending;
    act(() => { pending = result.current.handleSendMessage('first diagram'); });
    await flushStream();
    await act(async () => { streamController.enqueue(encoder.encode(`data: ${JSON.stringify({ content: PARTIAL })}\n\n`)); });
    act(() => { result.current.handleDrawioXmlChange(EMPTY_PLACEHOLDER); });
    expect(result.current.isGenerating).toBe(true);
    expect(fetch.mock.calls[0][1].signal.aborted).toBe(false);
    expect(result.current.generatedXml).toBe('');
    expect(result.current.generatedCode).toBe(PARTIAL);
    expect(props.pushToHistory).not.toHaveBeenCalled();
    await act(async () => {
      streamController.enqueue(encoder.encode(`data: ${JSON.stringify({ content: FINISH })}\n\ndata: [DONE]\n\n`));
      streamController.close();
      await pending;
    });
    expect(result.current.generatedXml).toContain('value="fresh output"');
  });

  it('continues the freshly received prefix and commits the finished diagram once', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(response([{ content: PARTIAL }, { meta: { stopReason: 'length' } }]))
      .mockResolvedValueOnce(response([{ content: FINISH }]));
    vi.stubGlobal('fetch', fetch);
    const { result, props } = setup();
    let pending;
    act(() => { pending = result.current.handleSendMessage('new request', 'flowchart'); });
    await flushStream();
    expect(result.current.isGenerating).toBe(true);
    expect(result.current.generatedXml).toBe('');
    await act(async () => { await vi.advanceTimersByTimeAsync(500); await pending; });
    const continuation = JSON.parse(fetch.mock.calls[1][1].body);
    expect(continuation.userInput).toContain('value="fresh');
    expect(continuation.userInput).toContain('new request');
    expect(continuation.isContinuation).toBe(true);
    expect(result.current.generatedXml).toContain('value="fresh output"');
    expect(result.current.isGenerating).toBe(false);
    expect(props.pushToHistory).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['continuation', [{ content: PARTIAL }, { meta: { stopReason: 'max_tokens' } }]],
    ['retry', [{ content: 'invalid model output' }]],
  ])('cancels a scheduled %s and retains the existing canvas', async (_kind, events) => {
    const fetch = vi.fn().mockResolvedValue(response(events));
    vi.stubGlobal('fetch', fetch);
    const { result } = setup();
    act(() => { result.current.commitDocument(xml('old diagram')); });
    let pending;
    act(() => { pending = result.current.handleSendMessage('request'); });
    await flushStream();
    act(() => { result.current.handleStopGeneration(); });
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); await pending; });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][1].signal.aborted).toBe(true);
    expect(result.current.generatedXml).toBe(xml('old diagram'));
    expect(result.current.isGenerating).toBe(false);
  });

  it('ignores an older request that resolves after the new request', async () => {
    let resolveOld;
    const fetch = vi.fn()
      .mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve; }))
      .mockResolvedValueOnce(response([{ content: xml('new diagram') }]));
    vi.stubGlobal('fetch', fetch);
    const { result } = setup();
    let oldPending;
    act(() => { oldPending = result.current.handleSendMessage('old request'); });
    await act(async () => { await result.current.handleSendMessage('new request'); });
    await act(async () => { resolveOld(response([{ content: xml('old diagram') }])); await oldPending; });
    expect(result.current.generatedXml).toBe(xml('new diagram'));
    expect(result.current.currentInput).toBe('new request');
    expect(result.current.isGenerating).toBe(false);
  });

  it('a normalization-only canvas echo does not cancel the active task or replace a draft', async () => {
    let resolveRequest;
    const fetch = vi.fn().mockImplementation(() => new Promise((resolve) => { resolveRequest = resolve; }));
    vi.stubGlobal('fetch', fetch);
    const { result, props } = setup();
    act(() => { result.current.commitDocument(xml('before')); result.current.setGeneratedCode('unapplied draft'); });
    props.pushToHistory.mockClear();
    let pending;
    act(() => { pending = result.current.handleSendMessage('request'); });
    act(() => { result.current.handleDrawioXmlChange(normalizedEcho(xml('before'))); });
    expect(fetch.mock.calls[0][1].signal.aborted).toBe(false);
    expect(result.current.isGenerating).toBe(true);
    expect(result.current.generatedCode).toBe('unapplied draft');
    expect(props.pushToHistory).not.toHaveBeenCalled();
    act(() => { result.current.handleStopGeneration(); });
    await act(async () => { resolveRequest(response([{ content: xml('late') }])); await pending; });
  });

  it('propagates server errors and incomplete EOF, keeping streamed output as a draft', async () => {
    const fetch = vi.fn().mockResolvedValue(response([{ content: PARTIAL }, { error: 'Provider timeout' }], false));
    vi.stubGlobal('fetch', fetch);
    const { result } = setup();
    act(() => { result.current.commitDocument(xml('old diagram')); });
    await act(async () => { await result.current.handleSendMessage('request'); });
    expect(result.current.apiError).toBe('Provider timeout');
    expect(result.current.generatedXml).toBe(xml('old diagram'));
    expect(result.current.generatedCode).toBe(PARTIAL);
    expect(result.current.canContinue).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('stops after three continuations and never applies an incomplete graph', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(response([{ content: PARTIAL }, { meta: { stopReason: 'length' } }]))
      .mockImplementation(() => Promise.resolve(response([{ content: ' more' }, { meta: { stopReason: 'length' } }])));
    vi.stubGlobal('fetch', fetch);
    const { result } = setup();
    let pending;
    act(() => { pending = result.current.handleSendMessage('request'); });
    await flushStream();
    await act(async () => { await vi.advanceTimersByTimeAsync(1500); await pending; });
    expect(fetch).toHaveBeenCalledTimes(4);
    expect(result.current.continuationAttempts).toBe(3);
    expect(result.current.canContinue).toBe(false);
    expect(result.current.generatedXml).toBe('');
    expect(result.current.isTruncated).toBe(true);
  });

  it('cancels the active request when restoring a workspace', async () => {
    let resolveRequest;
    const fetch = vi.fn().mockImplementation(() => new Promise((resolve) => { resolveRequest = resolve; }));
    vi.stubGlobal('fetch', fetch);
    const { result } = setup();
    let pending;
    act(() => { pending = result.current.handleSendMessage('request'); });
    act(() => { result.current.restoreWorkspace({ generatedXml: xml('recovered'), generatedCode: 'my draft' }); });
    await act(async () => { resolveRequest(response([{ content: xml('late output') }])); await pending; });
    expect(fetch.mock.calls[0][1].signal.aborted).toBe(true);
    expect(result.current.generatedXml).toBe(xml('recovered'));
    expect(result.current.generatedCode).toBe('my draft');
  });

  it.each(['canvas', 'tool'])('a real %s edit supersedes the active generation', async (source) => {
    let streamController;
    const encoder = new TextEncoder();
    const fetch = vi.fn().mockResolvedValue({ ok: true, body: new ReadableStream({ start(controller) { streamController = controller; } }) });
    vi.stubGlobal('fetch', fetch);
    const { result } = setup();
    act(() => { result.current.commitDocument(xml('before')); });
    let pending;
    act(() => { pending = result.current.handleSendMessage('request'); });
    await flushStream();
    await act(async () => { streamController.enqueue(encoder.encode(`data: ${JSON.stringify({ content: PARTIAL })}\n\n`)); });
    act(() => { result.current.commitDocument(xml('user change'), { source }); });
    await act(async () => { await pending; });
    expect(fetch.mock.calls[0][1].signal.aborted).toBe(true);
    expect(result.current.generatedXml).toBe(xml('user change'));
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.generatedCode).toBe(PARTIAL);
  });
});
