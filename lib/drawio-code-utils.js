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
  const closingTags = ['</mxfile>', '</mxGraphModel>', '</diagram>'];
  let lastCloseEnd = -1;
  for (const tag of closingTags) {
    const idx = processed.lastIndexOf(tag);
    if (idx !== -1) {
      const end = idx + tag.length;
      if (end > lastCloseEnd) lastCloseEnd = end;
    }
  }
  if (lastCloseEnd > 0 && lastCloseEnd < processed.length) {
    processed = processed.slice(0, lastCloseEnd);
  }

  return processed.trim();
}

export function stripXmlHeaders(code) {
  return code.trim()
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
export async function readSSEStream(responseBody, onChunk) {
  const reader = responseBody.getReader();
  const decoder = new TextDecoder();
  let accumulated = '';
  let buffer = '';
  let meta = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;

      const raw = line.slice(6).trim();
      if (raw === '[DONE]') {
        return { text: accumulated, meta };
      }

      const payload = JSON.parse(raw);

      if (payload.meta) {
        meta = payload.meta;
        continue;
      }

      const content = payload.content || payload.delta || '';
      if (!content) continue;

      accumulated += content;
      onChunk?.(accumulated);
    }
  }

  return { text: accumulated, meta };
}
