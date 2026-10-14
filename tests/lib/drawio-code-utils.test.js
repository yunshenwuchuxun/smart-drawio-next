import { describe, expect, it, vi } from 'vitest';

import { postProcessDrawioCode, readSSEStream, sanitizeError, stripXmlHeaders } from '@/lib/drawio-code-utils';

describe('postProcessDrawioCode', () => {
  it('removes markdown fences around xml output', () => {
    const code = '```xml\n<mxfile><diagram/></mxfile>\n```';
    expect(postProcessDrawioCode(code)).toBe('<mxfile><diagram/></mxfile>');
  });

  it('returns non-string values unchanged', () => {
    expect(postProcessDrawioCode(null)).toBeNull();
    expect(postProcessDrawioCode(undefined)).toBeUndefined();
  });

  it('strips Chinese text before the first XML tag', () => {
    const code = '好的，以下是你要的流程图：\n\n<mxfile><diagram/></mxfile>';
    expect(postProcessDrawioCode(code)).toBe('<mxfile><diagram/></mxfile>');
  });

  it('strips trailing text after the last closing tag', () => {
    const code = '<mxfile><diagram/></mxfile>\n\n希望这对你有帮助！';
    expect(postProcessDrawioCode(code)).toBe('<mxfile><diagram/></mxfile>');
  });

  it('strips both leading Chinese and trailing text', () => {
    const code = '这是一个架构图：\n<mxfile><diagram><mxGraphModel/></diagram></mxfile>\n如果需要修改请告诉我。';
    expect(postProcessDrawioCode(code)).toBe('<mxfile><diagram><mxGraphModel/></diagram></mxfile>');
  });

  it('handles bare mxGraphModel with surrounding text', () => {
    const code = '以下是代码：\n<mxGraphModel><root/></mxGraphModel>\n完成。';
    expect(postProcessDrawioCode(code)).toBe('<mxGraphModel><root/></mxGraphModel>');
  });

  it('handles xml declaration prefix', () => {
    const code = '好的\n<?xml version="1.0"?><mxfile><diagram/></mxfile>';
    expect(postProcessDrawioCode(code)).toBe('<?xml version="1.0"?><mxfile><diagram/></mxfile>');
  });

  it('preserves code that has no surrounding text', () => {
    const code = '<mxfile><diagram/></mxfile>';
    expect(postProcessDrawioCode(code)).toBe('<mxfile><diagram/></mxfile>');
  });

  it('keeps later pages after closed inner tags in an unfinished mxfile', () => {
    const code = '<mxfile><diagram><mxGraphModel><root/></mxGraphModel></diagram><diagram name="unfinished';
    expect(postProcessDrawioCode(code)).toBe(code);
  });
});

describe('stripXmlHeaders', () => {
  it('removes duplicated xml wrapper headers from continuation chunks', () => {
    const code = '<?xml version="1.0"?><mxfile><diagram><mxGraphModel><root><mxCell id="1"/>';
    expect(stripXmlHeaders(code)).toBe('<mxCell id="1"/>');
  });

  it('preserves a leading space belonging to a truncated label or attribute', () => {
    expect(stripXmlHeaders(' continued label"/>')).toBe(' continued label"/>');
  });
});

describe('readSSEStream', () => {
  function streamFrom(parts) {
    const encoder = new TextEncoder();
    return new ReadableStream({ start(controller) {
      for (const part of parts) controller.enqueue(encoder.encode(part));
      controller.close();
    } });
  }

  it('reads fragmented CRLF events and an EOF residual DONE without a trailing newline', async () => {
    const onChunk = vi.fn();
    const result = await readSSEStream(streamFrom([
      'data: {"content":"一', '段"}\r\n\r\n',
      'data:{"content":" XML"}\n\n',
      'data: {"meta":{"stopReason":"length"}}\n\n',
      'data: [DO', 'NE]',
    ]), onChunk);
    expect(result).toEqual({ text: '一段 XML', meta: { stopReason: 'length' } });
    expect(onChunk.mock.calls.map(([text]) => text)).toEqual(['一段', '一段 XML']);
  });

  it('propagates server error events, including an EOF residual error', async () => {
    await expect(readSSEStream(streamFrom(['data: {"error":"Upstream timed out"}']))).rejects.toThrow('Upstream timed out');
  });

  it('rejects missing DONE while retaining the content delivered to the caller', async () => {
    const onChunk = vi.fn();
    await expect(readSSEStream(streamFrom(['data: {"content":"partial"}']), onChunk)).rejects.toThrow('ended before completion');
    expect(onChunk).toHaveBeenCalledWith('partial');
  });

  it('rejects malformed events and releases the reader lock', async () => {
    const body = streamFrom(['data: {broken}\n\n']);
    await expect(readSSEStream(body)).rejects.toThrow('Invalid event');
    expect(body.locked).toBe(false);
  });

  it('cancels a blocked reader when the request signal is aborted', async () => {
    const cancel = vi.fn();
    const body = new ReadableStream({ cancel });
    const controller = new AbortController();
    const pending = readSSEStream(body, undefined, { signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(body.locked).toBe(false);
  });
});

describe('sanitizeError', () => {
  it('normalizes html error pages into concise api errors', () => {
    expect(sanitizeError('<!DOCTYPE html><html><body>502 Bad Gateway</body></html>')).toBe('API 返回 502 错误');
  });

  it('truncates very long messages', () => {
    const message = 'x'.repeat(320);
    expect(sanitizeError(message)).toHaveLength(301);
    expect(sanitizeError(message).endsWith('…')).toBe(true);
  });
});
