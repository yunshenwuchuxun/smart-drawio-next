// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { validateDiagram, repairDiagram, styleDiagram, listDiagramOptions } from '../../packages/core/src/diagram.js';
import { overlapFix, layoutOptimize } from '../../packages/core/src/layout-optimizer.js';
import { parseXml, findElements, findElement } from '../../packages/core/src/xml-runtime.js';
import { parseStyle } from '../../packages/core/src/theme-engine.js';

const page = (id, x1, x2, y = 10) => `<diagram id="${id}" name="${id}"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="2" value="${id} A" style="ellipse;fillColor=#dae8fc;strokeColor=#2C3E50;customFlag=preserved;" vertex="1" parent="1"><mxGeometry x="${x1}" y="${y}" width="100" height="60" as="geometry"/></mxCell><mxCell id="3" value="${id} B" style="fillColor=#fff2cc;" vertex="1" parent="1"><mxGeometry x="${x2}" y="${y}" width="100" height="60" as="geometry"/></mxCell><mxCell id="4" value="edge" edge="1" parent="1" source="2" target="3" style="edgeStyle=orthogonalEdgeStyle;"><mxGeometry relative="1" as="geometry"><Array as="points"><mxPoint x="5" y="5"/></Array></mxGeometry></mxCell></root></mxGraphModel></diagram>`;
const MULTIPAGE = `<mxfile>${page('first', 13, 50)}${page('second', 503, 703, 200)}</mxfile>`;
const cells = (xml) => findElements(parseXml(xml), 'diagram').map((diagram) => findElements(diagram, 'mxCell'));
const geometry = (xml, pageIndex, cellIndex = 2) => findElement(cells(xml)[pageIndex][cellIndex], 'mxGeometry');

describe('shared diagram services in a real Node environment', () => {
  it('does not install DOM globals and validates independent page-local ids', () => {
    expect(globalThis.DOMParser).toBeUndefined();
    expect(globalThis.XMLSerializer).toBeUndefined();
    expect(validateDiagram(MULTIPAGE)).toMatchObject({ ok: true, diagnostics: [], stats: { pageCount: 2, cellCount: 10 } });
    expect(globalThis.DOMParser).toBeUndefined();
  });

  it('styles both pages, retains labels/links/page identities and preserves named shapes and custom attributes', () => {
    const result = styleDiagram(MULTIPAGE, { theme: 'business', stylePack: 'researchClean', presets: { rounded: true }, textTool: 'boldText', trick: 'gridSnap' });
    expect(result.ok).toBe(true);
    expect(validateDiagram(result.xml).stats).toEqual({ pageCount: 2, cellCount: 10 });
    for (const pageCells of cells(result.xml)) {
      expect(pageCells[2].getAttribute('style')).toContain('ellipse;');
      expect(parseStyle(pageCells[2].getAttribute('style'))).toMatchObject({ rounded: '1', fontStyle: '1', customFlag: 'preserved' });
      expect(pageCells[4].getAttribute('source')).toBe('2');
      expect(pageCells[4].getAttribute('target')).toBe('3');
    }
    expect(result.xml).toContain('first A');
    expect(result.xml).toContain('second A');
    expect(geometry(result.xml, 0).getAttribute('x')).toBe('10');
    expect(geometry(result.xml, 1).getAttribute('x')).toBe('500');
  });

  it('removes waypoints in both pages without changing connector endpoints', () => {
    const result = styleDiagram(MULTIPAGE, { trick: 'removeWaypoints' });
    expect(result.ok).toBe(true);
    expect(findElements(parseXml(result.xml), 'Array', { as: 'points' })).toHaveLength(0);
    for (const pageCells of cells(result.xml)) expect(pageCells[4].getAttribute('target')).toBe('3');
  });

  it('fixes overlap only within the affected page', () => {
    const result = overlapFix(MULTIPAGE);
    expect(result.changed).toBe(true);
    expect(validateDiagram(result.xml).ok).toBe(true);
    expect([geometry(result.xml, 0, 3).getAttribute('x'), geometry(result.xml, 0, 3).getAttribute('y')]).not.toEqual(['50', '10']);
    expect(geometry(result.xml, 1).getAttribute('x')).toBe('503');
    expect(geometry(result.xml, 1, 3).getAttribute('x')).toBe('703');
  });

  it('lays out repeated cell ids separately in every page', () => {
    const result = layoutOptimize(MULTIPAGE);
    expect(result.changed).toBe(true);
    expect(validateDiagram(result.xml).ok).toBe(true);
    expect(geometry(result.xml, 0).getAttribute('x')).toBe('40');
    expect(geometry(result.xml, 1).getAttribute('x')).toBe('40');
    expect(geometry(result.xml, 0).getAttribute('y')).toBe('40');
    expect(geometry(result.xml, 1).getAttribute('y')).toBe('40');
    expect(result.applied.map((entry) => entry.pageIndex)).toContain(0);
    expect(result.applied.map((entry) => entry.pageIndex)).toContain(1);
  });

  it('does not merge unrelated pages when normalizing spacing', () => {
    const singleNode = (id, x) => page(id, x, x + 1000).replace(/<mxCell id="3"[\s\S]*?<\/mxCell>/, '').replace(/<mxCell id="4"[\s\S]*?<\/mxCell>/, '');
    const input = `<mxfile>${singleNode('a', 10)}${singleNode('b', 500)}</mxfile>`;
    const result = styleDiagram(input, { trick: 'consistentSpacing' });
    expect(result.ok).toBe(true);
    expect(result.xml).toBe(input);
  });

  it.each([
    { theme: 'missing' }, { sourceTheme: 'missing' }, { stylePack: 'missing' },
    { textTool: 'missing' }, { trick: 'missing' }, { presets: { missing: true } },
    { presets: { rounded: 'yes' } }, { unknown: true },
  ])('rejects unknown or invalid options without returning partial XML: %j', (options) => {
    const result = styleDiagram(MULTIPAGE, options);
    expect(result.ok).toBe(false);
    expect(result.xml).toBeUndefined();
    expect(result.diagnostics[0]).toMatchObject({ severity: 'error' });
  });

  it('rejects malformed XML, broken graph references and compressed input', () => {
    for (const invalid of ['<mxfile>', MULTIPAGE.replace('source="2"', 'source="missing"'), '<mxfile><diagram>compressed-payload</diagram></mxfile>']) {
      const result = styleDiagram(invalid, { presets: { rounded: true } });
      expect(result.ok).toBe(false);
      expect(result.diagnostics[0].severity).toBe('error');
    }
  });

  it('repairs an explicitly requested incomplete tail with a visible discarded-content warning', () => {
    const partial = MULTIPAGE.slice(0, MULTIPAGE.indexOf('<mxCell id="3"')) + '<mxCell id="3" value="unfinished';
    const result = repairDiagram(partial);
    expect(result.ok).toBe(true);
    expect(result.diagnostics).toContainEqual(expect.objectContaining({ code: 'XML_TAIL_DISCARDED', severity: 'warning' }));
    expect(validateDiagram(result.xml).ok).toBe(true);
    expect(result.stats.discardedCharacters).toBeGreaterThan(0);
  });

  it('returns JSON-safe catalogs with actual user-facing names', () => {
    const result = listDiagramOptions();
    expect(result.ok).toBe(true);
    expect(result.options.chartTypes.find((entry) => entry.id === 'flowchart').name).toBe('流程图');
    expect(result.options.themes).toHaveLength(10);
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
    expect(JSON.stringify(result)).not.toContain('promptFragment');
  });
});
