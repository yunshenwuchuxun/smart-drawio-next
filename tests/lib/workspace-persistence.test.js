import { describe, expect, it } from 'vitest';
import { createWorkspaceSnapshot, parseWorkspaceSnapshot } from '@/lib/workspace-persistence';

describe('workspace snapshots', () => {
  it('preserves the applied diagram and unapplied code separately without credentials or image data', () => {
    const snapshot = createWorkspaceSnapshot({
      generatedXml: '<mxfile/>', generatedCode: 'unfinished draft', inputDraft: 'unsent request',
      currentInput: { text: 'image request', image: { data: 'base64-image' } },
      currentChartType: 'flowchart', theme: 'business', presets: { shadow: true, apiKey: true },
      config: { apiKey: 'secret' }, apiKey: 'secret',
    }, 123);
    expect(snapshot).toMatchObject({ generatedXml: '<mxfile/>', generatedCode: 'unfinished draft',
      inputDraft: 'unsent request', currentInput: 'image request', theme: 'business', savedAt: 123 });
    expect(JSON.stringify(snapshot)).not.toMatch(/secret|base64-image|apiKey/);
    expect(parseWorkspaceSnapshot(JSON.stringify(snapshot))).toEqual(snapshot);
  });

  it('rejects corrupt, unsupported or incomplete snapshots', () => {
    for (const value of ['broken JSON', '{}', '{"version":2}', null,
      { version: 1, savedAt: 0, generatedXml: {}, generatedCode: '' }]) {
      expect(parseWorkspaceSnapshot(value)).toBeNull();
    }
  });

  it('normalizes unsupported theme and chart IDs and keeps an intentionally empty draft', () => {
    expect(createWorkspaceSnapshot({ currentInput: 'old input', inputDraft: '', theme: 'unknown',
      currentChartType: 'unknown', inputChartType: 'architecture', presets: { shadow: 'true' } }))
      .toMatchObject({ inputDraft: '', theme: 'research', currentChartType: 'auto',
        inputChartType: 'architecture', presets: {} });
  });
});
