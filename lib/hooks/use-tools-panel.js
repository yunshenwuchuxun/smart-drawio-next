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
  pushToHistory,
  setGeneratedXml,
  setGeneratedCode,
  setNotification,
  debouncedSavePresets,
}) {
  const applyXmlToolResult = useCallback((result, title, fallbackMessage = '已应用') => {
    if (result.error) {
      setNotification({ isOpen: true, title, message: result.error, type: 'warning' });
      return;
    }

    setGeneratedXml(result.xml);
    setGeneratedCode(result.xml);

    const message = result.stats?.message || fallbackMessage;
    const type = result.stats?.modified > 0 ? 'info' : 'warning';
    setNotification({ isOpen: true, title, message, type });
  }, [setGeneratedCode, setGeneratedXml, setNotification]);

  const handlePresetToggle = useCallback((presetId, enabled) => {
    if (!generatedXml) return;

    pushToHistory(generatedXml);
    const result = applyPreset(generatedXml, presetId, enabled, stylePresets);
    if (result.error) {
      setNotification({ isOpen: true, title: '样式切换失败', message: result.error, type: 'warning' });
      return;
    }

    setGeneratedXml(result.xml);
    setGeneratedCode(result.xml);

    const nextPresets = { ...presets, [presetId]: enabled };
    setPresets(nextPresets);
    debouncedSavePresets(nextPresets);
  }, [debouncedSavePresets, generatedXml, presets, pushToHistory, setGeneratedCode, setGeneratedXml, setNotification, setPresets]);

  const handleApplyTextTool = useCallback((toolId) => {
    if (!generatedXml) return;

    pushToHistory(generatedXml);
    const result = applyTextStyleTool(generatedXml, toolId);
    applyXmlToolResult(result, textStyleTools[toolId]?.name || toolId);
  }, [applyXmlToolResult, generatedXml, pushToHistory]);

  const handleApplyStylePack = useCallback((packId) => {
    if (!generatedXml) return;

    pushToHistory(generatedXml);
    const result = applyStylePack(generatedXml, packId);
    applyXmlToolResult(result, stylePacks[packId]?.name || packId);
  }, [applyXmlToolResult, generatedXml, pushToHistory]);

  const handleApplyTrick = useCallback((trickId) => {
    if (!generatedXml) return;

    pushToHistory(generatedXml);
    const result = applyTrick(generatedXml, trickId);
    applyXmlToolResult(result, tricks[trickId]?.name || trickId);
  }, [applyXmlToolResult, generatedXml, pushToHistory]);

  return {
    handlePresetToggle,
    handleApplyTextTool,
    handleApplyStylePack,
    handleApplyTrick,
  };
}
