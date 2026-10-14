// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/llm-client', async (importOriginal) => ({
  ...await importOriginal(), callLLM: vi.fn(),
}));
vi.mock('@/lib/rate-limiter', () => ({
  checkRateLimit: vi.fn(() => ({ allowed: true })),
  getClientIp: vi.fn(() => 'test'),
  rateLimitResponse: vi.fn(() => new Response('', { status: 429 })),
}));
vi.mock('@/lib/logger', () => ({ debug: vi.fn(), error: vi.fn() }));

import { POST, maxDuration, runtime } from '@/app/api/generate/route';
import { callLLM } from '@/lib/llm-client';
import { error as logError } from '@/lib/logger';
import { MAX_GENERATE_BODY_BYTES } from '@/lib/schemas';

const CONFIG = { type: 'openai', baseUrl: 'http://localhost:11434/v1', apiKey: 'sk-private-test', model: 'local-model' };
const PAYLOAD = { config: CONFIG, userInput: 'diagram' };
function request(payload = PAYLOAD, options = {}) {
  return new Request('https://example.com/api/generate', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload), ...options,
  });
}

describe('generation route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    callLLM.mockImplementation(async (_config, _messages, onChunk) => {
      onChunk('<mxfile></mxfile>');
      return { text: '<mxfile></mxfile>', stopReason: 'stop' };
    });
  });

  it('keeps the Node deployment and permits local providers', async () => {
    expect(runtime).toBe('nodejs');
    expect(maxDuration).toBe(300);
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/event-stream');
    const text = await response.text();
    expect(text).toContain('<mxfile></mxfile>');
    expect(text).toContain('[DONE]');
    expect(callLLM.mock.calls[0][0]).toEqual(CONFIG);
    expect(callLLM.mock.calls[0][3].signal).toBeInstanceOf(AbortSignal);
  });

  it.each([null, {}, { ...PAYLOAD, config: { ...CONFIG, apiKey: {} } }, { ...PAYLOAD, chartType: 'missing' }])
    ('rejects invalid generation payload %# before calling a provider', async (payload) => {
      const response = await POST(request(payload));
      expect(response.status).toBe(400);
      expect(await response.text()).not.toContain(CONFIG.apiKey);
      expect(callLLM).not.toHaveBeenCalled();
    });

  it('treats malformed JSON as a client error without echoing its contents', async () => {
    const response = await POST(request(PAYLOAD, { body: `invalid-${CONFIG.apiKey}` }));
    expect(response.status).toBe(400);
    expect(await response.text()).not.toContain(CONFIG.apiKey);
    expect(callLLM).not.toHaveBeenCalled();
  });

  it('returns 413 before accepting an oversized request', async () => {
    const response = await POST(request(PAYLOAD, { headers: { 'Content-Length': String(MAX_GENERATE_BODY_BYTES + 1) } }));
    expect(response.status).toBe(413);
    expect(callLLM).not.toHaveBeenCalled();
  });

  it('does not emit DONE or leak credentials on a model failure', async () => {
    callLLM.mockImplementation(async (_config, _messages, onChunk) => {
      onChunk('partial');
      throw new Error(`provider echoed ${CONFIG.apiKey}`);
    });
    const response = await POST(request());
    const text = await response.text();
    expect(text).toContain('"error":"Failed to generate code"');
    expect(text).not.toContain('[DONE]');
    expect(text).not.toContain(CONFIG.apiKey);
    expect(logError.mock.calls[0][1].message).not.toContain(CONFIG.apiKey);
  });

  it('cancels generation when the response consumer disconnects', async () => {
    let signal;
    callLLM.mockImplementation((_config, _messages, _onChunk, options) => {
      signal = options.signal;
      return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }));
    });
    const response = await POST(request());
    await response.body.cancel();
    expect(signal.aborted).toBe(true);
    expect(logError).not.toHaveBeenCalled();
  });

  it('propagates request cancellation to the model after headers are returned', async () => {
    let signal;
    callLLM.mockImplementation((_config, _messages, _onChunk, options) => {
      signal = options.signal;
      return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }));
    });
    const controller = new AbortController();
    const response = await POST(request(PAYLOAD, { signal: controller.signal }));
    const assertion = expect(response.text()).rejects.toMatchObject({ name: 'AbortError' });
    controller.abort();
    await assertion;
    expect(signal.aborted).toBe(true);
    expect(logError).not.toHaveBeenCalled();
  });
});
