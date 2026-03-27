import { getColorMapping, getTheme } from './themes/index.js';

export function parseStyle(styleString) {
  if (!styleString) return {};

  const result = {};
  const regex = /\s*(\w+)\s*=\s*([^;]*?)\s*(?:;|$)/g;
  let match;

  while ((match = regex.exec(styleString)) !== null) {
    const [, key, value] = match;
    if (key) result[key] = value;
  }

  return result;
}

export function stringifyStyle(styleObj) {
  return Object.entries(styleObj)
    .filter(([, value]) => value !== null && value !== undefined)
    .map(([key, value]) => `${key}=${value}`)
    .join(';') + ';';
}

export function isEdgeCell(cell, styleObj = {}) {
  return cell.hasAttribute('edge') ||
    cell.hasAttribute('source') ||
    cell.hasAttribute('target') ||
    Boolean(styleObj.edgeStyle);
}

export function isVertexCell(cell) {
  return cell.getAttribute('vertex') === '1';
}

export function hasCellValue(cell) {
  return cell.hasAttribute('value') && cell.getAttribute('value') !== '';
}

function matchesTarget(cell, styleObj, appliesTo = 'all') {
  if (appliesTo === 'edges') return isEdgeCell(cell, styleObj);
  if (appliesTo === 'vertices') return isVertexCell(cell);
  return true;
}

export function matchesStyleSelector(cell, styleObj, selector = {}) {
  const { appliesTo = 'all', shape, hasValue: valueRequired, isEdge, predicate } = selector;

  if (!matchesTarget(cell, styleObj, appliesTo)) {
    return false;
  }

  if (shape && !styleObj[shape]) {
    return false;
  }

  if (valueRequired !== undefined && hasCellValue(cell) !== valueRequired) {
    return false;
  }

  if (isEdge !== undefined && isEdgeCell(cell, styleObj) !== isEdge) {
    return false;
  }

  if (predicate && !predicate(cell, styleObj)) {
    return false;
  }

  return true;
}

export function applyStyleChanges(styleObj, changes = {}, cell = null) {
  const nextStyle = { ...styleObj };

  for (const [key, value] of Object.entries(changes)) {
    if (value === null) {
      delete nextStyle[key];
      continue;
    }

    if (typeof value === 'function') {
      const computed = value(styleObj, cell);
      if (computed === null || computed === undefined) {
        delete nextStyle[key];
      } else {
        nextStyle[key] = computed;
      }
      continue;
    }

    nextStyle[key] = value;
  }

  return nextStyle;
}

export function collectRuleChangeKeys(rules = []) {
  const keys = new Set();

  rules.forEach((rule) => {
    const changeSet = typeof rule.changes === 'function' ? null : rule.changes;
    Object.keys(changeSet || {}).forEach((key) => keys.add(key));
  });

  return Array.from(keys);
}

function collectResetKeys(registry = {}) {
  const keys = new Set();

  Object.values(registry).forEach((item) => {
    if (!item) return;

    Object.keys(item.styleChanges || {}).forEach((key) => keys.add(key));
    Object.keys(item.disableChanges || {}).forEach((key) => keys.add(key));
    (item.resetKeys || []).forEach((key) => keys.add(key));
  });

  return Array.from(keys);
}

export function transformStyleXml(xml, transformer, messages = null) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    const parseError = doc.querySelector('parsererror');

    if (parseError) {
      return {
        xml,
        error: 'XML parse error',
        stats: { modified: 0, message: messages?.empty || '解析失败' },
      };
    }

    let modified = 0;
    const cells = doc.querySelectorAll('mxCell');

    cells.forEach((cell) => {
      const styleString = cell.getAttribute('style') || '';
      const styleObj = parseStyle(styleString);
      const nextStyleObj = transformer(cell, styleObj);

      if (!nextStyleObj) return;

      const currentStyle = stringifyStyle(styleObj);
      const nextStyle = stringifyStyle(nextStyleObj);

      if (currentStyle !== nextStyle) {
        cell.setAttribute('style', nextStyle);
        modified++;
      }
    });

    const serializer = new XMLSerializer();
    return {
      xml: serializer.serializeToString(doc),
      error: null,
      stats: {
        modified,
        message: modified > 0
          ? (typeof messages?.success === 'function' ? messages.success(modified) : messages?.success)
          : messages?.empty,
      },
    };
  } catch (err) {
    return {
      xml,
      error: err.message,
      stats: { modified: 0, message: err.message },
    };
  }
}

export function applyStyleRules(xml, rules, messages = null) {
  return transformStyleXml(
    xml,
    (cell, styleObj) => {
      let nextStyle = styleObj;
      let matched = false;

      for (const rule of rules) {
        if (!matchesStyleSelector(cell, nextStyle, rule.selector)) {
          continue;
        }

        const changes = typeof rule.changes === 'function'
          ? rule.changes(cell, nextStyle)
          : rule.changes;

        nextStyle = applyStyleChanges(nextStyle, changes, cell);
        matched = true;
      }

      return matched ? nextStyle : styleObj;
    },
    messages
  );
}

export function applyStyleChange(xml, changes) {
  return applyStyleRules(xml, [{ selector: {}, changes }]).xml;
}

export function applyTheme(xml, sourceThemeId, targetThemeId) {
  const colorMap = getColorMapping(sourceThemeId, targetThemeId);
  const targetTheme = getTheme(targetThemeId);
  const defaults = targetTheme?.defaults || {};
  const isCurvedTheme = !defaults.edgeStyle;

  return transformStyleXml(xml, (cell, styleObj) => {
    const nextStyle = { ...styleObj };
    const edge = isEdgeCell(cell, styleObj);

    // Color mapping
    for (const key of ['fillColor', 'strokeColor', 'fontColor', 'gradientColor', 'labelBackgroundColor']) {
      if (!nextStyle[key]) continue;
      const upper = nextStyle[key].toUpperCase();
      if (colorMap[upper]) {
        nextStyle[key] = colorMap[upper];
      }
    }

    // Non-color properties for all cells
    if (defaults.fontFamily) nextStyle.fontFamily = defaults.fontFamily;
    if (defaults.fontSize) nextStyle.fontSize = String(defaults.fontSize);
    if (defaults.strokeWidth) nextStyle.strokeWidth = String(defaults.strokeWidth);

    // Edge-only properties
    if (edge) {
      if (isCurvedTheme) {
        nextStyle.curved = '1';
        delete nextStyle.edgeStyle;
        delete nextStyle.orthogonalLoop;
        delete nextStyle.jettySize;
      } else {
        nextStyle.edgeStyle = defaults.edgeStyle;
        delete nextStyle.curved;
        if (defaults.edgeRounded) {
          nextStyle.rounded = '1';
        } else {
          delete nextStyle.rounded;
        }
      }
    }

    return nextStyle;
  }).xml;
}

export function applyStyleToMatching(xml, selector, changes) {
  return applyStyleRules(xml, [{ selector, changes }]).xml;
}

export function applyPreset(xml, presetId, enabled, presets) {
  const preset = presets[presetId];
  if (!preset) return { xml, error: `Unknown preset: ${presetId}` };

  const changes = enabled ? preset.styleChanges : preset.disableChanges;

  return applyStyleRules(
    xml,
    [{ selector: { appliesTo: preset.appliesTo || 'all' }, changes }],
    {
      success: (modified) => `已更新 ${modified} 个元素`,
      empty: '没有元素需要更新',
    }
  );
}

export function resetStyles(xml, registry = {}) {
  const keysToRemove = collectResetKeys(registry);
  return applyStyleRules(xml, [{ selector: {}, changes: Object.fromEntries(keysToRemove.map((key) => [key, null])) }]).xml;
}
