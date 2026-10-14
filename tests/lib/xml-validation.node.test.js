// @vitest-environment node

import { describe, expect, it } from 'vitest';
import { validateRepairedXml, tryRepairXml, detectMissingTags } from '@/lib/xml-repair';
import { parseGeneratedContent } from '@/lib/generation-utils';

const BASE_CELLS = '<mxCell id="0"/><mxCell id="1" parent="0"/>';
const model = (cells = '') => `<mxGraphModel><root>${BASE_CELLS}${cells}</root></mxGraphModel>`;
const page = (id, cells = '') => `<diagram id="${id}">${model(cells)}</diagram>`;
const file = (pages) => `<mxfile>${pages}</mxfile>`;
const vertex = (id, parent = '1') => `<mxCell id="${id}" vertex="1" parent="${parent}"><mxGeometry x="0" y="0" width="120" height="60" as="geometry"/></mxCell>`;

describe('mxGraph validation without browser DOM', () => {
  it('parses XML in a real Node environment', () => {
    expect(typeof globalThis.DOMParser).toBe('undefined');
    expect(validateRepairedXml(file(page('one', vertex('node'))))).toMatchObject({
      isValid: true,
      error: null,
      pageCount: 1,
      cellCount: 3,
    });
  });

  it.each([
    '<mxfile><diagram></mxfile>',
    '<mxfile><diagram id=unquoted/></mxfile>',
    '<mxfile><diagram label="&unknown;"/></mxfile>',
    '<mxfile><diagram label="A & B"/></mxfile>',
    '<mxfile><diagram label="A\u0000B"/></mxfile>',
    `${file(page('one'))}${file(page('two'))}`,
  ])('rejects malformed XML instead of accepting a recovered DOM: %s', (xml) => {
    const result = validateRepairedXml(xml);
    expect(result.isValid).toBe(false);
    expect(result.diagnostics[0].code).toBe('XML_PARSE_ERROR');
  });

  it('requires the draw.io document and base cells', () => {
    expect(validateRepairedXml('<root/>').diagnostics[0].code).toBe('INVALID_DOCUMENT_ROOT');
    expect(validateRepairedXml('<mxfile/>').diagnostics[0].code).toBe('INVALID_DIAGRAMS');
    expect(validateRepairedXml('<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>').diagnostics[0].code).toBe('INVALID_BASE_CELLS');
  });

  it('validates a bare graph model', () => {
    expect(validateRepairedXml(model(vertex('node'))).isValid).toBe(true);
  });

  it('preserves valid rich text, Unicode and escaped XML entities', () => {
    const cells = vertex('node').replace('vertex="1"', 'value="&lt;b&gt;参数 &amp; &#x3B1;&lt;/b&gt;&lt;br&gt;A &quot;B&quot;" vertex="1"');
    const xml = file(page('one', cells));
    expect(validateRepairedXml(xml).isValid).toBe(true);
    expect(parseGeneratedContent(xml).generatedXml).toBe(xml);
  });

  it('allows the same cell ids on separate pages', () => {
    expect(validateRepairedXml(file(page('one', vertex('node')) + page('two', vertex('node'))))).toMatchObject({
      isValid: true,
      pageCount: 2,
      cellCount: 6,
    });
  });

  it('rejects duplicate cell ids inside one page', () => {
    const result = validateRepairedXml(file(page('one', vertex('node') + vertex('node'))));
    expect(result.diagnostics[0]).toMatchObject({ code: 'DUPLICATE_CELL_ID', pageId: 'one', cellId: 'node' });
  });

  it.each(['parent', 'source', 'target'])('rejects missing %s references within the page', (attribute) => {
    const cell = attribute === 'parent'
      ? vertex('node', 'missing')
      : `<mxCell id="edge" edge="1" parent="1" ${attribute}="missing"><mxGeometry relative="1" as="geometry"/></mxCell>`;
    expect(validateRepairedXml(file(page('one', cell))).diagnostics[0]).toMatchObject({
      code: 'DANGLING_CELL_REFERENCE',
      attribute,
      pageId: 'one',
    });
  });

  it('does not resolve references against cells in another page', () => {
    const first = page('one', vertex('local', 'other-page'));
    const second = page('two', vertex('other-page'));
    expect(validateRepairedXml(file(first + second)).diagnostics[0]).toMatchObject({ code: 'DANGLING_CELL_REFERENCE', pageIndex: 0 });
  });

  it('accepts free-floating edges and cyclic source/target graphs', () => {
    const cells = vertex('a') + vertex('b')
      + '<mxCell id="e1" edge="1" parent="1" source="a" target="b"><mxGeometry relative="1" as="geometry"/></mxCell>'
      + '<mxCell id="e2" edge="1" parent="1" source="b" target="a"><mxGeometry relative="1" as="geometry"/></mxCell>'
      + '<mxCell id="floating" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="0" y="0" as="sourcePoint"/><mxPoint x="100" y="0" as="targetPoint"/></mxGeometry></mxCell>';
    expect(validateRepairedXml(file(page('one', cells))).isValid).toBe(true);
  });

  it('supports standard object wrappers with ids on the wrapper', () => {
    const cells = '<object id="node" label="Metadata"><mxCell vertex="1" parent="1"><mxGeometry width="120" height="60" as="geometry"/></mxCell></object>';
    expect(validateRepairedXml(file(page('one', cells))).isValid).toBe(true);
  });

  it('rejects nested cells and unowned graph text', () => {
    const nested = '<mxCell id="node" parent="1"><mxCell id="nested" parent="1"/></mxCell>';
    expect(validateRepairedXml(file(page('one', nested))).diagnostics[0].code).toBe('INVALID_GRAPH_CELL');
    expect(validateRepairedXml(model().replace('<root>', '<root>junk')).diagnostics[0].code).toBe('INVALID_GRAPH_ROOT');
  });

  it('rejects cyclic containment', () => {
    expect(validateRepairedXml(file(page('one', vertex('a', 'b') + vertex('b', 'a')))).diagnostics[0].code).toBe('CYCLIC_PARENT');
  });

  it('requires valid geometry for visible vertices and edges', () => {
    const bad = '<mxCell id="node" parent="1" vertex="1"><mxGeometry width="NaN" height="60" as="geometry"/></mxCell>';
    expect(validateRepairedXml(file(page('one', bad))).diagnostics[0].code).toBe('INVALID_GEOMETRY_VALUE');
    expect(validateRepairedXml(file(page('one', '<mxCell id="node" parent="1" vertex="1"/>'))).diagnostics[0].code).toBe('INVALID_CELL_GEOMETRY');
  });

  it('reports compressed pages as unsupported', () => {
    const xml = file('<diagram id="compressed">eJzLz0...</diagram>');
    expect(validateRepairedXml(xml).diagnostics[0].code).toBe('UNSUPPORTED_COMPRESSED_DIAGRAM');
    expect(parseGeneratedContent(xml)).toMatchObject({ status: 'invalid', shouldApply: false, generatedXml: '' });
  });

  it('rejects DOCTYPE instead of resolving custom entities', () => {
    expect(validateRepairedXml(`<!DOCTYPE mxfile [<!ENTITY label "hello">]>${file(page('one'))}`).diagnostics[0].code).toBe('UNSUPPORTED_DOCTYPE');
  });

  it('detects missing wrappers on a later page', () => {
    const xml = `<mxfile>${page('one')}<diagram id="two"><mxGraphModel><root>${BASE_CELLS}`;
    expect(detectMissingTags(xml).missingTags).toEqual(['</root>', '</mxGraphModel>', '</diagram>', '</mxfile>']);
    expect(tryRepairXml(xml)).toMatchObject({ valid: true, repaired: true });
  });

  it('returns the original draft when repaired XML still has a missing reference', () => {
    const xml = `<mxfile><diagram><mxGraphModel><root>${BASE_CELLS}${vertex('node', 'missing')}`;
    expect(tryRepairXml(xml)).toMatchObject({ xml, repaired: false, valid: false });
  });
});
