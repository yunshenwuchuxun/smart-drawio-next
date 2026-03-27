import { describe, expect, it } from 'vitest';
import {
  detectMissingTags,
  repairXml,
  truncateToLastCompleteElement,
  tryRepairXml,
} from '@/lib/xml-repair';

describe('truncateToLastCompleteElement', () => {
  it('removes broken trailing attribute (mid-attribute truncation)', () => {
    const xml =
      '<root><mxCell id="1" style="rounded=1"/><mxCell id="2" style="font';
    const result = truncateToLastCompleteElement(xml);
    expect(result.truncated).toBe(true);
    expect(result.xml).toBe('<root><mxCell id="1" style="rounded=1"/>');
    expect(result.removedLength).toBeGreaterThan(0);
  });

  it('removes broken trailing tag name', () => {
    const xml = '<root><mxCell id="1"/><mxCel';
    const result = truncateToLastCompleteElement(xml);
    expect(result.truncated).toBe(true);
    expect(result.xml).toBe('<root><mxCell id="1"/>');
  });

  it('preserves complete XML (only wrapper close tags after last element)', () => {
    const xml =
      '<root><mxCell id="1"/></root></mxGraphModel></diagram></mxfile>';
    const result = truncateToLastCompleteElement(xml);
    expect(result.truncated).toBe(false);
    expect(result.xml).toBe(xml);
  });

  it('preserves XML with whitespace before wrapper close tags', () => {
    const xml = '<root><mxCell id="1"/>\n  </root>\n</mxGraphModel>';
    const result = truncateToLastCompleteElement(xml);
    expect(result.truncated).toBe(false);
  });

  it('handles container mxCell with children', () => {
    const xml =
      '<root><mxCell id="1"><mxGeometry x="0" y="0" as="geometry"/></mxCell><mxCell id="2" sty';
    const result = truncateToLastCompleteElement(xml);
    expect(result.truncated).toBe(true);
    expect(result.xml).toBe(
      '<root><mxCell id="1"><mxGeometry x="0" y="0" as="geometry"/></mxCell>'
    );
  });

  it('returns unchanged when no content elements exist', () => {
    const xml = '<mxfile><diagram><mxGraphMo';
    const result = truncateToLastCompleteElement(xml);
    expect(result.truncated).toBe(false);
    expect(result.xml).toBe(xml);
  });

  it('returns unchanged when cutPoint is at end of string', () => {
    const xml = '<root><mxCell id="1"/>';
    const result = truncateToLastCompleteElement(xml);
    expect(result.truncated).toBe(false);
  });
});

describe('repairXml with element truncation', () => {
  it('strips broken element then appends closing tags', () => {
    const xml =
      '<mxfile><diagram><mxGraphModel><root>' +
      '<mxCell id="0"/><mxCell id="1" parent="0"/>' +
      '<mxCell id="2" value="A" style="rounded=1;fillColor=#F5';
    const result = repairXml(xml);
    expect(result.repaired).toBe(true);
    expect(result.elementsTruncated).toBe(true);
    expect(result.xml).toContain('</mxfile>');
    expect(result.xml).not.toContain('fillColor=#F5');
  });

  it('still works for clean truncation (no broken element)', () => {
    const xml =
      '<mxfile><diagram><mxGraphModel><root><mxCell id="0"/>';
    const result = repairXml(xml);
    expect(result.repaired).toBe(true);
    expect(result.elementsTruncated).toBe(false);
    expect(result.xml).toContain('</root>');
    expect(result.xml).toContain('</mxfile>');
  });
});

describe('tryRepairXml with mid-attribute truncation', () => {
  it('produces valid XML after stripping broken element', () => {
    const xml =
      '<mxfile><diagram><mxGraphModel><root>' +
      '<mxCell id="0"/><mxCell id="1" parent="0"/>' +
      '<mxCell id="2" value="A" style="rounded=1;fillColor=#F5';
    const result = tryRepairXml(xml);
    expect(result.valid).toBe(true);
    expect(result.repaired).toBe(true);
    expect(result.xml).toContain('</mxfile>');
    expect(result.xml).not.toContain('fillColor=#F5');
  });

  it('still fails for input with no complete elements at all', () => {
    const xml = '<mxfile><diagram><mxGraphModel><root><mxCell id="1" style="font';
    const result = tryRepairXml(xml);
    // No /> or </mxCell> in input, so truncation can't help
    expect(result.valid).toBe(false);
    expect(result.repaired).toBe(false);
  });
});

describe('detectMissingTags', () => {
  it('detects all missing wrapper close tags', () => {
    const xml = '<mxfile><diagram><mxGraphModel><root><mxCell id="0"/>';
    const result = detectMissingTags(xml);
    expect(result.isTruncated).toBe(true);
    expect(result.missingTags).toEqual([
      '</root>',
      '</mxGraphModel>',
      '</diagram>',
      '</mxfile>',
    ]);
  });

  it('returns empty for complete XML', () => {
    const xml = '<mxfile><diagram><mxGraphModel><root></root></mxGraphModel></diagram></mxfile>';
    const result = detectMissingTags(xml);
    expect(result.isTruncated).toBe(false);
    expect(result.missingTags).toEqual([]);
  });
});
