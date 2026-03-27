import { describe, it, expect } from 'vitest';
import { determineEdges, getEdgeCenter, optimizeExcalidrawCode, ANGLE_THRESHOLD } from '@/lib/optimizeArrows';

describe('determineEdges', () => {
  const createEl = (x, y, w = 100, h = 100) => ({ x, y, width: w, height: h });

  it('returns left/right when start is to the right of end', () => {
    const start = createEl(300, 100);
    const end = createEl(0, 100);
    const { startEdge, endEdge } = determineEdges(start, end);
    expect(startEdge).toBe('left');
    expect(endEdge).toBe('right');
  });

  it('returns right/left when start is to the left of end', () => {
    const start = createEl(0, 100);
    const end = createEl(300, 100);
    const { startEdge, endEdge } = determineEdges(start, end);
    expect(startEdge).toBe('right');
    expect(endEdge).toBe('left');
  });

  it('returns top/bottom when start is below end', () => {
    const start = createEl(100, 300);
    const end = createEl(100, 0);
    const { startEdge, endEdge } = determineEdges(start, end);
    expect(startEdge).toBe('top');
    expect(endEdge).toBe('bottom');
  });

  it('returns bottom/top when start is above end', () => {
    const start = createEl(100, 0);
    const end = createEl(100, 300);
    const { startEdge, endEdge } = determineEdges(start, end);
    expect(startEdge).toBe('bottom');
    expect(endEdge).toBe('top');
  });

  it('handles lower-right quadrant', () => {
    const start = createEl(300, 300);
    const end = createEl(0, 0);
    const result = determineEdges(start, end);
    expect(['left', 'top']).toContain(result.startEdge);
    expect(['right', 'bottom']).toContain(result.endEdge);
  });

  it('handles lower-left quadrant', () => {
    const start = createEl(0, 300);
    const end = createEl(300, 0);
    const result = determineEdges(start, end);
    expect(['right', 'top']).toContain(result.startEdge);
    expect(['left', 'bottom']).toContain(result.endEdge);
  });

  it('handles upper-right quadrant', () => {
    const start = createEl(300, 0);
    const end = createEl(0, 300);
    const result = determineEdges(start, end);
    expect(['left', 'bottom']).toContain(result.startEdge);
    expect(['right', 'top']).toContain(result.endEdge);
  });

  it('handles upper-left quadrant', () => {
    const start = createEl(0, 0);
    const end = createEl(300, 300);
    const result = determineEdges(start, end);
    expect(['right', 'bottom']).toContain(result.startEdge);
    expect(['left', 'top']).toContain(result.endEdge);
  });

  it('handles overlapping elements with default', () => {
    const start = createEl(50, 50);
    const end = createEl(50, 50);
    const result = determineEdges(start, end);
    expect(result.startEdge).toBe('right');
    expect(result.endEdge).toBe('left');
  });

  it('exports ANGLE_THRESHOLD as 30 degrees', () => {
    expect(ANGLE_THRESHOLD).toBeCloseTo(Math.PI / 6);
  });

  it('vertical 90° returns bottom/top', () => {
    const start = createEl(200, 0);
    const end = createEl(200, 400);
    const result = determineEdges(start, end);
    expect(result.startEdge).toBe('bottom');
    expect(result.endEdge).toBe('top');
  });

  it('horizontal 0° returns right/left', () => {
    const start = createEl(0, 200);
    const end = createEl(400, 200);
    const result = determineEdges(start, end);
    expect(result.startEdge).toBe('right');
    expect(result.endEdge).toBe('left');
  });

  it('diagonal 45° (in 30°-150° zone) prefers vertical', () => {
    // Source upper-left, target lower-right → angle ≈ 45°
    const start = createEl(0, 0);
    const end = createEl(200, 200);
    const result = determineEdges(start, end);
    expect(result.startEdge).toBe('bottom');
    expect(result.endEdge).toBe('top');
  });

  it('near-horizontal 20° (in -30° to 30° zone) prefers horizontal', () => {
    // Small vertical offset, large horizontal offset → angle ≈ 20°
    const start = createEl(0, 0);
    const end = createEl(500, 100, 100, 100);
    const result = determineEdges(start, end);
    expect(result.startEdge).toBe('right');
    expect(result.endEdge).toBe('left');
  });

  it('exactly at 30° boundary falls into vertical zone', () => {
    // tan(30°) ≈ 0.577, so dy/dx ≈ 0.577. Use dx=100, dy=57.74
    const start = createEl(0, 0, 0, 0);
    const end = createEl(100, 58, 0, 0);
    const result = determineEdges(start, end);
    expect(result.startEdge).toBe('bottom');
    expect(result.endEdge).toBe('top');
  });
});

describe('getEdgeCenter', () => {
  const el = { x: 100, y: 100, width: 200, height: 100 };

  it('returns left edge center', () => {
    const { x, y } = getEdgeCenter(el, 'left');
    expect(x).toBe(100);
    expect(y).toBe(150);
  });

  it('returns right edge center', () => {
    const { x, y } = getEdgeCenter(el, 'right');
    expect(x).toBe(300);
    expect(y).toBe(150);
  });

  it('returns top edge center', () => {
    const { x, y } = getEdgeCenter(el, 'top');
    expect(x).toBe(200);
    expect(y).toBe(100);
  });

  it('returns bottom edge center', () => {
    const { x, y } = getEdgeCenter(el, 'bottom');
    expect(x).toBe(200);
    expect(y).toBe(200);
  });

  it('defaults to right for unknown edge', () => {
    const { x, y } = getEdgeCenter(el, 'unknown');
    expect(x).toBe(300);
    expect(y).toBe(150);
  });

  it('handles missing dimensions', () => {
    const minimal = { x: 0, y: 0 };
    const { x, y } = getEdgeCenter(minimal, 'right');
    expect(x).toBe(100);
    expect(y).toBe(50);
  });
});

describe('optimizeExcalidrawCode', () => {
  it('returns original for non-string input', () => {
    expect(optimizeExcalidrawCode(null)).toBe(null);
    expect(optimizeExcalidrawCode(undefined)).toBe(undefined);
  });

  it('returns original if no array found', () => {
    const code = 'not an array';
    expect(optimizeExcalidrawCode(code)).toBe(code);
  });

  it('preserves non-arrow elements', () => {
    const elements = [{ id: '1', type: 'rectangle', x: 0, y: 0 }];
    const result = JSON.parse(optimizeExcalidrawCode(JSON.stringify(elements)));
    expect(result[0]).toEqual(elements[0]);
  });

  it('optimizes arrow between two bound elements', () => {
    const elements = [
      { id: 'box1', type: 'rectangle', x: 0, y: 0, width: 100, height: 100 },
      { id: 'box2', type: 'rectangle', x: 300, y: 0, width: 100, height: 100 },
      {
        id: 'arrow1',
        type: 'arrow',
        x: 50,
        y: 50,
        width: 200,
        height: 0,
        start: { id: 'box1' },
        end: { id: 'box2' }
      }
    ];
    const result = JSON.parse(optimizeExcalidrawCode(JSON.stringify(elements)));
    const arrow = result.find(el => el.id === 'arrow1');
    expect(arrow.x).toBe(100);
    expect(arrow.y).toBe(50);
    expect(arrow.width).toBe(200);
  });

  it('fixes zero-width arrows', () => {
    const elements = [
      {
        id: 'arrow1',
        type: 'arrow',
        x: 0,
        y: 0,
        width: 0,
        height: 100
      }
    ];
    const result = JSON.parse(optimizeExcalidrawCode(JSON.stringify(elements)));
    expect(result[0].width).toBe(1);
  });
});
