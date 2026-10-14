// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { callLLM, fetchModels, getBaseUrlCandidates, publicLlmError } from '@/lib/llm-client';

const CONFIG = { type: 'openai', baseUrl: 'http://localhost:11434/v1', apiKey: 'sk-private-test', model: 'local-model' };
const MESSAGES = [{ role: 'user', content: 'generate a diagram' }];

function createSseStream(chunks) {
  const encoder = new TextEncoder();

  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
}

describe('llm-client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('adds Docker host aliases for loopback base URLs', () => {
    expect(getBaseUrlCandidates('http://localhost:11434/v1/')).toEqual([
      'http://localhost:11434/v1',
      'http://host.docker.internal:11434/v1',
      'http://gateway.docker.internal:11434/v1',
    ]);
  });

  it('retries model requests through Docker host aliases after a loopback fetch failure', async () => {
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ id: 'gpt-4.1-mini', name: 'gpt-4.1-mini' }],
        }),
      });

    vi.stubGlobal('fetch', fetchMock);

    const models = await fetchModels('openai', 'http://localhost:11434/v1', 'sk-test');

    expect(models).toEqual([{ id: 'gpt-4.1-mini', name: 'gpt-4.1-mini' }]);
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      'http://localhost:11434/v1/models',
      'http://host.docker.internal:11434/v1/models',
    ]);
  });

  it('retries streaming generation requests through Docker host aliases after a loopback fetch failure', async () => {
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce({
        ok: true,
        body: createSseStream([
          'data: {"choices":[{"delta":{"content":"<mxfile>"}}]}\n',
          'data: {"choices":[{"delta":{"content":"</mxfile>"},"finish_reason":"stop"}]}\n',
          'data: [DONE]\n\n',
        ]),
      });

    vi.stubGlobal('fetch', fetchMock);

    const onChunk = vi.fn();
    const result = await callLLM(
      {
        type: 'openai',
        baseUrl: 'http://localhost:11434/v1',
        apiKey: 'sk-test',
        model: 'gpt-4.1-mini',
      },
      [{ role: 'user', content: 'generate a diagram' }],
      onChunk
    );

    expect(result).toEqual({ text: '<mxfile></mxfile>', stopReason: 'stop' });
    expect(onChunk).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      'http://localhost:11434/v1/chat/completions',
      'http://host.docker.internal:11434/v1/chat/completions',
    ]);
  });

  it('does not start a request when already cancelled', async () => {
    const controller = new AbortController();
    controller.abort();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(callLLM(CONFIG, MESSAGES, null, { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('aborts a stalled fetch without trying Docker aliases', async () => {
    const controller = new AbortController();
    let upstreamSignal;
    const fetchMock = vi.fn((_url, init) => {
      upstreamSignal = init.signal;
      return new Promise(() => {});
    });
    vi.stubGlobal('fetch', fetchMock);
    const result = callLLM(CONFIG, MESSAGES, null, { signal: controller.signal });
    const assertion = expect(result).rejects.toMatchObject({ name: 'AbortError' });
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    controller.abort(new Error('caller reason containing a secret'));
    await assertion;
    expect(upstreamSignal.aborted).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('never retries an upstream AbortError as a network failure', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new DOMException('sk-private-test', 'AbortError'));
    vi.stubGlobal('fetch', fetchMock);
    await expect(callLLM(CONFIG, MESSAGES)).rejects.toMatchObject({ name: 'AbortError', message: 'Generation cancelled.' });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('cancels the provider reader while waiting for more tokens', async () => {
    const cancel = vi.fn();
    const stream = new ReadableStream({
      start(controller) { controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"partial"}}]}\n\n')); },
      cancel,
    });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, body: stream });
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();
    const onChunk = vi.fn();
    const result = callLLM(CONFIG, MESSAGES, onChunk, { signal: controller.signal });
    const assertion = expect(result).rejects.toMatchObject({ name: 'AbortError' });
    await vi.waitFor(() => expect(onChunk).toHaveBeenCalledWith('partial'));
    controller.abort();
    await assertion;
    expect(cancel).toHaveBeenCalledOnce();
    expect(stream.locked).toBe(false);
  });

  it.each([
    [{ timeoutMs: 10, idleTimeoutMs: 100 }, 'LLM_TIMEOUT'],
    [{ timeoutMs: 100, idleTimeoutMs: 10 }, 'LLM_IDLE_TIMEOUT'],
  ])('enforces fetch deadlines and aborts upstream (%s)', async (options, code) => {
    vi.useFakeTimers();
    let upstreamSignal;
    const fetchMock = vi.fn((_url, init) => {
      upstreamSignal = init.signal;
      return new Promise(() => {});
    });
    vi.stubGlobal('fetch', fetchMock);
    const assertion = expect(callLLM(CONFIG, MESSAGES, null, options)).rejects.toMatchObject({ code, name: 'TimeoutError' });
    await vi.advanceTimersByTimeAsync(10);
    await assertion;
    expect(upstreamSignal.aborted).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('keeps the total deadline even when provider heartbeats reset the idle deadline', async () => {
    vi.useFakeTimers();
    let heartbeat;
    const cancel = vi.fn(() => clearInterval(heartbeat));
    const stream = new ReadableStream({
      start(controller) { heartbeat = setInterval(() => controller.enqueue(new TextEncoder().encode(': ping\n\n')), 5); },
      cancel,
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, body: stream }));
    const assertion = expect(callLLM(CONFIG, MESSAGES, null, { timeoutMs: 30, idleTimeoutMs: 10 }))
      .rejects.toMatchObject({ code: 'LLM_TIMEOUT' });
    await vi.advanceTimersByTimeAsync(30);
    await assertion;
    expect(cancel).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('decodes split UTF-8 and processes the final unterminated SSE line', async () => {
    const encoded = new TextEncoder().encode('data:{"choices":[{"delta":{"content":"图表"},"finish_reason":"stop"}]}');
    const stream = new ReadableStream({ start(controller) {
      for (const byte of encoded) controller.enqueue(Uint8Array.of(byte));
      controller.close();
    } });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, body: stream }));
    await expect(callLLM(CONFIG, MESSAGES)).resolves.toEqual({ text: '图表', stopReason: 'stop' });
  });

  it('processes Anthropic final stop reason without a trailing newline', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, body: createSseStream([
      'event: content_block_delta\r\ndata: {"type":"content_block_delta","delta":{"text":"diagram"}}\r\n\r\n',
      'data: {"type":"message_delta","delta":{"stop_reason":"max_tokens"}}',
    ]) }));
    await expect(callLLM({ ...CONFIG, type: 'anthropic' }, MESSAGES)).resolves.toEqual({ text: 'diagram', stopReason: 'max_tokens' });
  });

  it.each([
    ['data: {"choices":[{"delta":{"content":"partial"}}]}\n\n', 'PROVIDER_STREAM_INCOMPLETE'],
    ['data: {bad JSON containing sk-private-test}\n\n', 'PROVIDER_STREAM_INVALID'],
    ['data: [DONE]\n\n', 'PROVIDER_EMPTY'],
    ['data: {"error":{"message":"sk-private-test"}}\n\n', 'PROVIDER_ERROR'],
    ['data: {"type":"error","error":{"message":"sk-private-test"}}\n\n', 'PROVIDER_ERROR'],
  ])('rejects incomplete, malformed, empty and error streams (%s)', async (event, code) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, body: createSseStream([event]) }));
    await expect(callLLM(CONFIG, MESSAGES)).rejects.toMatchObject({ code });
  });

  it('propagates provider errors after partial content instead of succeeding', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, body: createSseStream([
      'data: {"choices":[{"delta":{"content":"partial"}}]}\n\n',
      'data: {"error":{"message":"sk-private-test"}}\n\n',
      'data: [DONE]\n\n',
    ]) }));
    const onChunk = vi.fn();
    const error = await callLLM(CONFIG, MESSAGES, onChunk).catch((error) => error);
    expect(onChunk).toHaveBeenCalledWith('partial');
    expect(error.code).toBe('PROVIDER_ERROR');
    expect(error.message).not.toContain(CONFIG.apiKey);
    expect(publicLlmError(error)).not.toContain(CONFIG.apiKey);
  });

  it('does not read or echo unsuccessful provider response bodies', async () => {
    const text = vi.fn().mockResolvedValue(CONFIG.apiKey);
    const cancel = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401, text, body: { cancel } }));
    await expect(callLLM(CONFIG, MESSAGES)).rejects.toMatchObject({ code: 'PROVIDER_ERROR' });
    expect(text).not.toHaveBeenCalled();
    expect(cancel).toHaveBeenCalledOnce();
    expect(publicLlmError(new Error(CONFIG.apiKey))).not.toContain(CONFIG.apiKey);
  });

  it('cleans up deadlines and the reader after success', async () => {
    vi.useFakeTimers();
    const stream = createSseStream(['data: {"choices":[{"delta":{"content":"complete"}}]}\n\ndata: [DONE]\n\n']);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, body: stream }));
    await callLLM(CONFIG, MESSAGES);
    expect(stream.locked).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });
});
