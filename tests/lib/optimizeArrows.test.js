import { describe, it, expect } from 'vitest';
import { optimizeExcalidrawCode } from '@/lib/optimizeArrows';

function optimizeBoundArrow(start, end) {
  const elements = [
    { id: 'a', type: 'rectangle', width: 100, height: 100, ...start },
    { id: 'b', type: 'rectangle', width: 100, height: 100, ...end },
    { id: 'edge', type: 'arrow', x: -1, y: -1, width: -1, height: -1,
      start: { id: 'a' }, end: { id: 'b' } },
  ];
  return JSON.parse(optimizeExcalidrawCode(JSON.stringify(elements))).find(el => el.id === 'edge');
}

describe('bound arrow geometry', () => {
  it.each([
    [{x:0,y:0}, {x:300,y:0}, {x:100,y:50,width:200,height:0}],
    [{x:300,y:0}, {x:0,y:0}, {x:300,y:50,width:-200,height:0}],
    [{x:0,y:0}, {x:0,y:300}, {x:50,y:100,width:1,height:200}],
    [{x:0,y:300}, {x:0,y:0}, {x:50,y:300,width:1,height:-200}],
    [{x:0,y:0}, {x:300,y:100}, {x:100,y:50,width:200,height:100}],
    [{x:0,y:0}, {x:100,y:300}, {x:50,y:100,width:100,height:200}],
  ])('attaches arrow to rectangle boundaries (%j → %j)', (start, end, expected) => {
    expect(optimizeBoundArrow(start, end)).toMatchObject(expected);
  });

  it('keeps an unbound arrow geometry unchanged', () => {
    const arrow = {id:'edge',type:'arrow',x:11,y:22,width:33,height:44};
    expect(JSON.parse(optimizeExcalidrawCode(JSON.stringify([arrow])))).toEqual([arrow]);
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
