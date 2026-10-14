/**
 * OpenAI/Anthropic-compatible streaming generation.
 * Fetch and stream deadlines are shorter than Vercel's 300s default.
 */
import { debug } from './logger.js';

export const LLM_TOTAL_TIMEOUT_MS = 240_000;
export const LLM_IDLE_TIMEOUT_MS = 60_000;
const MAX_PROVIDER_EVENT_CHARS = 1024 * 1024;
const MAX_PROVIDER_OUTPUT_CHARS = 2 * 1024 * 1024;
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]']);
const DEFAULT_DOCKER_HOST_ALIASES = ['host.docker.internal', 'gateway.docker.internal'];
const PUBLIC_ERRORS = {
  LLM_TIMEOUT: 'Model generation exceeded the total time limit.',
  LLM_IDLE_TIMEOUT: 'The model provider stopped responding.',
  PROVIDER_UNREACHABLE: 'Unable to reach the model provider.',
  PROVIDER_ERROR: 'The model provider returned an error.',
  PROVIDER_STREAM_INVALID: 'The model provider returned an invalid stream.',
  PROVIDER_STREAM_INCOMPLETE: 'The model stream ended before generation completed.',
  PROVIDER_EMPTY: 'The model provider returned an empty response.',
  PROVIDER_OUTPUT_TOO_LARGE: 'The model provider response was too large.',
  PROVIDER_REFUSAL: 'The model provider could not complete this request.',
};

function llmError(code) {
  const error = new Error(PUBLIC_ERRORS[code] || 'Failed to generate code');
  error.code = code;
  if (code === 'LLM_TIMEOUT' || code === 'LLM_IDLE_TIMEOUT') error.name = 'TimeoutError';
  return error;
}
function cancelledError() {
  const error = new Error('Generation cancelled.');
  error.name = 'AbortError';
  return error;
}
// Network/provider messages can contain credentials; expose only fixed messages.
export function publicLlmError(error) {
  return error?.name === 'AbortError' ? 'Generation cancelled.'
    : Object.hasOwn(PUBLIC_ERRORS, error?.code) ? PUBLIC_ERRORS[error.code] : 'Failed to generate code';
}
function stripTrailingSlash(value) {
  return typeof value === 'string' ? value.replace(/\/+$/, '') : value;
}
export function getBaseUrlCandidates(baseUrl) {
  const candidates = [stripTrailingSlash(baseUrl)];
  try {
    const url = new URL(candidates[0]);
    if (!LOOPBACK_HOSTS.has(url.hostname)) return candidates;
    const aliases = new Set([
      process.env.DOCKER_HOST_ALIAS, process.env.DOCKER_HOST_GATEWAY, ...DEFAULT_DOCKER_HOST_ALIASES,
    ].filter(Boolean));
    for (const alias of aliases) {
      if (alias === url.hostname) continue;
      const candidateUrl = new URL(candidates[0]);
      candidateUrl.hostname = alias;
      const candidate = stripTrailingSlash(candidateUrl.toString());
      if (!candidates.includes(candidate)) candidates.push(candidate);
    }
  } catch {
    return candidates;
  }
  return candidates;
}
function abortable(operation, signal) {
  if (!signal) return operation();
  if (signal.aborted) return Promise.reject(signal.reason || cancelledError());
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(signal.reason || cancelledError());
    signal.addEventListener('abort', onAbort, { once: true });
    if (signal.aborted) onAbort();
    Promise.resolve().then(() => {
      if (signal.aborted) throw signal.reason || cancelledError();
      return operation();
    }).then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort));
  });
}
async function fetchWithBaseUrlFallback(baseUrl, endpoint, init) {
  const candidates = getBaseUrlCandidates(baseUrl);
  for (const [index, candidateBaseUrl] of candidates.entries()) {
    try {
      return await abortable(() => fetch(
        `${stripTrailingSlash(candidateBaseUrl)}${endpoint}`, init
      ), init.signal);
    } catch (error) {
      if (init.signal?.aborted) throw init.signal.reason || cancelledError();
      if (error?.name === 'AbortError' || error?.name === 'TimeoutError') throw error;
      if (index < candidates.length - 1) {
        debug('[llm-client] retrying via Docker host alias', { endpoint, attempt: index + 1 });
      }
    }
  }
  throw llmError('PROVIDER_UNREACHABLE');
}
function createGenerationScope({ signal, timeoutMs = LLM_TOTAL_TIMEOUT_MS, idleTimeoutMs = LLM_IDLE_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  let idleTimer;
  const onAbort = () => controller.abort(cancelledError());
  signal?.addEventListener('abort', onAbort, { once: true });
  if (signal?.aborted) onAbort();
  const totalTimer = setTimeout(() => controller.abort(llmError('LLM_TIMEOUT')), timeoutMs);
  const touch = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => controller.abort(llmError('LLM_IDLE_TIMEOUT')), idleTimeoutMs);
  };
  touch();
  return {
    signal: controller.signal, touch,
    dispose() {
      clearTimeout(totalTimer);
      clearTimeout(idleTimer);
      signal?.removeEventListener('abort', onAbort);
    },
  };
}
/**
 * @param {Object} config Provider configuration
 * @param {Array} messages Chat messages
 * @param {Function} onChunk Receives token deltas
 * @param {{ signal?: AbortSignal, timeoutMs?: number, idleTimeoutMs?: number }} options
 * @returns {Promise<{ text: string, stopReason: string | null }>}
 */
export async function callLLM(config, messages, onChunk, options = {}) {
  const scope = createGenerationScope(options);
  try {
    const { type, baseUrl, apiKey, model } = config;
    if (type !== 'openai' && type !== 'anthropic') throw llmError('PROVIDER_ERROR');
    const isOpenAI = type === 'openai';
    const systemMessage = messages.find((message) => message.role === 'system');
    const body = isOpenAI ? {
      model, messages: messages.map(processMessageForOpenAI), stream: true, max_tokens: 16384,
    } : {
      model,
      messages: messages.filter((message) => message.role !== 'system').map(processMessageForAnthropic),
      system: systemMessage ? [{ type: 'text', text: systemMessage.content }] : undefined,
      max_tokens: 16000, stream: true, temperature: 1,
    };
    const response = await fetchWithBaseUrlFallback(baseUrl, isOpenAI ? '/chat/completions' : '/messages', {
      method: 'POST',
      headers: isOpenAI ? {
        'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}`,
      } : {
        'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body), signal: scope.signal,
    });
    scope.touch();
    if (!response.ok) {
      // Provider response bodies can echo submitted credentials.
      void response.body?.cancel().catch(() => {});
      throw llmError('PROVIDER_ERROR');
    }
    return await readProviderStream(response.body, type, onChunk, scope);
  } catch (error) {
    if (scope.signal.aborted) throw scope.signal.reason || cancelledError();
    if (error?.name === 'AbortError') throw cancelledError();
    if (Object.hasOwn(PUBLIC_ERRORS, error?.code)) throw error;
    throw llmError('PROVIDER_ERROR');
  } finally {
    scope.dispose();
  }
}
async function readProviderStream(body, type, onChunk, scope) {
  if (!body?.getReader) throw llmError('PROVIDER_STREAM_INVALID');
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';
  let stopReason = null;
  let completed = false;
  let ended = false;
  const onAbort = () => { void reader.cancel().catch(() => {}); };
  scope.signal.addEventListener('abort', onAbort, { once: true });
  if (scope.signal.aborted) onAbort();

  const processLine = (line) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) return;
    const data = trimmed.slice(5).trim();
    if (data === '[DONE]') { completed = true; return; }
    let event;
    try { event = JSON.parse(data); } catch { throw llmError('PROVIDER_STREAM_INVALID'); }
    if (!event || typeof event !== 'object') throw llmError('PROVIDER_STREAM_INVALID');
    if (event.error || event.type === 'error') throw llmError('PROVIDER_ERROR');
    let content;
    let nextStopReason;
    if (type === 'openai') {
      content = event.choices?.[0]?.delta?.content;
      if (event.choices?.[0]?.delta?.refusal) throw llmError('PROVIDER_REFUSAL');
      nextStopReason = event.choices?.[0]?.finish_reason;
    } else {
      if (event.type === 'content_block_delta') content = event.delta?.text;
      if (event.type === 'message_delta') nextStopReason = event.delta?.stop_reason;
      if (event.type === 'message_stop') completed = true;
    }
    if (nextStopReason !== undefined && nextStopReason !== null) {
      if (typeof nextStopReason !== 'string') throw llmError('PROVIDER_STREAM_INVALID');
      const knownReasons = ['stop', 'length', 'max_tokens', 'end_turn', 'stop_sequence',
        'pause_turn', 'tool_use', 'content_filter', 'refusal', 'tool_calls', 'function_call'];
      stopReason = knownReasons.includes(nextStopReason) ? nextStopReason : 'unknown';
    }
    if (['content_filter', 'refusal', 'tool_calls', 'function_call'].includes(stopReason)) {
      throw llmError('PROVIDER_REFUSAL');
    }
    if (content !== undefined && content !== null && typeof content !== 'string') {
      throw llmError('PROVIDER_STREAM_INVALID');
    }
    if (content) {
      fullText += content;
      if (fullText.length > MAX_PROVIDER_OUTPUT_CHARS) throw llmError('PROVIDER_OUTPUT_TOO_LARGE');
      onChunk?.(content);
    }
  };
  const consumeBuffer = (atEof = false) => {
    const lines = buffer.split('\n');
    buffer = atEof ? '' : lines.pop() || '';
    for (const line of lines) {
      if (completed) break;
      if (line.length > MAX_PROVIDER_EVENT_CHARS) throw llmError('PROVIDER_OUTPUT_TOO_LARGE');
      processLine(line);
    }
    if (buffer.length > MAX_PROVIDER_EVENT_CHARS) throw llmError('PROVIDER_OUTPUT_TOO_LARGE');
  };
  try {
    while (!completed) {
      const { done, value } = await abortable(() => reader.read(), scope.signal);
      if (scope.signal.aborted) throw scope.signal.reason || cancelledError();
      if (done) {
        ended = true;
        buffer += decoder.decode();
        consumeBuffer(true);
        break;
      }
      scope.touch();
      buffer += decoder.decode(value, { stream: true });
      consumeBuffer();
    }
    if (!completed && !stopReason) throw llmError('PROVIDER_STREAM_INCOMPLETE');
    if (!fullText.trim()) throw llmError('PROVIDER_EMPTY');
    return { text: fullText, stopReason };
  } finally {
    scope.signal.removeEventListener('abort', onAbort);
    if (!ended) void reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

/**
 * Process message for OpenAI API with multimodal support
 * @param {Object} message - Message object
 * @returns {Object} Processed message for OpenAI
 */
function processMessageForOpenAI(message) {
  // If message doesn't have image data, return as-is
  if (!message.image) {
    return message;
  }

  debug('[DEBUG] processMessageForOpenAI input:', {
    hasImage: !!message.image,
    imageDataLength: message.image?.data?.length
  });

  // Process message with image
  const { image, content } = message;

  const result = {
    role: message.role,
    content: [
      {
        type: 'text',
        text: content
      },
      {
        type: 'image_url',
        image_url: {
          url: `data:${image.mimeType};base64,${image.data}`,
          detail: 'high'
        }
      }
    ]
  };

  debug('[DEBUG] processMessageForOpenAI output:', {
    role: result.role,
    contentLength: result.content.length,
    hasImageUrl: result.content[1]?.type === 'image_url'
  });

  return result;
}

/**
 * Process message for Anthropic API with multimodal support
 * @param {Object} message - Message object
 * @returns {Object} Processed message for Anthropic
 */
function processMessageForAnthropic(message) {
  // If message doesn't have image data, return as-is
  if (!message.image) {
    return message;
  }

  // Process message with image
  const { image, content } = message;

  return {
    role: message.role === 'assistant' ? 'assistant' : 'user',
    content: [
      {
        type: 'text',
        text: content
      },
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: image.mimeType,
          data: image.data
        }
      }
    ]
  };
}

/**
 * Test configuration connection with a simple API call
 * @param {Object} config - Provider configuration
 * @returns {Promise<Object>} Test result with success status and message
 */
export async function testConnection(config) {
  const { type, baseUrl, apiKey } = config;

  try {
    // Try to fetch models as a simple connection test
    const models = await fetchModels(type, baseUrl, apiKey);

    if (models && models.length > 0) {
      return {
        success: true,
        message: `连接成功，找到 ${models.length} 个可用模型`,
        models: models.slice(0, 5) // Return first 5 models for preview
      };
    } else {
      return {
        success: false,
        message: '连接成功但未找到可用模型'
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `连接失败: ${publicLlmError(error)}`
    };
  }
}

/**
 * Fetch available models from provider
 * @param {string} type - Provider type
 * @param {string} baseUrl - API base URL
 * @param {string} apiKey - API key
 * @returns {Promise<Array>} List of available models
 */
export async function fetchModels(type, baseUrl, apiKey) {
  if (type === 'openai') {
    const response = await fetchWithBaseUrlFallback(baseUrl, '/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      void response.body?.cancel().catch(() => {});
      throw llmError('PROVIDER_ERROR');
    }

    const data = await response.json();
    return (Array.isArray(data?.data) ? data.data : Array.isArray(data?.models) ? data.models : Array.isArray(data) ? data : [])
      .map(model => ({
        id: typeof model === 'string' ? model : (model.id || model.name || model.model || model.slug),
        name: typeof model === 'string' ? model : (model.name || model.id || model.model || model.slug),
      }))
      .filter(m => m.id);
  } else if (type === 'anthropic') {
    // Request actual models from provider like OpenAI, but with Anthropic headers
    const response = await fetchWithBaseUrlFallback(baseUrl, '/models', {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
    });

    if (!response.ok) {
      void response.body?.cancel().catch(() => {});
      throw llmError('PROVIDER_ERROR');
    }

    const data = await response.json();
    return (Array.isArray(data?.data) ? data.data : Array.isArray(data?.models) ? data.models : Array.isArray(data) ? data : [])
      .map(model => ({
        id: typeof model === 'string' ? model : (model.id || model.name || model.model || model.slug),
        name: typeof model === 'string' ? model : (model.name || model.id || model.model || model.slug),
      }))
      .filter(m => m.id);
  } else {
    throw llmError('PROVIDER_ERROR');
  }
}
