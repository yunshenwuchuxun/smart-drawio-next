import { describe, expect, it } from 'vitest';

import { parseStyle } from '@/lib/theme-engine';
import { applyThemePostProcessing } from '@/lib/theme-postprocess';

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <mxCell id="2" value="Input" style="fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1">
      <mxGeometry x="40" y="40" width="100" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="3" value="Encoder" style="fillColor=#fff2cc;strokeColor=#d6b656;" vertex="1" parent="1">
      <mxGeometry x="240" y="40" width="100" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="4" value="Output" style="fillColor=#d5e8d4;strokeColor=#82b366;" vertex="1" parent="1">
      <mxGeometry x="400" y="40" width="100" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="5" value="Flow" style="strokeColor=#2C3E50;curved=1;endArrow=classicBlock;" edge="1" parent="1" source="2" target="4">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>`;

const COMPLEX_SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <mxCell id="10" value="Input Layer" style="swimlane;startSize=30;fillColor=#F7F9FC;strokeColor=#2C3E50;" vertex="1" parent="1">
      <mxGeometry x="40" y="20" width="520" height="120" as="geometry"/>
    </mxCell>
    <mxCell id="11" value="Protein Sequence" style="rounded=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="10">
      <mxGeometry x="30" y="50" width="120" height="50" as="geometry"/>
    </mxCell>
    <mxCell id="12" value="Token Embedding" style="rounded=1;fillColor=#d5e8d4;strokeColor=#82b366;" vertex="1" parent="10">
      <mxGeometry x="300" y="50" width="120" height="50" as="geometry"/>
    </mxCell>
    <mxCell id="13" value="Flow" style="strokeColor=#2C3E50;curved=1;endArrow=classicBlock;" edge="1" parent="10" source="11" target="12">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>`;

function getStyle(xml, cellId) {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const cell = doc.querySelector(`mxCell[id="${cellId}"]`);
  return parseStyle(cell.getAttribute('style') || '');
}

function getX(xml, cellId) {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const geo = doc.querySelector(`mxCell[id="${cellId}"] > mxGeometry`);
  return Number(geo.getAttribute('x'));
}

describe('applyThemePostProcessing', () => {
  it('applies research theme with orthogonal routing', () => {
    const result = applyThemePostProcessing(SAMPLE_XML, 'research');

    expect(result.applied).toHaveLength(1);
    expect(result.applied.map((item) => item.trickId)).toEqual(['orthogonalRouting']);
    expect(getStyle(result.xml, '5').edgeStyle).toBe('orthogonalEdgeStyle');
    expect(getStyle(result.xml, '5').curved).toBeUndefined();
  });

  it('applies business theme with no tricks', () => {
    const result = applyThemePostProcessing(SAMPLE_XML, 'business');

    expect(result.applied).toHaveLength(0);
  });

  it('applies cool theme with orthogonal routing', () => {
    const result = applyThemePostProcessing(SAMPLE_XML, 'cool');

    expect(result.applied).toHaveLength(1);
    expect(result.applied.map((item) => item.trickId)).toEqual(['orthogonalRouting']);
  });

  it('applies contrast theme with two tricks', () => {
    const result = applyThemePostProcessing(SAMPLE_XML, 'contrast');

    expect(result.applied).toHaveLength(2);
    expect(result.applied.map((item) => item.trickId)).toEqual(['orthogonalRouting', 'jumpCrossings']);
  });

  it('applies no tricks for remaining themes', () => {
    for (const themeId of ['warm', 'dark', 'pastel', 'forest', 'violet', 'neutral']) {
      const result = applyThemePostProcessing(SAMPLE_XML, themeId);
      expect(result.applied).toHaveLength(0);
    }
  });

  it('does not reposition nodes in complex container diagrams', () => {
    const result = applyThemePostProcessing(COMPLEX_SAMPLE_XML, 'research');

    expect(getX(result.xml, '11')).toBe(30);
    expect(getX(result.xml, '12')).toBe(300);
    expect(getStyle(result.xml, '13').edgeStyle).toBe('orthogonalEdgeStyle');
  });
});
