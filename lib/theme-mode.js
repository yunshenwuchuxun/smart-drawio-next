// Theme Mode Management
// Handles light/dark/system theme switching with localStorage persistence

const STORAGE_KEY = 'smart-drawio-theme-mode';

// Valid modes
export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

// Get system preference
function getSystemPreference() {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Get stored mode
export function getStoredMode() {
  if (typeof window === 'undefined') return THEME_MODES.SYSTEM;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && Object.values(THEME_MODES).includes(stored)) {
      return stored;
    }
  } catch (e) {
    console.warn('Failed to read theme mode from localStorage');
  }
  return THEME_MODES.SYSTEM;
}

// Get effective theme (what's actually displayed)
export function getEffectiveTheme(mode) {
  if (mode === THEME_MODES.SYSTEM) {
    return getSystemPreference();
  }
  return mode;
}

// Apply theme to document
export function applyTheme(mode) {
  if (typeof document === 'undefined') return;

  const effectiveTheme = getEffectiveTheme(mode);

  if (effectiveTheme === 'dark') {
    document.documentElement.dataset.theme = 'dark';
  } else {
    delete document.documentElement.dataset.theme;
  }

  return effectiveTheme;
}

// Save mode to localStorage
export function saveMode(mode) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch (e) {
    console.warn('Failed to save theme mode to localStorage');
  }
}

// Cycle through modes: light → dark → system → light
export function cycleMode(currentMode) {
  switch (currentMode) {
    case THEME_MODES.LIGHT:
      return THEME_MODES.DARK;
    case THEME_MODES.DARK:
      return THEME_MODES.SYSTEM;
    case THEME_MODES.SYSTEM:
    default:
      return THEME_MODES.LIGHT;
  }
}

// Initialize theme with system preference listener
export function initThemeMode(onThemeChange) {
  if (typeof window === 'undefined') return () => {};

  const mode = getStoredMode();
  applyTheme(mode);

  // Listen for system preference changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handleSystemChange = () => {
    const currentMode = getStoredMode();
    if (currentMode === THEME_MODES.SYSTEM) {
      const effectiveTheme = applyTheme(THEME_MODES.SYSTEM);
      onThemeChange?.(THEME_MODES.SYSTEM, effectiveTheme);
    }
  };

  mediaQuery.addEventListener('change', handleSystemChange);

  // Return cleanup function
  return () => {
    mediaQuery.removeEventListener('change', handleSystemChange);
  };
}

// Hook-friendly theme manager
export function createThemeManager(onThemeChange) {
  let currentMode = getStoredMode();

  return {
    getMode: () => currentMode,
    getEffectiveTheme: () => getEffectiveTheme(currentMode),

    setMode: (mode) => {
      currentMode = mode;
      saveMode(mode);
      const effectiveTheme = applyTheme(mode);
      onThemeChange?.(mode, effectiveTheme);
      return effectiveTheme;
    },

    cycle: () => {
      const nextMode = cycleMode(currentMode);
      currentMode = nextMode;
      saveMode(nextMode);
      const effectiveTheme = applyTheme(nextMode);
      onThemeChange?.(nextMode, effectiveTheme);
      return { mode: nextMode, effectiveTheme };
    },
  };
}
