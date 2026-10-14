import { CONTINUATION_SYSTEM_PROMPT, buildSystemPrompt, USER_PROMPT_TEMPLATE } from '@/lib/prompts';
import { DEFAULT_THEME_ID } from '@/lib/themes';
import { GeneratePayloadSchema, MAX_GENERATE_BODY_BYTES } from '@/lib/schemas';
import { publicLlmError } from '@/lib/llm-client';

const VISION_MODEL_KEYWORDS = [
  'vision',
  'gpt-4o',
  'gpt-4.1',
  'gpt-4-turbo',
  'claude-3',
  'claude-sonnet',
  'claude-opus',
  'claude-haiku',
];

export const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
};

export function validateGeneratePayload(payload = {}) {
  if (!payload || typeof payload !== 'object' || !payload.config || !payload.userInput) {
    return 'Missing required parameters: config, userInput';
  }
  const result = GeneratePayloadSchema.safeParse(payload);
  return result.success ? null : 'Invalid generation payload: ' + result.error.issues
    .map((issue) => `${issue.path.join('.') || 'payload'}: ${issue.message}`).join('; ');
}

function requestBodyError(code) {
  const error = new Error(code === 'BODY_TOO_LARGE'
    ? 'Generation request exceeds the 4MB limit.' : 'Request body must contain valid JSON.');
  error.code = code;
  return error;
}

function abortError() {
  const error = new Error('Generation cancelled.');
  error.name = 'AbortError';
  return error;
}

/** Read incrementally so chunked requests cannot bypass the size limit. */
export async function readGeneratePayload(request) {
  if (Number(request.headers.get('content-length')) > MAX_GENERATE_BODY_BYTES) {
    void request.body?.cancel().catch(() => {});
    throw requestBodyError('BODY_TOO_LARGE');
  }
  if (!request.body) throw requestBodyError('BODY_INVALID');
  const reader = request.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let bytes = 0;
  let text = '';
  const cancelOnAbort = () => { void reader.cancel().catch(() => {}); };
  request.signal?.addEventListener('abort', cancelOnAbort, { once: true });
  try {
    while (true) {
      if (request.signal?.aborted) throw abortError();
      const { done, value } = await reader.read();
      if (request.signal?.aborted) throw abortError();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_GENERATE_BODY_BYTES) throw requestBodyError('BODY_TOO_LARGE');
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } catch (error) {
    void reader.cancel().catch(() => {});
    if (error?.code === 'BODY_TOO_LARGE' || error?.name === 'AbortError') throw error;
    throw requestBodyError('BODY_INVALID');
  } finally {
    request.signal?.removeEventListener('abort', cancelOnAbort);
    reader.releaseLock();
  }
}

export function isImageInput(userInput) {
  return Boolean(userInput && typeof userInput === 'object' && userInput.image);
}

export function supportsVisionModel(model = '') {
  const normalizedModel = typeof model === 'string' ? model.toLowerCase() : '';
  return VISION_MODEL_KEYWORDS.some((keyword) => normalizedModel.includes(keyword));
}

export function createVisionModelError(model = '') {
  const modelPrefix = model ? `当前模型 ${model} 不支持图片输入` : '当前模型不支持图片输入';
  return `${modelPrefix}，请使用支持视觉输入的模型，例如 gpt-4o、gpt-4.1 或 claude-3.5-sonnet。`;
}

export function buildUserMessage(userInput, chartType = 'auto', theme = DEFAULT_THEME_ID) {
  if (isImageInput(userInput)) {
    return {
      role: 'user',
      content: USER_PROMPT_TEMPLATE(userInput.text || '', chartType, theme),
      image: {
        data: userInput.image.data,
        mimeType: userInput.image.mimeType,
      },
    };
  }

  return {
    role: 'user',
    content: USER_PROMPT_TEMPLATE(userInput, chartType, theme),
  };
}

export function buildGenerateMessages({
  userInput,
  chartType = 'auto',
  isContinuation = false,
  theme = DEFAULT_THEME_ID,
}) {
  const systemPrompt = isContinuation
    ? CONTINUATION_SYSTEM_PROMPT
    : buildSystemPrompt(theme || DEFAULT_THEME_ID);

  return [
    { role: 'system', content: systemPrompt },
    buildUserMessage(userInput, chartType, theme || DEFAULT_THEME_ID),
  ];
}

function createSseChunk(payload) {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

export function createGenerateEventStream({
  callLLM,
  config,
  messages,
  onStreamError,
  signal,
}) {
  const encoder = new TextEncoder();
  const upstream = new AbortController();
  let closed = false;
  let removeAbortListener = () => {};

  return new ReadableStream({
    start(controller) {
      const onAbort = () => {
        upstream.abort(abortError());
        if (!closed) {
          closed = true;
          controller.error(abortError());
        }
        removeAbortListener();
      };
      removeAbortListener = () => signal?.removeEventListener('abort', onAbort);
      signal?.addEventListener('abort', onAbort, { once: true });
      if (signal?.aborted) { onAbort(); return; }

      // Keep start synchronous so cancellation can reach an in-flight fetch.
      void (async () => {
        try {
          const result = await callLLM(config, messages, (chunk) => {
            if (!closed) controller.enqueue(encoder.encode(createSseChunk({ content: chunk })));
          }, { signal: upstream.signal });
          if (closed) return;
          const stopReason = result?.stopReason || null;
          if (stopReason) controller.enqueue(encoder.encode(createSseChunk({ meta: { stopReason } })));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          closed = true;
          controller.close();
        } catch (error) {
          if (closed) return;
          const safeMessage = publicLlmError(error);
          controller.enqueue(encoder.encode(createSseChunk({ error: safeMessage })));
          closed = true;
          controller.close();
          // A reporting callback must not leave the response open or reject start.
          try { onStreamError?.(new Error(safeMessage)); } catch { /* response is already complete */ }
        } finally {
          removeAbortListener();
        }
      })();
    },
    cancel() {
      closed = true;
      removeAbortListener();
      upstream.abort(abortError());
    },
  });
}
