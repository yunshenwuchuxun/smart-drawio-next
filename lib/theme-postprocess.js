import { applyTrick } from './drawing-tricks';

export const THEME_POSTPROCESSING_TRICKS = {
  research: ['orthogonalRouting'],
  business: [],
  warm: [],
  cool: ['orthogonalRouting'],
  dark: [],
  contrast: ['orthogonalRouting', 'jumpCrossings'],
  pastel: [],
  forest: [],
  violet: [],
  neutral: [],
};

export function applyThemePostProcessing(xml, themeId) {
  const trickIds = THEME_POSTPROCESSING_TRICKS[themeId] || [];
  if (!xml || trickIds.length === 0) {
    return { xml, applied: [] };
  }

  let nextXml = xml;
  const applied = [];

  trickIds.forEach((trickId) => {
    const result = applyTrick(nextXml, trickId);

    if (result?.error || !result?.xml) {
      applied.push({
        trickId,
        error: result?.error || 'Unknown error',
        modified: 0,
      });
      return;
    }

    nextXml = result.xml;
    applied.push({
      trickId,
      error: null,
      modified: result.stats?.modified ?? 0,
      message: result.stats?.message || '',
    });
  });

  return { xml: nextXml, applied };
}
