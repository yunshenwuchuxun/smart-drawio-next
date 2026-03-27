import { researchTheme } from './research';
import { businessTheme } from './business';
import { warmTheme } from './warm';
import { coolTheme } from './cool';
import { darkTheme } from './dark';
import { contrastTheme } from './contrast';
import { pastelTheme } from './pastel';
import { forestTheme } from './forest';
import { violetTheme } from './violet';
import { neutralTheme } from './neutral';

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
