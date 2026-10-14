'use client';

import { useCallback } from 'react';

import { applyTrick } from '@/lib/drawing-tricks';
import { applyStylePack } from '@/lib/style-packs';
import { applyTextStyleTool } from '@/lib/text-style-tools';
import { applyPreset } from '@/lib/theme-engine';
import { stylePacks, stylePresets, textStyleTools, tricks } from '@/lib/tool-registry';

export function useToolsPanel({
  generatedXml,
  presets,
  setPresets,
  commitDocument,
  setNotification,
  debouncedSavePresets,
}) {
  const applyXmlToolResult = useCallback((result, title, fallbackMessage = '已应用') => {
    if (result.error) {
      setNotification({ isOpen: true, title, message: result.error, type: 'warning' });
      return;
    }

    const committed = commitDocument(result.xml, { source: 'tool' });
    if (!committed.ok) {
      setNotification({ isOpen: true, title, message: committed.error, type: 'warning' });
      return;
    }

    const message = result.stats?.message || fallbackMessage;
    const type = result.stats?.modified > 0 ? 'info' : 'warning';
    setNotification({ isOpen: true, title, message, type });
  }, [commitDocument, setNotification]);

  const handlePresetToggle = useCallback((presetId, enabled) => {
    if (!generatedXml) return;

    const result = applyPreset(generatedXml, presetId, enabled, stylePresets);
    if (result.error) {
      setNotification({ isOpen: true, title: '样式切换失败', message: result.error, type: 'warning' });
      return;
    }

    const committed = commitDocument(result.xml, { source: 'tool' });
    if (!committed.ok) {
      setNotification({ isOpen: true, title: '样式切换失败', message: committed.error, type: 'warning' });
      return;
    }

    const nextPresets = { ...presets, [presetId]: enabled };
    setPresets(nextPresets);
    debouncedSavePresets(nextPresets);
  }, [commitDocument, debouncedSavePresets, generatedXml, presets, setNotification, setPresets]);

  const handleApplyTextTool = useCallback((toolId) => {
    if (!generatedXml) return;

    const result = applyTextStyleTool(generatedXml, toolId);
    applyXmlToolResult(result, textStyleTools[toolId]?.name || toolId);
  }, [applyXmlToolResult, generatedXml]);

  const handleApplyStylePack = useCallback((packId) => {
    if (!generatedXml) return;

    const result = applyStylePack(generatedXml, packId);
    applyXmlToolResult(result, stylePacks[packId]?.name || packId);
  }, [applyXmlToolResult, generatedXml]);

  const handleApplyTrick = useCallback((trickId) => {
    if (!generatedXml) return;

    const result = applyTrick(generatedXml, trickId);
    applyXmlToolResult(result, tricks[trickId]?.name || trickId);
  }, [applyXmlToolResult, generatedXml]);

  return {
    handlePresetToggle,
    handleApplyTextTool,
    handleApplyStylePack,
    handleApplyTrick,
  };
}
