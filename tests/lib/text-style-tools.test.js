import { describe, expect, it } from 'vitest';

import { applyTextStyleTool } from '@/lib/text-style-tools';
import { parseStyle } from '@/lib/theme-engine';

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <mxCell id="2" value="Long node label" style="fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1">
      <mxGeometry x="40" y="40" width="120" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="3" value="Edge label" style="strokeColor=#2C3E50;endArrow=classicBlock;" edge="1" parent="1" source="2" target="2">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>`;

function getStyle(xml, cellId) {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const cell = doc.querySelector(`mxCell[id="${cellId}"]`);
  return parseStyle(cell.getAttribute('style') || '');
}

describe('applyTextStyleTool', () => {
  it('wraps labels for all labeled cells', () => {
    const result = applyTextStyleTool(SAMPLE_XML, 'wrapLabels');

    expect(result.error).toBeNull();
    expect(getStyle(result.xml, '2').html).toBe('1');
    expect(getStyle(result.xml, '2').whiteSpace).toBe('wrap');
    expect(getStyle(result.xml, '3').whiteSpace).toBe('wrap');
  });

  it('centers text for labeled cells', () => {
    const result = applyTextStyleTool(SAMPLE_XML, 'centerText');

    expect(result.error).toBeNull();
    expect(getStyle(result.xml, '2').align).toBe('center');
    expect(getStyle(result.xml, '2').verticalAlign).toBe('middle');
  });

  it('adds text panel background and border', () => {
    const result = applyTextStyleTool(SAMPLE_XML, 'textPanels');

    expect(result.error).toBeNull();
    expect(getStyle(result.xml, '2').labelBackgroundColor).toBe('#ffffff');
    expect(getStyle(result.xml, '2').labelBorderColor).toBe('#d0d7de');
  });
});
