// Storage wrapper with memory fallback
// Handles localStorage failures gracefully (SSR, privacy mode, quota exceeded)

const memoryStorage = new Map();

function isLocalStorageAvailable() {
  if (typeof window === 'undefined') return false;
  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

const storageAvailable = isLocalStorageAvailable();

export const storage = {
  getItem(key) {
    if (storageAvailable) {
      try {
        return window.localStorage.getItem(key);
      } catch (e) {
        console.warn(`Failed to get "${key}" from localStorage:`, e);
      }
    }
    return memoryStorage.get(key) ?? null;
  },

  setItem(key, value) {
    if (storageAvailable) {
      try {
        window.localStorage.setItem(key, value);
        return true;
      } catch (e) {
        console.warn(`Failed to set "${key}" in localStorage:`, e);
      }
    }
    memoryStorage.set(key, value);
    return false;
  },

  removeItem(key) {
    if (storageAvailable) {
      try {
        window.localStorage.removeItem(key);
        return true;
      } catch (e) {
        console.warn(`Failed to remove "${key}" from localStorage:`, e);
      }
    }
    memoryStorage.delete(key);
    return false;
  },

  getJSON(key, defaultValue = null) {
    const value = this.getItem(key);
    if (value === null) return defaultValue;
    try {
      return JSON.parse(value);
    } catch (e) {
      console.warn(`Failed to parse JSON for "${key}":`, e);
      return defaultValue;
    }
  },

  setJSON(key, value) {
    try {
      return this.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`Failed to stringify JSON for "${key}":`, e);
      return false;
    }
  },

  isAvailable() {
    return storageAvailable;
  },
};

// Storage keys with new prefix
export const STORAGE_KEYS = {
  CONFIGS: 'smart-drawio-configs',
  ACTIVE_CONFIG: 'smart-drawio-active-config',
  HISTORY: 'smart-drawio-history',
  DIAGRAM_THEME: 'smart-drawio-diagram-theme',
  STYLE_PRESETS: 'smart-drawio-style-presets',
  THEME_MODE: 'smart-drawio-theme-mode',
  SIDEBAR_COLLAPSED: 'smart-drawio-sidebar-collapsed',
  ACTIVE_PANEL: 'smart-drawio-active-panel',
  USE_PASSWORD: 'smart-drawio-use-password',
  PASSWORD: 'smart-drawio-password',
  AUTOSAVE: 'smart-drawio-autosave',
};

// Legacy keys for migration
export const LEGACY_KEYS = {
  CONFIGS: 'smart-excalidraw-configs',
  ACTIVE_CONFIG: 'smart-excalidraw-active-config',
  HISTORY: 'smart-excalidraw-history',
  DIAGRAM_THEME: 'smart-excalidraw-theme',
  STYLE_PRESETS: 'smart-excalidraw-style-presets',
  USE_PASSWORD: 'smart-excalidraw-use-password',
  PASSWORD: 'smart-excalidraw-password',
};

// Key mapping for migration
export const KEY_MIGRATION_MAP = {
  [LEGACY_KEYS.CONFIGS]: STORAGE_KEYS.CONFIGS,
  [LEGACY_KEYS.ACTIVE_CONFIG]: STORAGE_KEYS.ACTIVE_CONFIG,
  [LEGACY_KEYS.HISTORY]: STORAGE_KEYS.HISTORY,
  [LEGACY_KEYS.DIAGRAM_THEME]: STORAGE_KEYS.DIAGRAM_THEME,
  [LEGACY_KEYS.STYLE_PRESETS]: STORAGE_KEYS.STYLE_PRESETS,
  [LEGACY_KEYS.USE_PASSWORD]: STORAGE_KEYS.USE_PASSWORD,
  [LEGACY_KEYS.PASSWORD]: STORAGE_KEYS.PASSWORD,
};

// Migrate keys from old prefix to new prefix
export function migrateKeys() {
  if (!storageAvailable) return { migrated: 0, skipped: 0 };

  let migrated = 0;
  let skipped = 0;

  for (const [oldKey, newKey] of Object.entries(KEY_MIGRATION_MAP)) {
    try {
      const oldValue = window.localStorage.getItem(oldKey);
      if (oldValue !== null) {
        const newValue = window.localStorage.getItem(newKey);
        if (newValue === null) {
          window.localStorage.setItem(newKey, oldValue);
          migrated++;
        } else {
          skipped++;
        }
        window.localStorage.removeItem(oldKey);
      }
    } catch (e) {
      console.warn(`Failed to migrate key "${oldKey}":`, e);
    }
  }

  if (migrated > 0) {
    console.info(`Storage migration: ${migrated} keys migrated, ${skipped} skipped`);
  }

  return { migrated, skipped };
}

// Run migration on first load
let migrationRun = false;
export function ensureMigration() {
  if (migrationRun) return;
  migrationRun = true;
  migrateKeys();
}
