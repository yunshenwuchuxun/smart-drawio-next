import { configManager } from './config-manager.js';

const LEGACY_CONFIG_KEYS = [
  'smart-excalidraw-config',
  'smart-drawio-config',
];

function isBrowser() {
  return typeof window !== 'undefined';
}

function getLegacyConfigEntry() {
  for (const key of LEGACY_CONFIG_KEYS) {
    const value = localStorage.getItem(key);
    if (value) {
      return { key, value };
    }
  }
  return null;
}

function migrateLegacyConfig() {
  if (!isBrowser()) {
    return;
  }

  try {
    const legacyEntry = getLegacyConfigEntry();
    if (!legacyEntry || configManager.getAllConfigs().length > 0) {
      return;
    }

    const legacyConfig = JSON.parse(legacyEntry.value);
    configManager.createConfig({
      name: legacyConfig.name || '迁移的配置',
      type: legacyConfig.type,
      baseUrl: legacyConfig.baseUrl,
      apiKey: legacyConfig.apiKey,
      model: legacyConfig.model,
      description: '从旧版单配置自动迁移',
    });

    for (const key of LEGACY_CONFIG_KEYS) {
      localStorage.removeItem(key);
    }
  } catch (error) {
    console.error('Failed to migrate legacy config:', error);
  }
}

export function getConfig() {
  if (!isBrowser()) {
    return null;
  }

  migrateLegacyConfig();

  const activeConfig = configManager.getActiveConfig();
  if (!activeConfig) {
    return null;
  }

  const decryptedApiKey = configManager.getDecryptedApiKey(activeConfig);
  const runtimeApiKey = decryptedApiKey ?? (typeof activeConfig.apiKey === 'string' ? activeConfig.apiKey : '');

  return {
    name: activeConfig.name,
    type: activeConfig.type,
    baseUrl: activeConfig.baseUrl,
    apiKey: runtimeApiKey,
    model: activeConfig.model,
  };
}

export function saveConfig(config) {
  if (!isBrowser()) {
    return;
  }

  migrateLegacyConfig();

  try {
    const activeConfig = configManager.getActiveConfig();
    if (activeConfig) {
      configManager.updateConfig(activeConfig.id, config);
      return;
    }

    const newConfig = configManager.createConfig(config);
    configManager.setActiveConfig(newConfig.id);
  } catch (error) {
    console.error('Failed to save config:', error);
    throw error;
  }
}

export function isConfigValid(config) {
  if (!config) {
    return false;
  }

  return ['type', 'baseUrl', 'apiKey', 'model'].every((field) => {
    const value = config[field];
    return typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
  });
}

export { configManager };
