import { CHART_TYPES } from './constants.js';
import { applyTrick, tricks } from './drawing-tricks.js';
import { applyStylePack, stylePacks } from './style-packs.js';
import { stylePresets } from './style-presets.js';
import { applyPreset, applyTheme } from './theme-engine.js';
import { applyThemePostProcessing } from './theme-postprocess.js';
import { applyTextStyleTool, textStyleTools } from './text-style-tools.js';
import { themes } from './themes/index.js';
import { tryRepairXml, validateRepairedXml } from './xml-repair.js';

const OPTION_NAMES = new Set(['theme', 'sourceTheme', 'stylePack', 'presets', 'textTool', 'trick']);
const error = (code, message, extra = {}) => ({ ok: false, diagnostics: [{ code, message, severity: 'error', ...extra }] });
const diagnosticsFor = (diagnostics) => diagnostics.map((entry) => ({ ...entry, severity: entry.severity || 'error' }));

/** Validate uncompressed draw.io XML syntax, pages, cell ids and references. */
export function validateDiagram(xml) {
  const result = validateRepairedXml(xml);
  if (!result.isValid) return { ok: false, diagnostics: diagnosticsFor(result.diagnostics) };
  return { ok: true, xml, diagnostics: [], stats: { pageCount: result.pageCount, cellCount: result.cellCount } };
}

/** Explicit repair may discard an incomplete tail; its warning is never hidden. */
export function repairDiagram(xml) {
  if (typeof xml !== 'string' || !xml.trim()) return error('EMPTY_XML', 'XML must be a nonempty string.');
  try {
    const result = tryRepairXml(xml);
    if (!result.valid) return { ok: false, diagnostics: diagnosticsFor(result.diagnostics?.length ? result.diagnostics : [{ code: 'REPAIR_FAILED', message: result.error || 'XML could not be repaired.' }]) };
    const checked = validateDiagram(result.xml);
    if (!checked.ok) return checked;
    const diagnostics = [];
    if (result.repaired) diagnostics.push({ code: 'XML_REPAIRED', message: `Added missing closing tags: ${result.addedTags.join(', ')}.`, severity: 'info' });
    if (result.elementsTruncated) diagnostics.push({ code: 'XML_TAIL_DISCARDED', message: `Repair discarded ${result.removedLength} characters from an incomplete XML tail. Review the repaired diagram for missing content.`, severity: 'warning' });
    return { ...checked, diagnostics, stats: { ...checked.stats, repaired: Boolean(result.repaired), discardedCharacters: result.removedLength || 0 } };
  } catch (cause) {
    return error('REPAIR_FAILED', cause.message);
  }
}

/** Apply options in order: theme, style pack, presets, text tool, then trick. */
export function styleDiagram(xml, options = {}) {
  const original = validateDiagram(xml);
  if (!original.ok) return original;
  if (!options || typeof options !== 'object' || Array.isArray(options)) return error('INVALID_OPTIONS', 'Style options must be an object.');
  for (const name of Object.keys(options)) {
    if (!OPTION_NAMES.has(name)) return error('UNKNOWN_OPTION', `Unknown style option: ${name}.`, { option: name });
  }
  for (const [name, catalog] of [['theme', themes], ['sourceTheme', themes], ['stylePack', stylePacks], ['textTool', textStyleTools], ['trick', tricks]]) {
    if (options[name] !== undefined && (typeof options[name] !== 'string' || !Object.hasOwn(catalog, options[name]))) {
      return error('UNKNOWN_OPTION_VALUE', `Unknown ${name}: ${String(options[name])}.`, { option: name });
    }
  }
  if (options.presets !== undefined) {
    if (!options.presets || typeof options.presets !== 'object' || Array.isArray(options.presets)) return error('INVALID_PRESETS', 'Presets must be a mapping of preset ids to booleans.');
    for (const [id, enabled] of Object.entries(options.presets)) {
      if (!Object.hasOwn(stylePresets, id)) return error('UNKNOWN_PRESET', `Unknown preset: ${id}.`, { option: id });
      if (typeof enabled !== 'boolean') return error('INVALID_PRESET_VALUE', `Preset ${id} must be true or false.`, { option: id });
    }
  }

  let currentXml = xml;
  const applied = [];
  const run = (operation, id, transform) => {
    const result = transform(currentXml);
    if (result?.error) throw new Error(`${operation} ${id}: ${result.error}`);
    const nextXml = typeof result === 'string' ? result : result?.xml;
    const checked = validateDiagram(nextXml);
    if (!checked.ok) {
      const cause = new Error(`The ${operation} transform produced invalid XML.`);
      cause.diagnostics = checked.diagnostics;
      throw cause;
    }
    applied.push({ operation, id, changed: nextXml !== currentXml, modified: result?.stats?.modified ?? null });
    currentXml = nextXml;
  };
  try {
    if (options.theme !== undefined) {
      run('theme', options.theme, (value) => applyTheme(value, options.sourceTheme || 'research', options.theme));
      run('themePostProcessing', options.theme, (value) => {
        const result = applyThemePostProcessing(value, options.theme);
        const failed = result.applied.find((entry) => entry.error);
        if (failed) return { xml: value, error: failed.error };
        return { xml: result.xml, stats: { modified: result.applied.reduce((sum, entry) => sum + entry.modified, 0) } };
      });
    }
    if (options.stylePack !== undefined) run('stylePack', options.stylePack, (value) => applyStylePack(value, options.stylePack));
    for (const [id, enabled] of Object.entries(options.presets || {})) run('preset', id, (value) => applyPreset(value, id, enabled, stylePresets));
    if (options.textTool !== undefined) run('textTool', options.textTool, (value) => applyTextStyleTool(value, options.textTool));
    if (options.trick !== undefined) run('trick', options.trick, (value) => applyTrick(value, options.trick));
    const checked = validateDiagram(currentXml);
    return { ...checked, stats: { ...checked.stats, changed: currentXml !== xml, applied } };
  } catch (cause) {
    return { ok: false, diagnostics: cause.diagnostics || [{ code: 'TRANSFORM_FAILED', message: cause.message, severity: 'error' }] };
  }
}

function catalogEntries(catalog) {
  return Object.entries(catalog).map(([id, entry]) => ({ id, name: typeof entry === 'string' ? entry : entry.name || entry.label || id, description: entry.description || '' }));
}

/** JSON-safe catalogs: do not expose internal transformer functions. */
export function listDiagramOptions() {
  return { ok: true, options: {
    chartTypes: catalogEntries(CHART_TYPES),
    themes: catalogEntries(themes),
    stylePacks: catalogEntries(stylePacks),
    presets: catalogEntries(stylePresets),
    textTools: catalogEntries(textStyleTools),
    tricks: catalogEntries(tricks),
  }, diagnostics: [] };
}
