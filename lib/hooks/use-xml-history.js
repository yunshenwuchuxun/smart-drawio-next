'use client';

import { useCallback, useRef, useState } from 'react';

export function useXmlHistory({ onApplyXml, maxEntries = 20 }) {
  const [xmlHistory, setXmlHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const stateRef = useRef({ entries: [], index: -1 });

  const syncHistoryState = useCallback((entries, index) => {
    stateRef.current = { entries, index };
    setXmlHistory(entries);
    setHistoryIndex(index);
  }, []);

  const pushToHistory = useCallback((xml) => {
    if (!xml) return;

    const { entries, index } = stateRef.current;

    // Deduplicate: skip if xml is identical to the current entry
    if (index >= 0 && entries[index] === xml) {
      return;
    }

    const truncated = index >= 0 ? entries.slice(0, index + 1) : [];
    const nextEntries = [...truncated, xml];
    const boundedEntries = nextEntries.length > maxEntries
      ? nextEntries.slice(nextEntries.length - maxEntries)
      : nextEntries;

    syncHistoryState(boundedEntries, boundedEntries.length - 1);
  }, [maxEntries, syncHistoryState]);

  const handleUndo = useCallback(() => {
    const { entries, index } = stateRef.current;
    if (index <= 0 || entries.length === 0) {
      return;
    }

    const nextIndex = index - 1;
    syncHistoryState(entries, nextIndex);
    onApplyXml?.(entries[nextIndex]);
  }, [onApplyXml, syncHistoryState]);

  const handleRedo = useCallback(() => {
    const { entries, index } = stateRef.current;
    if (index >= entries.length - 1) return;

    const nextIndex = index + 1;
    syncHistoryState(entries, nextIndex);
    onApplyXml?.(entries[nextIndex]);
  }, [onApplyXml, syncHistoryState]);

  return {
    xmlHistory,
    historyIndex,
    pushToHistory,
    handleUndo,
    handleRedo,
  };
}
