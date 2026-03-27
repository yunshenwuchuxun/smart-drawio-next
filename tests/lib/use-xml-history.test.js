import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useXmlHistory } from '@/lib/hooks/use-xml-history';

describe('useXmlHistory', () => {
  it('pushes snapshots and supports undo/redo', () => {
    const onApplyXml = vi.fn();
    const { result } = renderHook(() => useXmlHistory({ onApplyXml }));

    act(() => {
      result.current.pushToHistory('xml-1');
      result.current.pushToHistory('xml-2');
      result.current.pushToHistory('xml-3');
    });

    act(() => {
      result.current.handleUndo();
    });

    expect(onApplyXml).toHaveBeenLastCalledWith('xml-2');

    act(() => {
      result.current.handleRedo();
    });

    expect(onApplyXml).toHaveBeenLastCalledWith('xml-3');
  });

  it('truncates future history when branching', () => {
    const onApplyXml = vi.fn();
    const { result } = renderHook(() => useXmlHistory({ onApplyXml }));

    act(() => {
      result.current.pushToHistory('xml-1');
      result.current.pushToHistory('xml-2');
      result.current.pushToHistory('xml-3');
      result.current.handleUndo();
      result.current.pushToHistory('xml-4');
      result.current.handleRedo();
    });

    expect(onApplyXml).toHaveBeenCalledTimes(1);
    expect(result.current.historyIndex).toBe(2);
    expect(result.current.xmlHistory).toEqual(['xml-1', 'xml-2', 'xml-4']);
  });
});
