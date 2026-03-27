import { describe, expect, it } from 'vitest';

import { stylePresets } from '@/lib/style-presets';
import { applyPreset, applyTheme, parseStyle, resetStyles, stringifyStyle } from '@/lib/theme-engine';

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
    <mxCell id="4" value="Flow" style="strokeColor=#2C3E50;endArrow=classicBlock;" edge="1" parent="1" source="2" target="3">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>`;

function getStyle(xml, cellId) {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const cell = doc.querySelector(`mxCell[id="${cellId}"]`);
  return parseStyle(cell.getAttribute('style') || '');
}

describe('applyPreset', () => {
  it('keeps shadow preset scoped to vertices', () => {
    const result = applyPreset(SAMPLE_XML, 'shadow', true, stylePresets);

    expect(result.error).toBeNull();
    expect(getStyle(result.xml, '2').shadow).toBe('1');
    expect(getStyle(result.xml, '4').shadow).toBeUndefined();
  });

  it('removes rounded keys when rounded preset is disabled', () => {
    const enabled = applyPreset(SAMPLE_XML, 'rounded', true, stylePresets);
    const disabled = applyPreset(enabled.xml, 'rounded', false, stylePresets);

    expect(getStyle(disabled.xml, '2').rounded).toBeUndefined();
    expect(getStyle(disabled.xml, '2').arcSize).toBeUndefined();
  });

  it('applies transparency only to vertices', () => {
    const result = applyPreset(SAMPLE_XML, 'transparent', true, stylePresets);

    expect(getStyle(result.xml, '2').fillOpacity).toBe('70');
    expect(getStyle(result.xml, '4').fillOpacity).toBeUndefined();
  });

  it('applies dashed preset to both shapes and connectors', () => {
    const result = applyPreset(SAMPLE_XML, 'dashed', true, stylePresets);

    expect(getStyle(result.xml, '2').dashed).toBe('1');
    expect(getStyle(result.xml, '4').dashed).toBe('1');
    expect(getStyle(result.xml, '4').dashPattern).toBe('8 8');
  });
});

describe('resetStyles', () => {
  it('removes every registered preset style key', () => {
    const withSketch = applyPreset(SAMPLE_XML, 'sketch', true, stylePresets);
    const withDashed = applyPreset(withSketch.xml, 'dashed', true, stylePresets);
    const withTransparent = applyPreset(withDashed.xml, 'transparent', true, stylePresets);
    const resetXml = resetStyles(withTransparent.xml, stylePresets);

    expect(getStyle(resetXml, '2').sketch).toBeUndefined();
    expect(getStyle(resetXml, '2').dashed).toBeUndefined();
    expect(getStyle(resetXml, '2').dashPattern).toBeUndefined();
    expect(getStyle(resetXml, '2').fillOpacity).toBeUndefined();
    expect(getStyle(resetXml, '4').sketch).toBeUndefined();
    expect(getStyle(resetXml, '4').dashed).toBeUndefined();
  });
});

const THEME_SWITCH_XML = `<?xml version="1.0" encoding="UTF-8"?>
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <mxCell id="2" value="Node" style="fillColor=#dae8fc;strokeColor=#2C3E50;fontFamily=Arial, Helvetica, sans-serif;fontSize=12;strokeWidth=2;" vertex="1" parent="1">
      <mxGeometry x="40" y="40" width="120" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="3" value="Node B" style="fillColor=#3498DB;strokeColor=#2C3E50;fontFamily=Arial, Helvetica, sans-serif;fontSize=12;strokeWidth=2;" vertex="1" parent="1">
      <mxGeometry x="260" y="40" width="120" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="4" style="strokeColor=#2C3E50;edgeStyle=orthogonalEdgeStyle;strokeWidth=2;endArrow=classicBlock;" edge="1" parent="1" source="2" target="3">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>`;

describe('applyTheme non-color properties', () => {
  it('replaces fontFamily on all cells', () => {
    const result = applyTheme(THEME_SWITCH_XML, 'research', 'warm');
    expect(getStyle(result, '2').fontFamily).toBe('Georgia, serif');
    expect(getStyle(result, '3').fontFamily).toBe('Georgia, serif');
    expect(getStyle(result, '4').fontFamily).toBe('Georgia, serif');
  });

  it('replaces fontSize on all cells', () => {
    const result = applyTheme(THEME_SWITCH_XML, 'research', 'business');
    expect(getStyle(result, '2').fontSize).toBe('13');
  });

  it('replaces strokeWidth on all cells', () => {
    const result = applyTheme(THEME_SWITCH_XML, 'research', 'cool');
    expect(getStyle(result, '2').strokeWidth).toBe('1.5');
  });

  it('switches to curved edges for warm theme', () => {
    const result = applyTheme(THEME_SWITCH_XML, 'research', 'warm');
    const edgeStyle = getStyle(result, '4');
    expect(edgeStyle.curved).toBe('1');
    expect(edgeStyle.edgeStyle).toBeUndefined();
    expect(edgeStyle.orthogonalLoop).toBeUndefined();
    expect(edgeStyle.jettySize).toBeUndefined();
  });

  it('sets edgeStyle on edges for orthogonal theme', () => {
    const curvedXml = THEME_SWITCH_XML.replace(
      'edgeStyle=orthogonalEdgeStyle;',
      'curved=1;'
    );
    const result = applyTheme(curvedXml, 'warm', 'cool');
    const edgeStyle = getStyle(result, '4');
    expect(edgeStyle.edgeStyle).toBe('orthogonalEdgeStyle');
    expect(edgeStyle.curved).toBeUndefined();
  });

  it('sets rounded=1 on edges when edgeRounded=1', () => {
    const result = applyTheme(THEME_SWITCH_XML, 'research', 'business');
    expect(getStyle(result, '4').rounded).toBe('1');
  });

  it('preserves color mapping alongside non-color changes', () => {
    const result = applyTheme(THEME_SWITCH_XML, 'research', 'cool');
    expect(getStyle(result, '2').fillColor).toBe('#CCFBF1');
    expect(getStyle(result, '2').fontFamily).toBe('Inter, system-ui, sans-serif');
  });
});

describe('parseStyle/stringifyStyle round-trip', () => {
  it('round-trips a well-formed style string', () => {
    const original = 'fillColor=#dae8fc;strokeColor=#6c8ebf;rounded=1;';
    const obj = parseStyle(original);
    const str = stringifyStyle(obj);
    const obj2 = parseStyle(str);
    expect(obj2).toEqual(obj);
  });

  it('stabilizes after two round-trips', () => {
    const s = 'fillColor=#dae8fc;strokeColor=#6c8ebf;shadow=1;';
    const once = stringifyStyle(parseStyle(s));
    const twice = stringifyStyle(parseStyle(once));
    expect(twice).toBe(once);
  });
});
