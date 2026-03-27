import { describe, expect, it } from 'vitest';

import { applyStylePack } from '@/lib/style-packs';
import { parseStyle } from '@/lib/theme-engine';

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <mxCell id="2" value="Node A" style="fillColor=#dae8fc;strokeColor=#6c8ebf;shadow=1;rounded=1;arcSize=10;" vertex="1" parent="1">
      <mxGeometry x="40" y="40" width="120" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="3" value="Edge label" style="strokeColor=#2C3E50;curved=1;dashed=1;dashPattern=8 8;" edge="1" parent="1" source="2" target="2">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>`;

function getStyle(xml, cellId) {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const cell = doc.querySelector(`mxCell[id="${cellId}"]`);
  return parseStyle(cell.getAttribute('style') || '');
}

describe('applyStylePack', () => {
  it('applies research clean pack', () => {
    const result = applyStylePack(SAMPLE_XML, 'researchClean');

    expect(result.error).toBeNull();
    expect(getStyle(result.xml, '2').shadow).toBeUndefined();
    expect(getStyle(result.xml, '2').rounded).toBe('0');
    expect(getStyle(result.xml, '2').strokeWidth).toBe('2');
    expect(getStyle(result.xml, '3').edgeStyle).toBe('orthogonalEdgeStyle');
    expect(getStyle(result.xml, '3').curved).toBeUndefined();
  });

  it('applies presentation cards pack', () => {
    const result = applyStylePack(SAMPLE_XML, 'presentationCards');

    expect(result.error).toBeNull();
    expect(getStyle(result.xml, '2').rounded).toBe('1');
    expect(getStyle(result.xml, '2').shadow).toBe('1');
    expect(getStyle(result.xml, '3').curved).toBe('1');
    expect(getStyle(result.xml, '3').edgeStyle).toBeUndefined();
  });

  it('applies wireframe pack', () => {
    const result = applyStylePack(SAMPLE_XML, 'wireframe');

    expect(result.error).toBeNull();
    expect(getStyle(result.xml, '2').fillOpacity).toBe('20');
    expect(getStyle(result.xml, '2').shadow).toBeUndefined();
    expect(getStyle(result.xml, '3').dashed).toBe('1');
    expect(getStyle(result.xml, '3').dashPattern).toBe('6 6');
  });
});
