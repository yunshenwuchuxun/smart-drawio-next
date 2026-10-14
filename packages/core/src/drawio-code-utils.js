export function postProcessDrawioCode(code) {
  if (!code || typeof code !== 'string') return code;

  let processed = code.trim();
  processed = processed.replace(/^```(?:xml|mxgraph)?\s*\n?/i, '');
  processed = processed.replace(/\n?```\s*$/, '');

  // Strip non-XML text before the first XML tag
  const xmlStartMatch = processed.match(/<(?:\?xml|mxfile|mxGraphModel|diagram)\b/);
  if (xmlStartMatch) {
    processed = processed.slice(xmlStartMatch.index);
  }

  // Strip trailing text after the last valid closing tag
  // Only a closed outer document ends the output. Inner closing tags can
  // occur before a later page or an unfinished continuation.
  const rootMatch = processed.match(/<(mxfile|mxGraphModel|diagram)\b/);
  const closingTag = rootMatch ? `</${rootMatch[1]}>` : null;
  const closeIndex = closingTag ? processed.lastIndexOf(closingTag) : -1;
  const lastCloseEnd = closeIndex >= 0 ? closeIndex + closingTag.length : -1;
  if (lastCloseEnd > 0 && lastCloseEnd < processed.length) {
    processed = processed.slice(0, lastCloseEnd);
  }

  return processed.trim();
}

export function stripXmlHeaders(code) {
  return code.replace(/^```(?:xml|mxgraph)?\s*\n?/i, '')
    .replace(/\n?```\s*$/, '')
    .replace(/^<\?xml[^>]*>\s*/i, '')
    .replace(/^<mxfile[^>]*>\s*/i, '')
    .replace(/^<diagram[^>]*>\s*/i, '')
    .replace(/^<mxGraphModel[^>]*>\s*/i, '')
    .replace(/^<root>\s*/i, '');
}

export function sanitizeError(message) {
  if (!message || typeof message !== 'string') return message;

  if (message.includes('<!DOCTYPE') || message.includes('<html')) {
    const statusCode = message.match(/(\d{3})/);
    return statusCode ? `API 返回 ${statusCode[1]} 错误` : 'API 返回了异常响应';
  }

  return message.length > 300 ? `${message.slice(0, 300)}…` : message;
}

/**
 * Read SSE stream, accumulating content and capturing meta events
 * @returns {Promise<{ text: string, meta: object | null }>}
 */
export async function readSSEStream(responseBody, onChunk, { signal } = {}) {
  if (!responseBody?.getReader) {
    throw new Error('The generation response did not contain a stream.');
  }
  const reader = responseBody.getReader();
  const decoder = new TextDecoder();
  let accumulated = '';
  let buffer = '';
  let meta = null;
  let dataLines = [];
  let completed = false;
  const abortError = () => new DOMException('Generation was cancelled.', 'AbortError');
  const checkAborted = () => {
    if (signal?.aborted) throw abortError();
  };
  const handleAbort = () => { void reader.cancel().catch(() => {}); };

  const dispatchEvent = () => {
    if (!dataLines.length || completed) return;
    const raw = dataLines.join('\n').trim();
    dataLines = [];
    if (raw === '[DONE]') {
      completed = true;
      return;
    }

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      throw new Error('Invalid event in the generation stream.');
    }
    if (payload.error) {
      throw new Error(typeof payload.error === 'string'
        ? payload.error
        : payload.error.message || 'Generation failed.');
    }
    if (payload.meta) meta = payload.meta;
    const content = payload.content || payload.delta || '';
    if (typeof content !== 'string') {
      throw new Error('Invalid content in the generation stream.');
    }
    if (content) {
      accumulated += content;
      onChunk?.(accumulated);
    }
  };
  const readLine = (line) => {
    const normalized = line.endsWith('\r') ? line.slice(0, -1) : line;
    if (!normalized) {
      dispatchEvent();
    } else if (normalized.startsWith('data:')) {
      const value = normalized.slice(5);
      dataLines.push(value.startsWith(' ') ? value.slice(1) : value);
    }
  };

  signal?.addEventListener('abort', handleAbort, { once: true });
  try {
    checkAborted();
    while (!completed) {
      const { done, value } = await reader.read();
      checkAborted();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        readLine(line);
        if (completed) break;
      }
      if (done) {
        // A final event need not have a trailing newline or blank separator.
        if (buffer) readLine(buffer);
        dispatchEvent();
        break;
      }
    }
    checkAborted();
    if (!completed) {
      throw new Error('The generation stream ended before completion. Please retry or continue the saved draft.');
    }
    return { text: accumulated, meta };
  } finally {
    signal?.removeEventListener('abort', handleAbort);
    // [DONE], stream errors and cancellation all release the response body.
    try { await reader.cancel(); } catch { /* Already closed or aborted. */ }
    reader.releaseLock();
  }
}
