import { beforeEach, describe, expect, it, vi } from 'vitest';

import ConfigManager from '@/lib/config-manager';

const BASE_CONFIG = {
  name: 'Primary OpenAI',
  type: 'openai',
  baseUrl: 'https://api.openai.com/v1',
  apiKey: 'sk-test',
  model: 'gpt-4.1-mini',
  description: 'Main workspace config',
};

describe('ConfigManager', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('creates, updates, activates, clones, and deletes configs', () => {
    const manager = new ConfigManager();

    const first = manager.createConfig(BASE_CONFIG);
    const second = manager.createConfig({
      ...BASE_CONFIG,
      name: 'Backup Anthropic',
      type: 'anthropic',
      baseUrl: 'https://api.anthropic.com/v1',
      model: 'claude-3-5-sonnet',
    });

    expect(manager.getAllConfigs()).toHaveLength(2);
    expect(manager.getActiveConfigId()).toBe(first.id);

    const updated = manager.updateConfig(second.id, { model: 'claude-3-7-sonnet' });
    expect(updated.model).toBe('claude-3-7-sonnet');

    manager.setActiveConfig(second.id);
    expect(manager.getActiveConfigId()).toBe(second.id);

    const clone = manager.cloneConfig(first.id, 'Primary OpenAI (copy)');
    expect(clone.name).toBe('Primary OpenAI (copy)');
    expect(manager.getAllConfigs()).toHaveLength(3);

    manager.deleteConfig(second.id);
    expect(manager.getAllConfigs()).toHaveLength(2);
    expect(manager.getActiveConfigId()).toBe(first.id);
  });

  it('imports only valid configs', () => {
    const manager = new ConfigManager();
    const payload = JSON.stringify([
      BASE_CONFIG,
      {
        name: 'Invalid Config',
        type: 'openai',
        baseUrl: 'not-a-url',
        apiKey: '',
        model: '',
      },
    ]);

    const result = manager.importConfigs(payload);

    expect(result).toEqual({ success: true, count: 1 });
    expect(manager.getAllConfigs()).toHaveLength(1);
  });

  it('rejects encrypted configs when no decrypted API key is available', async () => {
    const manager = new ConfigManager();

    await expect(
      manager.testConnection({
        ...BASE_CONFIG,
        apiKey: { encrypted: 'cipher', nonce: 'nonce' },
      })
    ).rejects.toThrow('当前配置的 API 密钥已加密');
  });

  it('tests connections through the API route', async () => {
    const manager = new ConfigManager();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, message: '连接成功' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await manager.testConnection(BASE_CONFIG);

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/configs',
      expect.objectContaining({ method: 'POST' })
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      config: expect.objectContaining({
        type: BASE_CONFIG.type,
        baseUrl: BASE_CONFIG.baseUrl,
        apiKey: BASE_CONFIG.apiKey,
      }),
    });
    expect(result).toEqual({ success: true, message: '连接成功' });
  });

  it('loads models through the models API route', async () => {
    const manager = new ConfigManager();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ models: [{ id: 'gpt-4.1', name: 'gpt-4.1' }] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await manager.fetchModels(BASE_CONFIG);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain('/api/models?');
    expect(fetchMock.mock.calls[0][0]).toContain('type=openai');
    expect(result).toEqual([{ id: 'gpt-4.1', name: 'gpt-4.1' }]);
  });
});
