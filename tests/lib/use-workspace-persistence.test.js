import { useState } from 'react';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useWorkspacePersistence } from '@/lib/hooks/use-workspace-persistence';
import { createWorkspaceSnapshot } from '@/lib/workspace-persistence';
import { storage, STORAGE_KEYS } from '@/lib/storage';

const empty = { generatedXml: '', generatedCode: '', inputDraft: '', currentChartType: 'auto',
  theme: 'research', presets: {} };

async function hydrate() { await act(async () => {}); }

describe('workspace persistence', () => {
  beforeEach(() => { localStorage.clear(); vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

  it('restores a diagram and its distinct unfinished code draft before autosaving', async () => {
    const saved = createWorkspaceSnapshot({ ...empty, generatedXml: 'applied XML',
      generatedCode: 'unfinished code', inputDraft: 'unsent request' }, 1);
    localStorage.setItem(STORAGE_KEYS.AUTOSAVE, JSON.stringify(saved));
    const { result } = renderHook(() => {
      const [workspace, setWorkspace] = useState(empty);
      const persistence = useWorkspacePersistence({ workspace, onRestore(snapshot) {
        setWorkspace(snapshot);
        return { ok: true };
      } });
      return { workspace, ...persistence };
    });
    await hydrate();
    act(() => { vi.advanceTimersByTime(1000); });
    expect(result.current.workspace).toMatchObject(saved);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.AUTOSAVE))).toEqual(saved);
    expect(result.current.status).toBe('saved');
  });

  it('debounces updates and flushes the latest workspace when leaving the page', async () => {
    const { result, rerender } = renderHook(({ workspace }) =>
      useWorkspacePersistence({ workspace, onRestore: () => ({ ok: true }) }),
    { initialProps: { workspace: empty } });
    await hydrate();
    rerender({ workspace: { ...empty, generatedXml: 'applied', generatedCode: 'draft-one' } });
    rerender({ workspace: { ...empty, generatedXml: 'applied', generatedCode: 'draft-two' } });
    expect(localStorage.getItem(STORAGE_KEYS.AUTOSAVE)).toBeNull();
    act(() => { window.dispatchEvent(new Event('pagehide')); });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.AUTOSAVE))).toMatchObject({
      generatedXml: 'applied', generatedCode: 'draft-two',
    });
    expect(result.current.status).toBe('saved');
  });

  it('reports persistence failures and asks the browser to protect unsaved work', async () => {
    vi.spyOn(storage, 'setJSON').mockReturnValue(false);
    const { result } = renderHook(() => useWorkspacePersistence({ workspace: empty,
      onRestore: () => ({ ok: true }) }));
    await hydrate();
    act(() => { vi.advanceTimersByTime(500); });
    expect(result.current.status).toBe('unsaved');
    const beforeUnload = new Event('beforeunload', { cancelable: true });
    act(() => { window.dispatchEvent(beforeUnload); });
    expect(beforeUnload.defaultPrevented).toBe(true);
  });

  it('keeps failed recovery data until the user changes document content', async () => {
    const corrupt = '{not valid JSON';
    localStorage.setItem(STORAGE_KEYS.AUTOSAVE, corrupt);
    const { result, rerender } = renderHook(({ workspace }) =>
      useWorkspacePersistence({ workspace, onRestore: () => ({ ok: false }) }),
    { initialProps: { workspace: empty } });
    await hydrate();
    rerender({ workspace: { ...empty, theme: 'business' } });
    act(() => { vi.advanceTimersByTime(1000); });
    expect(result.current.status).toBe('recovery-error');
    expect(localStorage.getItem(STORAGE_KEYS.AUTOSAVE)).toBe(corrupt);
    rerender({ workspace: { ...empty, inputDraft: 'new work' } });
    act(() => { vi.advanceTimersByTime(500); });
    expect(result.current.status).toBe('saved');
  });
});
