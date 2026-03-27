import { isEdgeCell, parseStyle, stringifyStyle } from './theme-engine';

export const tricks = {
  gridSnap: {
    id: 'gridSnap',
    name: '网格对齐',
    description: '所有坐标对齐到 10px 网格',
    scope: 'global',
    apply: gridSnap,
  },
  orthogonalRouting: {
    id: 'orthogonalRouting',
    name: '正交路由',
    description: '将所有连线切换为直角折线，并启用自动拐点。',
    scope: 'global',
    apply: orthogonalRouting,
  },
  curvedRouting: {
    id: 'curvedRouting',
    name: '曲线连线',
    description: '将所有连线切换为平滑曲线，适合概念图与展示图。',
    scope: 'global',
    apply: curvedRouting,
  },
  labelBackground: {
    id: 'labelBackground',
    name: '标签背景',
    description: '连线标签添加白色背景',
    scope: 'global',
    apply: labelBackground,
  },
  consistentSpacing: {
    id: 'consistentSpacing',
    name: '统一间距',
    description: '同层元素间距一致化',
    scope: 'global',
    apply: consistentSpacing,
  },
  jumpCrossings: {
    id: 'jumpCrossings',
    name: '交叉跳跃',
    description: '交叉连线显示半圆弧跳跃标记',
    scope: 'global',
    apply: jumpCrossings,
  },
  roundedEdges: {
    id: 'roundedEdges',
    name: '圆角连线',
    description: '所有连线转弯处变为圆角，视觉更柔和',
    scope: 'global',
    apply: roundedEdges,
  },
  normalizeArrows: {
    id: 'normalizeArrows',
    name: '统一箭头',
    description: '统一为终点实心箭头 + 移除起点箭头',
    scope: 'global',
    apply: normalizeArrows,
  },
  removeWaypoints: {
    id: 'removeWaypoints',
    name: '清除拐点',
    description: '移除所有连线手动拐点，让路由自动计算',
    scope: 'global',
    apply: removeWaypoints,
  },
};

export const TRICK_IDS = Object.keys(tricks);

function snapToGrid(value, gridSize = 10) {
  return Math.round(value / gridSize) * gridSize;
}

export function gridSnap(xml) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    if (doc.querySelector('parsererror')) return { xml, error: 'XML parse error', stats: { modified: 0, message: '解析失败' } };

    let modified = 0;
    const geometries = doc.querySelectorAll('mxGeometry');
    geometries.forEach(geo => {
      if (geo.getAttribute('relative') === '1') return;

      const x = geo.getAttribute('x');
      const y = geo.getAttribute('y');
      let changed = false;
      if (x) {
        const snapped = snapToGrid(parseFloat(x));
        if (snapped !== parseFloat(x)) changed = true;
        geo.setAttribute('x', String(snapped));
      }
      if (y) {
        const snapped = snapToGrid(parseFloat(y));
        if (snapped !== parseFloat(y)) changed = true;
        geo.setAttribute('y', String(snapped));
      }
      if (changed) modified++;
    });

    const serializer = new XMLSerializer();
    const message = modified > 0 ? `已对齐 ${modified} 个元素` : '所有元素已对齐';
    return { xml: serializer.serializeToString(doc), error: null, stats: { modified, message } };
  } catch (err) {
    return { xml, error: err.message, stats: { modified: 0, message: err.message } };
  }
}

function transformEdgeStyles(xml, transform, messages) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    if (doc.querySelector('parsererror')) return { xml, error: 'XML parse error', stats: { modified: 0, message: '解析失败' } };

    let modified = 0;
    const cells = doc.querySelectorAll('mxCell');

    cells.forEach(cell => {
      const style = cell.getAttribute('style') || '';
      const styleObj = parseStyle(style);
      if (!isEdgeCell(cell, styleObj)) return;

      const nextStyleObj = transform(cell, styleObj);
      const nextStyle = stringifyStyle(nextStyleObj);
      const currentStyle = stringifyStyle(styleObj);

      if (nextStyle !== currentStyle) {
        cell.setAttribute('style', nextStyle);
        modified++;
      }
    });

    const serializer = new XMLSerializer();
    const message = modified > 0 ? messages.success(modified) : messages.empty;
    return { xml: serializer.serializeToString(doc), error: null, stats: { modified, message } };
  } catch (err) {
    return { xml, error: err.message, stats: { modified: 0, message: err.message } };
  }
}

export function labelBackground(xml) {
  return transformEdgeStyles(
    xml,
    (cell, styleObj) => {
      const value = cell.getAttribute('value');
      if (!value) return styleObj;
      return { ...styleObj, labelBackgroundColor: '#ffffff' };
    },
    {
      success: (modified) => `已为 ${modified} 条连线添加背景`,
      empty: '没有带标签的连线',
    }
  );
}

export function orthogonalRouting(xml) {
  return transformEdgeStyles(
    xml,
    (cell, styleObj) => {
      void cell;
      const nextStyle = { ...styleObj };
      nextStyle.edgeStyle = 'orthogonalEdgeStyle';
      nextStyle.rounded = '0';
      nextStyle.orthogonalLoop = '1';
      nextStyle.jettySize = 'auto';
      delete nextStyle.curved;
      return nextStyle;
    },
    {
      success: (modified) => `已将 ${modified} 条连线切换为正交路由`,
      empty: '没有连线需要调整',
    }
  );
}

export function curvedRouting(xml) {
  return transformEdgeStyles(
    xml,
    (cell, styleObj) => {
      void cell;
      const nextStyle = { ...styleObj };
      nextStyle.curved = '1';
      nextStyle.rounded = '0';
      delete nextStyle.edgeStyle;
      delete nextStyle.orthogonalLoop;
      delete nextStyle.jettySize;
      return nextStyle;
    },
    {
      success: (modified) => `已将 ${modified} 条连线切换为曲线`,
      empty: '没有连线需要调整',
    }
  );
}

export function jumpCrossings(xml) {
  return transformEdgeStyles(
    xml,
    (cell, styleObj) => {
      void cell;
      return { ...styleObj, jumpStyle: 'arc', jumpSize: '8' };
    },
    {
      success: (modified) => `已为 ${modified} 条连线添加交叉跳跃`,
      empty: '没有连线需要调整',
    }
  );
}

export function consistentSpacing(xml) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    if (doc.querySelector('parsererror')) return { xml, error: 'XML parse error', stats: { modified: 0, message: '解析失败' } };

    const cells = doc.querySelectorAll('mxCell');
    const vertices = [];

    // Collect all vertex elements with geometry
    cells.forEach(cell => {
      const isVertex = cell.getAttribute('vertex') === '1';
      const hasSource = cell.hasAttribute('source');
      const hasTarget = cell.hasAttribute('target');
      if (!isVertex && (hasSource || hasTarget)) return; // Skip edges

      const geo = cell.querySelector('mxGeometry');
      if (!geo || geo.getAttribute('relative') === '1') return;

      const x = parseFloat(geo.getAttribute('x') || '0');
      const y = parseFloat(geo.getAttribute('y') || '0');
      const w = parseFloat(geo.getAttribute('width') || '0');
      const h = parseFloat(geo.getAttribute('height') || '0');

      vertices.push({ cell, geo, x, y, w, h, centerY: y + h / 2 });
    });

    if (vertices.length < 2) {
      return { xml, error: null, stats: { modified: 0, message: '元素不足，无需调整' } };
    }

    // Group by Y coordinate (tolerance = 20px)
    const tolerance = 20;
    const layers = [];
    const assigned = new Set();

    vertices.forEach((v, i) => {
      if (assigned.has(i)) return;
      const layer = [v];
      assigned.add(i);

      vertices.forEach((other, j) => {
        if (i === j || assigned.has(j)) return;
        if (Math.abs(v.centerY - other.centerY) <= tolerance) {
          layer.push(other);
          assigned.add(j);
        }
      });

      if (layer.length > 1) {
        layers.push(layer);
      }
    });

    let modified = 0;

    // For each layer, unify horizontal spacing
    layers.forEach(layer => {
      layer.sort((a, b) => a.x - b.x);

      if (layer.length < 2) return;

      // Calculate total span and average gap
      const first = layer[0];
      const last = layer[layer.length - 1];
      const totalSpan = (last.x + last.w) - first.x;
      const totalWidth = layer.reduce((sum, v) => sum + v.w, 0);
      const totalGap = totalSpan - totalWidth;
      const avgGap = totalGap / (layer.length - 1);

      // Reposition elements with consistent spacing
      let currentX = first.x;
      layer.forEach((v, i) => {
        if (i === 0) {
          currentX = v.x + v.w + avgGap;
          return;
        }

        const newX = Math.round(currentX);
        if (Math.abs(newX - v.x) > 1) {
          v.geo.setAttribute('x', String(newX));
          modified++;
        }
        currentX = newX + v.w + avgGap;
      });
    });

    const serializer = new XMLSerializer();
    const message = modified > 0 ? `已调整 ${modified} 个元素的间距` : '间距已一致';
    return { xml: serializer.serializeToString(doc), error: null, stats: { modified, message } };
  } catch (err) {
    return { xml, error: err.message, stats: { modified: 0, message: err.message } };
  }
}

export function roundedEdges(xml) {
  return transformEdgeStyles(
    xml,
    (cell, styleObj) => {
      void cell;
      return { ...styleObj, rounded: '1' };
    },
    {
      success: (modified) => `已将 ${modified} 条连线设为圆角`,
      empty: '没有连线需要调整',
    }
  );
}

export function normalizeArrows(xml) {
  return transformEdgeStyles(
    xml,
    (cell, styleObj) => {
      void cell;
      return { ...styleObj, endArrow: 'block', endFill: '1', startArrow: 'none' };
    },
    {
      success: (modified) => `已统一 ${modified} 条连线箭头`,
      empty: '没有连线需要调整',
    }
  );
}

export function removeWaypoints(xml) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    if (doc.querySelector('parsererror')) return { xml, error: 'XML parse error', stats: { modified: 0, message: '解析失败' } };

    let modified = 0;
    const cells = doc.querySelectorAll('mxCell');

    cells.forEach(cell => {
      const style = cell.getAttribute('style') || '';
      const styleObj = parseStyle(style);
      if (!isEdgeCell(cell, styleObj)) return;

      const geo = cell.querySelector('mxGeometry');
      if (!geo) return;

      const pointsArray = geo.querySelector('Array[as="points"]');
      if (!pointsArray) return;

      geo.removeChild(pointsArray);
      modified++;
    });

    const serializer = new XMLSerializer();
    const message = modified > 0 ? `已清除 ${modified} 条连线的手动拐点` : '没有连线有手动拐点';
    return { xml: serializer.serializeToString(doc), error: null, stats: { modified, message } };
  } catch (err) {
    return { xml, error: err.message, stats: { modified: 0, message: err.message } };
  }
}

export function applyTrick(xml, trickId) {
  const trick = tricks[trickId];
  if (!trick) return { xml, error: `Unknown trick: ${trickId}` };
  return trick.apply(xml);
}
