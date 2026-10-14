'use client';

import { useEffect, useRef, useState } from 'react';
import { storage, STORAGE_KEYS } from '@/lib/storage';
import { createWorkspaceSnapshot, parseWorkspaceSnapshot } from '@/lib/workspace-persistence';

export function useWorkspacePersistence({ workspace, onRestore, delay = 500 }) {
  const [status, setStatus] = useState('loading');
  const [hydrated, setHydrated] = useState(false);
  const workspaceRef = useRef(workspace);
  const restoreRef = useRef(onRestore);
  const lastSavedRef = useRef(null);
  const pendingRef = useRef(false);
  const failedRecoveryRef = useRef(null);

  useEffect(() => { workspaceRef.current = workspace; }, [workspace]);
  useEffect(() => { restoreRef.current = onRestore; }, [onRestore]);

  useEffect(() => {
    let disposed = false;
    queueMicrotask(() => {
      if (disposed) return;
      const raw = storage.getItem(STORAGE_KEYS.AUTOSAVE);
      const snapshot = parseWorkspaceSnapshot(raw);
      const restored = snapshot ? restoreRef.current(snapshot) : null;
      const recoveryFailed = raw && (!snapshot || restored?.ok === false);
      if (recoveryFailed) {
        // Preserve unreadable recovery data until the user changes the workspace.
        lastSavedRef.current = JSON.stringify(createWorkspaceSnapshot(workspaceRef.current, 0));
        failedRecoveryRef.current = JSON.stringify([
          workspaceRef.current.generatedXml, workspaceRef.current.generatedCode, workspaceRef.current.inputDraft,
        ]);
      } else if (snapshot) {
        lastSavedRef.current = JSON.stringify({ ...snapshot, savedAt: 0 });
      }
      setStatus(recoveryFailed ? 'recovery-error' : snapshot ? 'saved' : 'ready');
      setHydrated(true);
    });
    return () => { disposed = true; };
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    if (failedRecoveryRef.current) {
      const content = JSON.stringify([workspace.generatedXml, workspace.generatedCode, workspace.inputDraft]);
      if (content === failedRecoveryRef.current) return;
      failedRecoveryRef.current = null;
    }

    const fingerprint = JSON.stringify(createWorkspaceSnapshot(workspace, 0));
    if (fingerprint === lastSavedRef.current) return;
    pendingRef.current = true;

    const save = () => {
      const current = createWorkspaceSnapshot(workspaceRef.current);
      const currentFingerprint = JSON.stringify({ ...current, savedAt: 0 });
      if (currentFingerprint === lastSavedRef.current) return;
      const persisted = storage.setJSON(STORAGE_KEYS.AUTOSAVE, current);
      if (persisted) lastSavedRef.current = currentFingerprint;
      pendingRef.current = !persisted;
      setStatus(persisted ? 'saved' : 'unsaved');
    };

    // Keep cleanup passive: a superseded render should not write an old snapshot.
    const timer = setTimeout(save, delay);
    const handlePageHide = () => save();
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') save();
    };
    const handleBeforeUnload = (event) => {
      save();
      if (pendingRef.current) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [workspace, hydrated, delay]);

  return { status, hydrated };
}
