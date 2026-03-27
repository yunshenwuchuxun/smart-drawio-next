import { describe, expect, it } from 'vitest';

import {
  isNetworkError,
  normalizeUserInput,
  parseGeneratedContent,
} from '@/lib/generation-utils';

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
    const result = parseGeneratedContent('prefix <mxfile><diagram/></mxfile> suffix');
    expect(result.status).toBe('xml');
    expect(result.generatedXml).toBe('<mxfile><diagram/></mxfile>');
  });

  it('extracts JSON arrays', () => {
    const result = parseGeneratedContent('[{"id":1}]');
    expect(result.status).toBe('json');
    expect(result.elements).toEqual([{ id: 1 }]);
  });

  it('flags truncated xml when repair fails (mid-tag truncation)', () => {
    // Truncated mid-attribute — repair can't produce valid XML
    const result = parseGeneratedContent('<mxfile><diagram><mxGraphModel><root><mxCell id="1" style="font');
    expect(result.status).toBe('truncated');
    expect(result.isTruncated).toBe(true);
    expect(result.canContinue).toBe(true);
  });

  it('fallback A: repairs partial mxfile missing closing tags', () => {
    const partial = '<mxfile><diagram><mxGraphModel><root><mxCell id="0"/></root></mxGraphModel></diagram>';
    const result = parseGeneratedContent(partial);
    expect(result.status).toBe('repaired');
    expect(result.generatedXml).toContain('</mxfile>');
    expect(result.isTruncated).toBe(false);
    expect(result.notification.title).toBe('Auto Repair');
  });

  it('fallback B: wraps bare mxGraphModel in mxfile/diagram', () => {
    const bare = '<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>';
    const result = parseGeneratedContent(bare);
    expect(result.status).toBe('xml');
    expect(result.generatedXml).toBe(`<mxfile><diagram>${bare}</diagram></mxfile>`);
    expect(result.notification.title).toBe('Auto Wrap');
  });

  it('returns invalid when content has no recognizable structure', () => {
    const result = parseGeneratedContent('just some random text with no XML or JSON');
    expect(result.status).toBe('invalid');
    expect(result.jsonError).toBeTruthy();
  });
});
