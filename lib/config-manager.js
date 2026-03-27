import { validateConfig, validateConnectionConfig } from '@/lib/schemas';
import {
  encryptApiKey,
  decryptApiKey,
  isEncrypted,
  getCachedKey,
  cacheKey,
  clearCachedKey,
  deriveKey,
  createKeyMaterial,
} from '@/lib/crypto';
import { ensureMigration, STORAGE_KEYS, storage } from '@/lib/storage';

const MASTER_KEY_TEST = 'smart-drawio-master-key-test';
const DEFAULT_CONFIG = {
  name: '新配置',
  type: 'openai',
  baseUrl: '',
  apiKey: '',
  model: '',
  description: '',
  isActive: false,
};
const LOCKED_API_KEY_ERROR = '当前配置的 API 密钥已加密，请先解锁主密码或重新输入密钥后再继续。';

function isBrowser() {
  return typeof window !== 'undefined';
}

function createId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

class ConfigManager {
  constructor() {
    this.STORAGE_KEY = STORAGE_KEYS.CONFIGS;
    this.ACTIVE_CONFIG_KEY = STORAGE_KEYS.ACTIVE_CONFIG;
    this.configs = [];
    this.activeConfigId = null;
    this.isLoaded = false;
  }

  ensureLoaded() {
    if (!this.isLoaded) {
      this.loadConfigs();
    }
  }

  cloneRecord(config) {
    return config ? { ...config } : null;
  }

  findConfig(id) {
    return this.configs.find((config) => config.id === id) ?? null;
  }

  buildCreateConfigRecord(configData = {}) {
    return {
      ...DEFAULT_CONFIG,
      ...configData,
    };
  }

  loadConfigs() {
    if (!isBrowser()) {
      return;
    }

    ensureMigration();

    try {
      const storedConfigs = storage.getJSON(this.STORAGE_KEY, []);
      this.configs = Array.isArray(storedConfigs) ? storedConfigs : [];
      this.activeConfigId = storage.getItem(this.ACTIVE_CONFIG_KEY);
      this.isLoaded = true;

      if (!this.activeConfigId && this.configs.length > 0) {
        this.activeConfigId = this.configs[0].id;
        this.saveActiveConfigId();
      }
    } catch (error) {
      console.error('Failed to load configs:', error);
      this.configs = [];
      this.activeConfigId = null;
      this.isLoaded = true;
    }
  }

  saveConfigs() {
    if (!isBrowser()) {
      return;
    }
    storage.setJSON(this.STORAGE_KEY, this.configs);
  }

  saveActiveConfigId() {
    if (!isBrowser()) {
      return;
    }

    if (this.activeConfigId) {
      storage.setItem(this.ACTIVE_CONFIG_KEY, this.activeConfigId);
      return;
    }

    storage.removeItem(this.ACTIVE_CONFIG_KEY);
  }

  getActiveConfigId() {
    this.ensureLoaded();
    return this.activeConfigId;
  }

  createConfig(configData) {
    this.ensureLoaded();

    const timestamp = new Date().toISOString();
    const newConfig = {
      id: createId(),
      ...this.buildCreateConfigRecord(configData),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.configs.push(newConfig);

    if (!this.activeConfigId) {
      this.activeConfigId = newConfig.id;
      this.saveActiveConfigId();
    }

    this.saveConfigs();
    return this.cloneRecord(newConfig);
  }

  updateConfig(id, updateData) {
    this.ensureLoaded();

    const existingConfig = this.findConfig(id);
    if (!existingConfig) {
      throw new Error('配置不存在');
    }

    const updatedConfig = {
      ...existingConfig,
      ...updateData,
      id,
      createdAt: existingConfig.createdAt,
      updatedAt: new Date().toISOString(),
    };

    this.configs = this.configs.map((config) => (config.id === id ? updatedConfig : config));
    this.saveConfigs();
    return this.cloneRecord(updatedConfig);
  }

  deleteConfig(id) {
    this.ensureLoaded();

    if (!this.findConfig(id)) {
      throw new Error('配置不存在');
    }

    this.configs = this.configs.filter((config) => config.id !== id);

    if (this.activeConfigId === id) {
      this.activeConfigId = this.configs[0]?.id ?? null;
      this.saveActiveConfigId();
    }

    this.saveConfigs();
  }

  getAllConfigs() {
    this.ensureLoaded();
    return this.configs.map((config) => this.cloneRecord(config));
  }

  getConfig(id) {
    this.ensureLoaded();
    return this.cloneRecord(this.findConfig(id));
  }

  getActiveConfig() {
    this.ensureLoaded();
    if (!this.activeConfigId) {
      return null;
    }
    return this.getConfig(this.activeConfigId);
  }

  setActiveConfig(id) {
    this.ensureLoaded();

    const config = this.findConfig(id);
    if (!config) {
      throw new Error('配置不存在');
    }

    this.activeConfigId = id;
    this.saveActiveConfigId();
    return this.cloneRecord(config);
  }

  cloneConfig(id, newName) {
    this.ensureLoaded();

    const originalConfig = this.findConfig(id);
    if (!originalConfig) {
      throw new Error('原配置不存在');
    }

    const { id: _ignoredId, createdAt: _ignoredCreatedAt, updatedAt: _ignoredUpdatedAt, ...clonedConfig } = originalConfig;
    return this.createConfig({
      ...clonedConfig,
      name: newName || `${originalConfig.name} (副本)`,
      isActive: false,
    });
  }

  validateConfig(config) {
    const result = validateConfig(config);
    if (result.success) {
      return { isValid: true, errors: [] };
    }
    return { isValid: false, errors: result.errors };
  }

  validateConnectionConfig(config) {
    const result = validateConnectionConfig(config);
    if (result.success) {
      return { isValid: true, errors: [] };
    }
    return { isValid: false, errors: result.errors };
  }

  getDecryptedApiKey(config) {
    if (!config) {
      return null;
    }
    if (!isEncrypted(config.apiKey)) {
      return config.apiKey;
    }
    const key = getCachedKey();
    if (!key) {
      return null;
    }
    return decryptApiKey(config.apiKey, key);
  }

  isApiKeyLocked(config) {
    return Boolean(config && isEncrypted(config.apiKey) && !this.getDecryptedApiKey(config));
  }

  toEditableConfig(config) {
    if (!config) {
      return null;
    }

    const decryptedApiKey = this.getDecryptedApiKey(config);
    return {
      ...config,
      apiKey: decryptedApiKey ?? (isEncrypted(config.apiKey) ? '' : config.apiKey),
    };
  }

  resolveConnectionConfig(config) {
    const apiKey = this.getDecryptedApiKey(config);
    if (isEncrypted(config?.apiKey) && !apiKey) {
      throw new Error(LOCKED_API_KEY_ERROR);
    }

    const runtimeConfig = {
      ...config,
      apiKey,
    };
    const validation = this.validateConnectionConfig(runtimeConfig);
    if (!validation.isValid) {
      throw new Error(validation.errors.join('，'));
    }

    return runtimeConfig;
  }

  async fetchModels(config) {
    if (!isBrowser()) {
      throw new Error('只能在浏览器环境中加载模型。');
    }

    const runtimeConfig = this.resolveConnectionConfig(config);
    const params = new URLSearchParams({
      type: runtimeConfig.type,
      baseUrl: runtimeConfig.baseUrl,
      apiKey: runtimeConfig.apiKey,
    });

    const response = await fetch(`/api/models?${params.toString()}`);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || '加载模型失败');
    }

    return Array.isArray(payload.models) ? payload.models : [];
  }

  async testConnection(config) {
    if (!isBrowser()) {
      throw new Error('只能在浏览器环境中测试连接。');
    }

    const runtimeConfig = this.resolveConnectionConfig(config);
    const response = await fetch('/api/configs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ config: runtimeConfig }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.message || payload.error || '连接测试失败');
    }

    return payload;
  }

  importConfigs(configsData) {
    this.ensureLoaded();

    try {
      const importedConfigs = JSON.parse(configsData);
      if (!Array.isArray(importedConfigs)) {
        throw new Error('导入数据格式错误');
      }

      let importCount = 0;
      for (const configData of importedConfigs) {
        const validation = this.validateConfig(configData);
        if (!validation.isValid) {
          continue;
        }

        this.createConfig({
          ...configData,
          isActive: false,
        });
        importCount += 1;
      }

      return { success: true, count: importCount };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  exportConfigs() {
    this.ensureLoaded();
    return JSON.stringify(this.configs, null, 2);
  }

  searchConfigs(query) {
    this.ensureLoaded();

    const normalizedQuery = (query || '').trim().toLowerCase();
    if (!normalizedQuery) {
      return this.getAllConfigs();
    }

    return this.configs
      .filter((config) => {
        const haystack = [config.name, config.description, config.type]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(normalizedQuery);
      })
      .map((config) => this.cloneRecord(config));
  }

  getStats() {
    this.ensureLoaded();

    return this.configs.reduce(
      (stats, config) => {
        if (config.id === this.activeConfigId) {
          stats.active = 1;
        }
        stats.byType[config.type] = (stats.byType[config.type] || 0) + 1;
        stats.total += 1;
        return stats;
      },
      { total: 0, active: 0, byType: {} }
    );
  }

  isEncryptionEnabled() {
    if (!isBrowser()) {
      return false;
    }
    return Boolean(localStorage.getItem(MASTER_KEY_TEST));
  }

  async setupMasterPassword(password) {
    if (!isBrowser()) {
      return;
    }

    const { key, kdf } = await createKeyMaterial(password);
    const testData = encryptApiKey('test-value', key, kdf);
    localStorage.setItem(MASTER_KEY_TEST, JSON.stringify(testData));
    cacheKey(key);
  }

  async unlockWithPassword(password) {
    if (!isBrowser()) {
      return false;
    }

    const testJson = localStorage.getItem(MASTER_KEY_TEST);
    if (!testJson) {
      return false;
    }

    try {
      const testData = JSON.parse(testJson);
      const key = await deriveKey(password, testData?.kdf);
      const result = decryptApiKey(testData, key);
      if (result === 'test-value') {
        cacheKey(key);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  lock() {
    clearCachedKey();
  }

  async encryptAllApiKeys(password) {
    this.ensureLoaded();

    let kdf = null;
    if (isBrowser()) {
      try {
        const testJson = localStorage.getItem(MASTER_KEY_TEST);
        if (testJson) {
          const testData = JSON.parse(testJson);
          kdf = testData?.kdf || null;
        }
      } catch {
        kdf = null;
      }
    }

    let key = getCachedKey();
    if (!key) {
      if (kdf) {
        key = await deriveKey(password, kdf);
      } else {
        const keyMaterial = await createKeyMaterial(password);
        key = keyMaterial.key;
        kdf = keyMaterial.kdf;
        if (isBrowser()) {
          const testData = encryptApiKey('test-value', key, kdf);
          localStorage.setItem(MASTER_KEY_TEST, JSON.stringify(testData));
        }
      }
    }

    this.configs = this.configs.map((config) => {
      if (typeof config.apiKey === 'string' && config.apiKey) {
        return { ...config, apiKey: encryptApiKey(config.apiKey, key, kdf) };
      }
      return config;
    });
    this.saveConfigs();
    cacheKey(key);
  }
}

export const configManager = new ConfigManager();
export default ConfigManager;
