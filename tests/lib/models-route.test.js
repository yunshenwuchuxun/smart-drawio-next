// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/llm-client', () => ({ fetchModels: vi.fn() }));
vi.mock('@/lib/logger', () => ({ error: vi.fn() }));

import * as route from '@/app/api/models/route';
import { fetchModels } from '@/lib/llm-client';
import { error as logError } from '@/lib/logger';

const config = { type: 'openai', baseUrl: 'https://api.openai.com/v1', apiKey: 'synthetic-test-key' };
const models = [{ id: 'test-model', name: 'Test model' }];

function request(body, search = '', ip = 'test-models') {
  return new Request(`https://example.test/api/models${search}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Real-IP': ip },
    body,
  });
}

describe('model listing credentials', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    fetchModels.mockResolvedValue(models);
  });

  it('registers only POST and returns the model list without caching', async () => {
    expect(route.GET).toBeUndefined();
    const response = await route.POST(request(JSON.stringify(config)));
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({ models });
    expect(fetchModels).toHaveBeenCalledExactlyOnceWith(config.type, config.baseUrl, config.apiKey);
  });

  it('rejects keys in the query even when the body is otherwise valid', async () => {
    const response = await route.POST(request(JSON.stringify(config), `?apiKey=${config.apiKey}`));
    expect(response.status).toBe(400);
    expect(await response.text()).not.toContain(config.apiKey);
    expect(fetchModels).not.toHaveBeenCalled();
  });

  it.each([null, {}, { ...config, apiKey: {} }, { ...config, baseUrl: 'not a URL' }])(
    'rejects invalid JSON values or provider URLs before calling upstream',
    async (payload) => {
      const response = await route.POST(request(JSON.stringify(payload)));
      expect(response.status).toBe(400);
      expect(await response.text()).not.toContain(config.apiKey);
      expect(fetchModels).not.toHaveBeenCalled();
    },
  );

  it('does not echo malformed JSON or log a credential from an upstream error', async () => {
    const malformed = await route.POST(request(`invalid JSON: ${config.apiKey}`));
    expect(malformed.status).toBe(400);
    expect(await malformed.text()).not.toContain(config.apiKey);
    expect(fetchModels).not.toHaveBeenCalled();

    fetchModels.mockRejectedValue(new Error(`Provider echoed ${config.apiKey}`));
    const failed = await route.POST(request(JSON.stringify(config)));
    expect(failed.status).toBe(500);
    expect(failed.headers.get('cache-control')).toBe('no-store');
    expect(await failed.text()).not.toContain(config.apiKey);
    expect(logError).toHaveBeenCalledWith('Error fetching models:', 'Provider model listing failed');
  });

  it('retains rate limiting and marks the 429 response as no-store', async () => {
    for (let i = 0; i < 20; i += 1) {
      await route.POST(request('{}', '', 'test-rate-limit'));
    }
    const response = await route.POST(request(JSON.stringify(config), '', 'test-rate-limit'));
    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).not.toBeNull();
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(fetchModels).not.toHaveBeenCalled();
  });
});
