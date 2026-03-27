import { beforeEach, describe, expect, it } from 'vitest';

import { configManager, getConfig, isConfigValid, saveConfig } from '@/lib/config';

const BASE_CONFIG = {
  name: 'Primary OpenAI',
  type: 'openai',
  baseUrl: 'https://api.openai.com/v1',
  apiKey: 'sk-test',
  model: 'gpt-4.1-mini',
};

function resetSingleton() {
  configManager.configs = [];
  configManager.activeConfigId = null;
  configManager.isLoaded = false;
}

describe('config compatibility helpers', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    resetSingleton();
  });

  it('saves and reads the active config through compatibility helpers', () => {
    saveConfig(BASE_CONFIG);

    expect(getConfig()).toMatchObject(BASE_CONFIG);
    expect(isConfigValid(getConfig())).toBe(true);
  });

  it('migrates a legacy single-config entry on first read', () => {
    localStorage.setItem('smart-drawio-config', JSON.stringify(BASE_CONFIG));

    const migrated = getConfig();

    expect(migrated).toMatchObject(BASE_CONFIG);
    expect(localStorage.getItem('smart-drawio-config')).toBeNull();
    expect(configManager.getAllConfigs()).toHaveLength(1);
  });

  it('returns an empty apiKey when the active config is encrypted but locked', () => {
    configManager.configs = [
      {
        ...BASE_CONFIG,
        id: 'cfg-1',
        apiKey: { encrypted: 'cipher', nonce: 'nonce' },
      },
    ];
    configManager.activeConfigId = 'cfg-1';
    configManager.isLoaded = true;

    const activeConfig = getConfig();

    expect(activeConfig.apiKey).toBe('');
    expect(isConfigValid(activeConfig)).toBe(false);
  });
});
