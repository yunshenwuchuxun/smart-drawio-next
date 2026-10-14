import { researchTheme } from './research.js';
import { businessTheme } from './business.js';
import { warmTheme } from './warm.js';
import { coolTheme } from './cool.js';
import { darkTheme } from './dark.js';
import { contrastTheme } from './contrast.js';
import { pastelTheme } from './pastel.js';
import { forestTheme } from './forest.js';
import { violetTheme } from './violet.js';
import { neutralTheme } from './neutral.js';

export const themes = {
  research: researchTheme,
  business: businessTheme,
  warm: warmTheme,
  cool: coolTheme,
  dark: darkTheme,
  contrast: contrastTheme,
  pastel: pastelTheme,
  forest: forestTheme,
  violet: violetTheme,
  neutral: neutralTheme,
};

export const DEFAULT_THEME_ID = 'research';

export function getTheme(id) {
  return themes[id] || themes[DEFAULT_THEME_ID];
}

export function getAllThemes() {
  return Object.values(themes);
}

export function getColorMapping(sourceThemeId, targetThemeId) {
  const sourceTheme = getTheme(sourceThemeId);
  const targetTheme = getTheme(targetThemeId);
  const mapping = {};
  for (const [token, sourceColor] of Object.entries(sourceTheme.colorPalette)) {
    const targetColor = targetTheme.colorPalette[token];
    if (targetColor && sourceColor !== targetColor) {
      mapping[sourceColor.toUpperCase()] = targetColor.toUpperCase();
    }
  }
  return mapping;
}

export {
  researchTheme,
  businessTheme,
  warmTheme,
  coolTheme,
  darkTheme,
  contrastTheme,
  pastelTheme,
  forestTheme,
  violetTheme,
  neutralTheme,
};
