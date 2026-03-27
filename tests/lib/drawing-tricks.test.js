import { describe, expect, it } from 'vitest';

import { applyTrick, jumpCrossings, tricks } from '@/lib/drawing-tricks';
import { parseStyle } from '@/lib/theme-engine';

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <mxCell id="2" value="Node A" style="fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1">
      <mxGeometry x="40" y="40" width="120" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="3" value="Node B" style="fillColor=#fff2cc;strokeColor=#d6b656;" vertex="1" parent="1">
      <mxGeometry x="260" y="40" width="120" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="4" value="Flow" style="strokeColor=#2C3E50;curved=1;endArrow=classicBlock;" edge="1" parent="1" source="2" target="3">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>`;

const DIAGONAL_XML = `<?xml version="1.0" encoding="UTF-8"?>
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <mxCell id="2" value="Source" style="fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1">
      <mxGeometry x="320" y="200" width="120" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="3" value="Target" style="fillColor=#fff2cc;strokeColor=#d6b656;" vertex="1" parent="1">
      <mxGeometry x="40" y="80" width="120" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="4" value="Diagonal Flow" style="strokeColor=#2C3E50;endArrow=classicBlock;" edge="1" parent="1" source="2" target="3">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>`;

function getStyle(xml, cellId) {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const cell = doc.querySelector(`mxCell[id="${cellId}"]`);
  return parseStyle(cell.getAttribute('style') || '');
}

describe('applyTrick', () => {
  it('applies orthogonal routing to connectors', () => {
    const result = applyTrick(SAMPLE_XML, 'orthogonalRouting');

    expect(result.error).toBeNull();
    expect(getStyle(result.xml, '4').edgeStyle).toBe('orthogonalEdgeStyle');
    expect(getStyle(result.xml, '4').orthogonalLoop).toBe('1');
    expect(getStyle(result.xml, '4').jettySize).toBe('auto');
    expect(getStyle(result.xml, '4').curved).toBeUndefined();
  });

  it('applies curved routing and removes orthogonal keys', () => {
    const orthogonal = applyTrick(SAMPLE_XML, 'orthogonalRouting');
    const curved = applyTrick(orthogonal.xml, 'curvedRouting');

    expect(curved.error).toBeNull();
    expect(getStyle(curved.xml, '4').curved).toBe('1');
    expect(getStyle(curved.xml, '4').edgeStyle).toBeUndefined();
    expect(getStyle(curved.xml, '4').orthogonalLoop).toBeUndefined();
    expect(getStyle(curved.xml, '4').jettySize).toBeUndefined();
  });

  it('adds label backgrounds only for labeled edges', () => {
    const result = applyTrick(SAMPLE_XML, 'labelBackground');

    expect(result.error).toBeNull();
    expect(getStyle(result.xml, '4').labelBackgroundColor).toBe('#ffffff');
    expect(getStyle(result.xml, '2').labelBackgroundColor).toBeUndefined();
  });
});

function buildFanOutXml(edgeCount) {
  const cells = [
    '<mxCell id="0"/>',
    '<mxCell id="1" parent="0"/>',
    '<mxCell id="src" value="Source" style="fillColor=#dae8fc;" vertex="1" parent="1"><mxGeometry x="0" y="100" width="120" height="60" as="geometry"/></mxCell>',
  ];
  for (let i = 0; i < edgeCount; i++) {
    const tId = `t${i}`;
    cells.push(`<mxCell id="${tId}" value="T${i}" style="fillColor=#fff2cc;" vertex="1" parent="1"><mxGeometry x="400" y="${i * 50}" width="120" height="60" as="geometry"/></mxCell>`);
    cells.push(`<mxCell id="e${i}" style="endArrow=classicBlock;" edge="1" parent="1" source="src" target="${tId}"><mxGeometry relative="1" as="geometry"/></mxCell>`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?><mxGraphModel><root>${cells.join('')}</root></mxGraphModel>`;
}

describe('jumpCrossings', () => {
  it('adds jumpStyle and jumpSize to all edges', () => {
    const result = jumpCrossings(SAMPLE_XML);
    expect(result.error).toBeNull();
    const style = getStyle(result.xml, '4');
    expect(style.jumpStyle).toBe('arc');
    expect(style.jumpSize).toBe('8');
  });

  it('overwrites existing jumpStyle values', () => {
    const xml = SAMPLE_XML.replace(
      'endArrow=classicBlock;',
      'endArrow=classicBlock;jumpStyle=line;jumpSize=4;'
    );
    const result = jumpCrossings(xml);
    const style = getStyle(result.xml, '4');
    expect(style.jumpStyle).toBe('arc');
    expect(style.jumpSize).toBe('8');
  });

  it('is registered in tricks with correct metadata', () => {
    expect(tricks.jumpCrossings).toBeDefined();
    expect(tricks.jumpCrossings.id).toBe('jumpCrossings');
    expect(tricks.jumpCrossings.name).toBe('交叉跳跃');
    expect(tricks.jumpCrossings.scope).toBe('global');
  });
});
