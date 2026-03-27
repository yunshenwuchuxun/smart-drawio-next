import { describe, expect, it } from 'vitest';

import { postProcessDrawioCode, sanitizeError, stripXmlHeaders } from '@/lib/drawio-code-utils';

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
});

describe('stripXmlHeaders', () => {
  it('removes duplicated xml wrapper headers from continuation chunks', () => {
    const code = '<?xml version="1.0"?><mxfile><diagram><mxGraphModel><root><mxCell id="1"/>';
    expect(stripXmlHeaders(code)).toBe('<mxCell id="1"/>');
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
