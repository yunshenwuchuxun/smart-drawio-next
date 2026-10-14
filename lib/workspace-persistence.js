import { CHART_TYPES } from './constants';
import { themes, DEFAULT_THEME_ID } from './themes';
import { stylePresets } from './style-presets';

export const WORKSPACE_VERSION = 1;

// Whitelist persisted fields: provider configuration, credentials and image data
// do not belong in a workspace snapshot.
export function createWorkspaceSnapshot(workspace, savedAt = Date.now()) {
  const chartType = (value) => Object.hasOwn(CHART_TYPES, value) ? value : 'auto';
  const text = (value) => typeof value === 'string' ? value : '';
  const currentInput = typeof workspace.currentInput === 'string'
    ? workspace.currentInput
    : text(workspace.currentInput?.text);
  const presets = {};
  for (const [key, value] of Object.entries(workspace.presets || {})) {
    if (typeof value === 'boolean' && Object.hasOwn(stylePresets, key)) presets[key] = value;
  }

  return {
    version: WORKSPACE_VERSION,
    savedAt,
    generatedXml: text(workspace.generatedXml),
    generatedCode: text(workspace.generatedCode),
    currentInput,
    currentChartType: chartType(workspace.currentChartType),
    inputDraft: text(workspace.inputDraft ?? currentInput),
    inputChartType: chartType(workspace.inputChartType ?? workspace.currentChartType),
    theme: Object.hasOwn(themes, workspace.theme) ? workspace.theme : DEFAULT_THEME_ID,
    presets,
  };
}

export function parseWorkspaceSnapshot(value) {
  if (!value) return null;
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (!parsed || parsed.version !== WORKSPACE_VERSION
      || typeof parsed.generatedXml !== 'string'
      || typeof parsed.generatedCode !== 'string'
      || !Number.isFinite(parsed.savedAt)) return null;
    return createWorkspaceSnapshot(parsed, parsed.savedAt);
  } catch {
    return null;
  }
}
