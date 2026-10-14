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

  it.each(['researchClean', 'presentationCards'])('keeps shape labels wrapped and widthless edge labels horizontal for %s', (packId) => {
    const wrapped = SAMPLE_XML.replace('strokeColor=#2C3E50;curved=1;', 'strokeColor=#2C3E50;whiteSpace=wrap;curved=1;');
    const result = applyStylePack(wrapped, packId);

    expect(result.error).toBeNull();
    expect(getStyle(result.xml, '2').whiteSpace).toBe('wrap');
    expect(getStyle(result.xml, '3').whiteSpace).toBe('nowrap');
    expect(getStyle(result.xml, '3').html).toBe('1');
    const doc = new DOMParser().parseFromString(result.xml, 'text/xml');
    expect(doc.querySelector('mxCell[id="3"]').getAttribute('value')).toBe('Edge label');
    expect(doc.querySelector('mxCell[id="3"] mxGeometry').hasAttribute('width')).toBe(false);
  });

  it.each(['researchClean', 'presentationCards'])('preserves bounded edge label wrapping and uses a filled registered arrow for %s', (packId) => {
    const bounded = SAMPLE_XML.replace('strokeColor=#2C3E50;curved=1;', 'strokeColor=#2C3E50;labelWidth=160;whiteSpace=wrap;endArrow=classicBlock;endFill=0;curved=1;');
    const result = applyStylePack(bounded, packId);
    const edgeStyle = getStyle(result.xml, '3');

    expect(result.error).toBeNull();
    expect(edgeStyle.whiteSpace).toBe('wrap');
    expect(edgeStyle.labelWidth).toBe('160');
    expect(edgeStyle.endArrow).toBe('block');
    expect(edgeStyle.endFill).toBe('1');
  });

  it.each(['0', '-1', 'NaN', 'none'])('does not wrap edge labels with unusable explicit labelWidth=%s', (labelWidth) => {
    const input = SAMPLE_XML.replace('strokeColor=#2C3E50;curved=1;', `strokeColor=#2C3E50;labelWidth=${labelWidth};whiteSpace=wrap;curved=1;`);
    for (const packId of ['researchClean', 'presentationCards']) {
      const result = applyStylePack(input, packId);
      expect(result.error).toBeNull();
      expect(getStyle(result.xml, '3').whiteSpace).toBe('nowrap');
    }
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
