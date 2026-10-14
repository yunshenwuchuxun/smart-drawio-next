import { describe, expect, it } from 'vitest';

import {
  isNetworkError,
  normalizeUserInput,
  parseGeneratedContent,
} from '@/lib/generation-utils';

const EMPTY_MODEL = '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel>';
const EMPTY_XML = `<mxfile><diagram>${EMPTY_MODEL}</diagram></mxfile>`;

describe('normalizeUserInput', () => {
  it('keeps plain text input unchanged', () => {
    expect(normalizeUserInput('hello')).toBe('hello');
  });

  it('keeps only the image payload fields used by the API', () => {
    expect(normalizeUserInput({
      text: 'diagram',
      image: {
        data: 'abc',
        mimeType: 'image/png',
        previewUrl: 'blob:demo',
      },
    })).toEqual({
      text: 'diagram',
      image: {
        data: 'abc',
        mimeType: 'image/png',
      },
    });
  });
});

describe('isNetworkError', () => {
  it('detects fetch failures', () => {
    expect(isNetworkError(new Error('Failed to fetch'))).toBe(true);
    expect(isNetworkError({ name: 'TypeError' })).toBe(true);
    expect(isNetworkError(new Error('boom'))).toBe(false);
  });
});

describe('parseGeneratedContent', () => {
  it('extracts xml payloads', () => {
    const result = parseGeneratedContent(`prefix ${EMPTY_XML} suffix`);
    expect(result.status).toBe('xml');
    expect(result.generatedXml).toBe(EMPTY_XML);
    expect(result.shouldApply).toBe(true);
  });

  it('extracts JSON arrays', () => {
    const result = parseGeneratedContent('[{"id":1}]');
    expect(result.status).toBe('json');
    expect(result.elements).toEqual([{ id: 1 }]);
    expect(result.shouldApply).toBe(true);
  });

  it('flags truncated xml when repair fails (mid-tag truncation)', () => {
    // Truncated mid-attribute — repair can't produce valid XML
    const result = parseGeneratedContent('<mxfile><diagram><mxGraphModel><root><mxCell id="1" style="font');
    expect(result.status).toBe('truncated');
    expect(result.isTruncated).toBe(true);
    expect(result.canContinue).toBe(true);
    expect(result.shouldApply).toBe(false);
    expect(result.generatedXml).toBe('');
  });

  it('repairs partial mxfile only when explicitly enabled', () => {
    const partial = `<mxfile><diagram>${EMPTY_MODEL}</diagram>`;
    const result = parseGeneratedContent(partial, { autoRepair: true });
    expect(result.status).toBe('repaired');
    expect(result.generatedXml).toContain('</mxfile>');
    expect(result.isTruncated).toBe(false);
    expect(result.notification.title).toBe('Auto Repair');
    expect(result.shouldApply).toBe(true);
  });

  it('leaves repairable truncated XML as a draft by default', () => {
    const partial = `<mxfile><diagram>${EMPTY_MODEL}</diagram>`;
    const result = parseGeneratedContent(partial);
    expect(result.status).toBe('truncated');
    expect(result.shouldApply).toBe(false);
    expect(result.generatedCode).toBe(partial);
    expect(result.generatedXml).toBe('');
  });

  it('fallback B: wraps bare mxGraphModel in mxfile/diagram', () => {
    const bare = EMPTY_MODEL;
    const result = parseGeneratedContent(bare);
    expect(result.status).toBe('xml');
    expect(result.generatedXml).toBe(`<mxfile><diagram>${bare}</diagram></mxfile>`);
    expect(result.notification.title).toBe('Auto Wrap');
  });

  it('does not apply complete XML with invalid graph structure', () => {
    const result = parseGeneratedContent('<mxfile><diagram/></mxfile>');
    expect(result.status).toBe('invalid');
    expect(result.shouldApply).toBe(false);
    expect(result.diagnostics[0].code).toBe('INVALID_DIAGRAM_MODEL');
  });

  it('does not extract a bare model from an invalid mxfile', () => {
    const result = parseGeneratedContent(`<mxfile><diagram>${EMPTY_MODEL}</diagram><wrong/></mxfile>`);
    expect(result.status).toBe('invalid');
    expect(result.shouldApply).toBe(false);
  });

  it('does not silently accept the first of multiple XML documents', () => {
    const result = parseGeneratedContent(`${EMPTY_XML}${EMPTY_XML}`);
    expect(result.status).toBe('invalid');
    expect(result.shouldApply).toBe(false);
  });

  it('reports when explicit repair discarded an incomplete element', () => {
    const partial = '<mxfile><diagram><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="2" value="unfinished';
    const result = parseGeneratedContent(partial, { autoRepair: true });
    expect(result.status).toBe('repaired');
    expect(result.elementsTruncated).toBe(true);
    expect(result.notification.type).toBe('warning');
    expect(result.notification.message).toContain('Discarded');
  });

  it('keeps a failed explicit repair from being applied', () => {
    const partial = '<mxfile><diagram><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="missing"/>';
    const result = parseGeneratedContent(partial, { autoRepair: true });
    expect(result.shouldApply).toBe(false);
    expect(result.generatedCode).toBe(partial);
    expect(result.generatedXml).toBe('');
  });

  it('honors the continuation limit without repairing or applying', () => {
    const result = parseGeneratedContent('<mxfile><diagram>', { continuationAttempts: 3 });
    expect(result.canContinue).toBe(false);
    expect(result.shouldApply).toBe(false);
    expect(result.continuationAttempts).toBe(3);
  });

  it('returns invalid when content has no recognizable structure', () => {
    const result = parseGeneratedContent('just some random text with no XML or JSON');
    expect(result.status).toBe('invalid');
    expect(result.jsonError).toBeTruthy();
  });
});
