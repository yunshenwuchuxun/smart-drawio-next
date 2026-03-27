import { describe, expect, it, vi } from 'vitest';

import {
  buildGenerateMessages,
  createGenerateEventStream,
  createVisionModelError,
  isImageInput,
  supportsVisionModel,
  validateGeneratePayload,
} from '@/lib/generate-route-utils';

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
    expect(validateGeneratePayload({ config: { type: 'openai' }, userInput: 'diagram' })).toBeNull();
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
    expect(output).toContain('"error":"boom"');
  });
});
