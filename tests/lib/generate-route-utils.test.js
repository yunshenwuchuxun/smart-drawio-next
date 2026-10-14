// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

import {
  buildGenerateMessages,
  createGenerateEventStream,
  createVisionModelError,
  isImageInput,
  readGeneratePayload,
  supportsVisionModel,
  validateGeneratePayload,
} from '@/lib/generate-route-utils';
import { GeneratePayloadSchema, MAX_GENERATE_BODY_BYTES, MAX_GENERATE_IMAGE_BYTES, MAX_GENERATE_TEXT_CHARS } from '@/lib/schemas';

const CONFIG = { type: 'openai', baseUrl: 'http://localhost:11434/v1', apiKey: 'sk-private-test', model: 'local-model' };
const PAYLOAD = { config: CONFIG, userInput: 'diagram' };

async function readStream(stream) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let output = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    output += decoder.decode(value, { stream: true });
  }

  output += decoder.decode();
  return output;
}

describe('generate-route-utils', () => {
  it('validates required payload fields', () => {
    expect(validateGeneratePayload({})).toBe('Missing required parameters: config, userInput');
    expect(validateGeneratePayload(PAYLOAD)).toBeNull();
    expect(validateGeneratePayload(null)).toBe('Missing required parameters: config, userInput');
  });

  it('accepts localhost and arbitrary HTTP(S) providers without requiring a saved config name', () => {
    expect(GeneratePayloadSchema.parse(PAYLOAD)).toMatchObject({ chartType: 'auto', theme: 'research', isContinuation: false });
    expect(validateGeneratePayload({ ...PAYLOAD, config: { ...CONFIG, baseUrl: 'https://custom.example/api/v1' } })).toBeNull();
    expect(validateGeneratePayload({ ...PAYLOAD, config: { ...CONFIG, baseUrl: 'http://192.168.1.15:8000/v1' } })).toBeNull();
  });

  it.each([
    { userInput: 42 }, { userInput: '   ' }, { userInput: {} },
    { chartType: 'unsupported' }, { theme: 'unsupported' }, { isContinuation: 'true' },
    { config: { ...CONFIG, type: 'unsupported' } },
    { config: { ...CONFIG, model: {} } },
    { config: { ...CONFIG, apiKey: { encrypted: 'secret' } } },
    { config: { ...CONFIG, baseUrl: 'file:///etc/passwd' } },
    { config: { ...CONFIG, baseUrl: 'not-a-url' } },
    { config: { ...CONFIG, baseUrl: 'https://user:sk-private-test@example.com/v1' } },
    { config: { ...CONFIG, baseUrl: 'https://example.com/v1?key=sk-private-test' } },
    { userInput: 'x'.repeat(MAX_GENERATE_TEXT_CHARS + 1) },
    { userInput: { image: { data: 'not base64', mimeType: 'image/png' } } },
    { userInput: { image: { data: 'YQ==', mimeType: 'image/svg+xml' } } },
  ])('rejects invalid payload case %# without echoing keys', (override) => {
    const error = validateGeneratePayload({ ...PAYLOAD, ...override });
    expect(error).toBeTypeOf('string');
    expect(error).not.toContain(CONFIG.apiKey);
  });

  it('validates image data and decoded size', () => {
    expect(validateGeneratePayload({ ...PAYLOAD, userInput: { image: { data: 'YQ==', mimeType: 'image/png' } } })).toBeNull();
    const oversized = Buffer.alloc(MAX_GENERATE_IMAGE_BYTES + 1).toString('base64');
    expect(validateGeneratePayload({ ...PAYLOAD, userInput: { image: { data: oversized, mimeType: 'image/png' } } })).toBeTypeOf('string');
  });

  it('reads valid JSON and reports malformed JSON without its contents', async () => {
    const request = new Request('https://example.com/api/generate', { method: 'POST', body: JSON.stringify(PAYLOAD) });
    await expect(readGeneratePayload(request)).resolves.toEqual(PAYLOAD);
    const invalid = new Request('https://example.com/api/generate', { method: 'POST', body: CONFIG.apiKey });
    await expect(readGeneratePayload(invalid)).rejects.toMatchObject({ code: 'BODY_INVALID', message: 'Request body must contain valid JSON.' });
  });

  it('enforces request size for chunked bodies and cancels oversized uploads', async () => {
    const cancel = vi.fn();
    const body = new ReadableStream({ start(controller) {
      controller.enqueue(new Uint8Array(MAX_GENERATE_BODY_BYTES));
      controller.enqueue(new Uint8Array(1));
    }, cancel });
    const request = new Request('https://example.com/api/generate', { method: 'POST', body, duplex: 'half' });
    await expect(readGeneratePayload(request)).rejects.toMatchObject({ code: 'BODY_TOO_LARGE' });
    expect(cancel).toHaveBeenCalledOnce();
    expect(body.locked).toBe(false);
  });

  it('detects image input and vision-capable models', () => {
    expect(isImageInput({ image: { data: 'abc', mimeType: 'image/png' } })).toBe(true);
    expect(isImageInput('plain text')).toBe(false);
    expect(supportsVisionModel('gpt-4o')).toBe(true);
    expect(supportsVisionModel('gpt-4.1-mini')).toBe(true);
    expect(supportsVisionModel('gpt-3.5-turbo')).toBe(false);
    expect(createVisionModelError('gpt-3.5-turbo')).toContain('gpt-3.5-turbo');
  });

  it('builds text and image generation messages', () => {
    const textMessages = buildGenerateMessages({
      userInput: 'Build a flowchart for onboarding',
      chartType: 'flowchart',
      theme: 'research',
    });
    const imageMessages = buildGenerateMessages({
      userInput: {
        text: 'Describe the uploaded figure',
        image: { data: 'abc', mimeType: 'image/png' },
      },
      chartType: 'architecture',
    });

    expect(textMessages).toHaveLength(2);
    expect(textMessages[0].role).toBe('system');
    expect(textMessages[0].content).toContain('顶会标准');
    expect(textMessages[0].content).toContain('edgeStyle=orthogonalEdgeStyle');
    expect(textMessages[1].content).toContain('流程图');
    expect(imageMessages[1]).toEqual(expect.objectContaining({
      role: 'user',
      image: { data: 'abc', mimeType: 'image/png' },
    }));
  });

  it('streams SSE chunks and done markers', async () => {
    const stream = createGenerateEventStream({
      config: { model: 'gpt-4o' },
      messages: [],
      callLLM: vi.fn().mockImplementation(async (_config, _messages, onChunk) => {
        onChunk('hello');
        onChunk(' world');
        return { text: 'hello world', stopReason: null };
      }),
    });

    const output = await readStream(stream);

    expect(output).toContain('"content":"hello"');
    expect(output).toContain('"content":" world"');
    expect(output).toContain('data: [DONE]');
  });

  it('includes meta event with stopReason when present', async () => {
    const stream = createGenerateEventStream({
      config: { model: 'gpt-4o' },
      messages: [],
      callLLM: vi.fn().mockImplementation(async (_config, _messages, onChunk) => {
        onChunk('partial');
        return { text: 'partial', stopReason: 'length' };
      }),
    });

    const output = await readStream(stream);

    expect(output).toContain('"meta"');
    expect(output).toContain('"stopReason":"length"');
    expect(output).toContain('data: [DONE]');
  });

  it('omits meta event when stopReason is null', async () => {
    const stream = createGenerateEventStream({
      config: { model: 'gpt-4o' },
      messages: [],
      callLLM: vi.fn().mockImplementation(async (_config, _messages, onChunk) => {
        onChunk('done');
        return { text: 'done', stopReason: null };
      }),
    });

    const output = await readStream(stream);

    expect(output).not.toContain('"meta"');
    expect(output).toContain('data: [DONE]');
  });

  it('streams errors when the provider call fails', async () => {
    const onStreamError = vi.fn();
    const stream = createGenerateEventStream({
      config: { model: 'gpt-4o' },
      messages: [],
      callLLM: vi.fn().mockRejectedValue(new Error('boom')),
      onStreamError,
    });

    const output = await readStream(stream);

    expect(onStreamError).toHaveBeenCalled();
    expect(output).toContain('"error":"Failed to generate code"');
    expect(output).not.toContain('data: [DONE]');
  });

  it('never forwards sensitive provider error messages to the stream or logger callback', async () => {
    const onStreamError = vi.fn();
    const stream = createGenerateEventStream({ config: CONFIG, messages: [],
      callLLM: vi.fn().mockRejectedValue(new Error(`Provider echoed ${CONFIG.apiKey}`)), onStreamError });
    const output = await readStream(stream);
    expect(output).not.toContain(CONFIG.apiKey);
    expect(onStreamError.mock.calls[0][0].message).not.toContain(CONFIG.apiKey);
    expect(output).not.toContain('[DONE]');
  });

  it('still closes an error response when error reporting itself fails', async () => {
    const stream = createGenerateEventStream({ config: CONFIG, messages: [],
      callLLM: vi.fn().mockRejectedValue(new Error('provider failed')),
      onStreamError: () => { throw new Error('logger failed'); } });
    const output = await readStream(stream);
    expect(output).toContain('"error":"Failed to generate code"');
    expect(output).not.toContain('[DONE]');
  });

  it('aborts an in-flight model call immediately when the output stream is cancelled', async () => {
    let upstreamSignal;
    const callLLM = vi.fn((_config, _messages, _onChunk, { signal }) => {
      upstreamSignal = signal;
      return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }));
    });
    const onStreamError = vi.fn();
    const stream = createGenerateEventStream({ config: CONFIG, messages: [], callLLM, onStreamError });
    await stream.cancel();
    expect(upstreamSignal.aborted).toBe(true);
    await Promise.resolve();
    expect(onStreamError).not.toHaveBeenCalled();
  });

  it('propagates request cancellation and prevents late chunks from being enqueued', async () => {
    const requestController = new AbortController();
    let sendChunk;
    let upstreamSignal;
    let resolveModel;
    const callLLM = vi.fn((_config, _messages, onChunk, { signal }) => {
      sendChunk = onChunk;
      upstreamSignal = signal;
      return new Promise((resolve) => { resolveModel = resolve; });
    });
    const stream = createGenerateEventStream({ config: CONFIG, messages: [], callLLM, signal: requestController.signal });
    const reader = stream.getReader();
    const assertion = expect(reader.read()).rejects.toMatchObject({ name: 'AbortError' });
    requestController.abort();
    await assertion;
    expect(upstreamSignal.aborted).toBe(true);
    expect(() => sendChunk('late content')).not.toThrow();
    resolveModel({ stopReason: 'stop' });
    reader.releaseLock();
  });

  it('does not invoke the model for a pre-aborted request', async () => {
    const controller = new AbortController();
    controller.abort();
    const callLLM = vi.fn();
    const stream = createGenerateEventStream({ config: CONFIG, messages: [], callLLM, signal: controller.signal });
    await expect(readStream(stream)).rejects.toMatchObject({ name: 'AbortError' });
    expect(callLLM).not.toHaveBeenCalled();
  });
});
