'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

import BlueprintOverlay from '@/components/BlueprintOverlay';
import ConfigManager from '@/components/ConfigManager';
import HistoryModal from '@/components/HistoryModal';
import Notification from '@/components/Notification';
import OptimizationPanel from '@/components/OptimizationPanel';
import WorkspaceSidebar from '@/components/layout/WorkspaceSidebar';
import TopBar from '@/components/layout/TopBar';
import { getConfig, isConfigValid } from '@/lib/config';
import { debounce } from '@/lib/debounce';
import { useGenerationWorkflow } from '@/lib/hooks/use-generation-workflow';
import { useToolsPanel } from '@/lib/hooks/use-tools-panel';
import { useXmlHistory } from '@/lib/hooks/use-xml-history';
import { STORAGE_KEYS, ensureMigration, storage } from '@/lib/storage';
import { DEFAULT_THEME_ID } from '@/lib/themes';
import { getPresetDefaults, stylePacks, stylePresets, textStyleTools, tricks } from '@/lib/tool-registry';

const DrawioCanvas = dynamic(() => import('@/components/DrawioCanvas'), {
  ssr: false,
});

const INITIAL_NOTIFICATION = {
  isOpen: false,
  title: '',
  message: '',
  type: 'info',
};

const VALID_PANELS = new Set(['input', 'code', 'tools']);
const EMPTY_GENERATION_SETTERS = {
  setGeneratedXml: () => {},
  setGeneratedCode: () => {},
};

export default function Home() {
  const [config, setConfig] = useState(null);
  const [isConfigManagerOpen, setIsConfigManagerOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [activePanel, setActivePanel] = useState('input');
  const [notification, setNotification] = useState(INITIAL_NOTIFICATION);
  const [currentTheme, setCurrentTheme] = useState(DEFAULT_THEME_ID);
  const [presets, setPresets] = useState(getPresetDefaults(DEFAULT_THEME_ID));
  const generationStateRef = useRef(EMPTY_GENERATION_SETTERS);
  const suppressXmlChangeRef = useRef(false);

  const debouncedSavePresets = useMemo(
    () => debounce((nextPresets) => {
      storage.setJSON(STORAGE_KEYS.STYLE_PRESETS, nextPresets);
    }, 500),
    []
  );

  const debouncedSaveTheme = useMemo(
    () => debounce((themeId) => {
      storage.setItem(STORAGE_KEYS.DIAGRAM_THEME, themeId);
    }, 500),
    []
  );

  useEffect(() => {
    const handleBeforeUnload = () => {
      debouncedSavePresets.flush();
      debouncedSaveTheme.flush();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      debouncedSavePresets.cancel();
      debouncedSaveTheme.cancel();
    };
  }, [debouncedSavePresets, debouncedSaveTheme]);

  useEffect(() => {
    ensureMigration();

    let disposed = false;
    queueMicrotask(() => {
      if (disposed) {
        return;
      }

      const savedConfig = getConfig();
      if (savedConfig) {
        setConfig(savedConfig);
      }

      const savedPanel = storage.getItem(STORAGE_KEYS.ACTIVE_PANEL);
      if (savedPanel === '') {
        setActivePanel(null);
      } else if (VALID_PANELS.has(savedPanel)) {
        setActivePanel(savedPanel);
      }

      const savedTheme = storage.getItem(STORAGE_KEYS.DIAGRAM_THEME) || DEFAULT_THEME_ID;
      setCurrentTheme(savedTheme);
      setPresets(storage.getJSON(STORAGE_KEYS.STYLE_PRESETS, getPresetDefaults(savedTheme)));
    });

    const handleStorageChange = (event) => {
      if (event.key === STORAGE_KEYS.ACTIVE_CONFIG || event.key === STORAGE_KEYS.CONFIGS) {
        setConfig(getConfig());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      disposed = true;
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const showNotification = useCallback(({ title, message, type = 'info' }) => {
    setNotification({
      isOpen: true,
      title,
      message,
      type,
    });
  }, []);

  const handleRequireConfig = useCallback(() => {
    showNotification({
      title: 'Config Required',
      message: 'Please configure an LLM provider before generating diagrams.',
      type: 'warning',
    });
    setIsConfigManagerOpen(true);
  }, [showNotification]);

  const handleThemeChange = useCallback((themeId) => {
    setCurrentTheme(themeId);
    debouncedSaveTheme(themeId);
  }, [debouncedSaveTheme]);

  const handlePanelToggle = useCallback((panelId) => {
    setActivePanel((previousPanel) => {
      const nextPanel = previousPanel === panelId ? null : panelId;
      storage.setItem(STORAGE_KEYS.ACTIVE_PANEL, nextPanel || '');
      return nextPanel;
    });
  }, []);

  const showCodePanel = useCallback(() => {
    setActivePanel('code');
    storage.setItem(STORAGE_KEYS.ACTIVE_PANEL, 'code');
  }, []);

  const applyXmlSnapshot = useCallback((xml) => {
    suppressXmlChangeRef.current = true;
    generationStateRef.current.setGeneratedXml(xml);
    generationStateRef.current.setGeneratedCode(xml);
  }, []);

  const {
    pushToHistory,
    handleUndo,
    handleRedo,
  } = useXmlHistory({ onApplyXml: applyXmlSnapshot });

  const generation = useGenerationWorkflow({
    config,
    currentTheme,
    pushToHistory,
    suppressXmlChangeRef,
    onNotify: showNotification,
    onRequireConfig: handleRequireConfig,
    onShowCodePanel: showCodePanel,
  });

  useEffect(() => {
    generationStateRef.current = {
      setGeneratedXml: generation.setGeneratedXml,
      setGeneratedCode: generation.setGeneratedCode,
    };
  }, [generation.setGeneratedCode, generation.setGeneratedXml]);

  const {
    handlePresetToggle,
    handleApplyTextTool,
    handleApplyStylePack,
    handleApplyTrick,
  } = useToolsPanel({
    generatedXml: generation.generatedXml,
    presets,
    setPresets,
    pushToHistory,
    setGeneratedXml: generation.setGeneratedXml,
    setGeneratedCode: generation.setGeneratedCode,
    setNotification,
    debouncedSavePresets,
  });

  const handleConfigSelect = useCallback((selectedConfig) => {
    setConfig(selectedConfig ?? null);
  }, []);

  const sidebarStatus = useMemo(() => {
    if (generation.isGenerating) {
      return 'generating';
    }

    if (generation.apiError) {
      return 'error';
    }

    return 'ready';
  }, [generation.apiError, generation.isGenerating]);

  useEffect(() => {
    const handleGlobalKeyDown = (event) => {
      const target = event.target;
      const isEditing = target.tagName === 'INPUT'
        || target.tagName === 'TEXTAREA'
        || target.isContentEditable
        || target.closest('.monaco-editor');

      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey && !isEditing) {
        event.preventDefault();
        handleUndo();
      }

      if ((event.ctrlKey || event.metaKey) && (event.key === 'y' || (event.key === 'z' && event.shiftKey)) && !isEditing) {
        event.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleRedo, handleUndo]);

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--color-bg-app)' }}>
      <TopBar
        modelName={config ? `${config.name || config.type} - ${config.model}` : null}
        modelStatus={config && isConfigValid(config) ? 'connected' : 'disconnected'}
        onHistoryClick={() => setIsHistoryModalOpen(true)}
        onSettingsClick={() => setIsConfigManagerOpen(true)}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <WorkspaceSidebar
          status={sidebarStatus}
          apiError={generation.apiError}
          onDismissApiError={() => generation.setApiError(null)}
          activePanel={activePanel}
          onPanelToggle={handlePanelToggle}
          chatPanel={{
            currentChartType: generation.currentChartType,
            currentInput: generation.currentInput,
            currentTheme,
            isGenerating: generation.isGenerating,
            onSendMessage: generation.handleSendMessage,
            onStop: generation.handleStopGeneration,
            onThemeChange: handleThemeChange,
          }}
          codePanel={{
            canContinue: generation.canContinue,
            code: generation.generatedCode,
            isApplyingCode: generation.isApplyingCode,
            isGenerating: generation.isGenerating,
            isOptimizingCode: generation.isOptimizingCode,
            isTruncated: generation.isTruncated,
            jsonError: generation.jsonError,
            onAdvancedOptimize: generation.handleOpenOptimizationPanel,
            onApply: generation.handleApplyCode,
            onChange: generation.setGeneratedCode,
            onClear: generation.handleClearCode,
            onClearJsonError: () => generation.setJsonError(null),
            onContinue: generation.handleContinueGeneration,
            onOptimize: generation.handleOptimizeCode,
          }}
          toolsPanel={{
            presets,
            stylePresets,
            textStyleTools,
            stylePacks,
            tricks,
            onApplyStylePack: handleApplyStylePack,
            onApplyTextTool: handleApplyTextTool,
            onApplyTrick: handleApplyTrick,
            onPresetToggle: handlePresetToggle,

          }}
        />

        <div className="flex-1 relative min-h-0 h-full" style={{ background: 'var(--color-bg-app)' }}>
          <DrawioCanvas
            elements={generation.elements}
            xml={generation.generatedXml}
            onXmlChange={generation.handleDrawioXmlChange}
          />
          <BlueprintOverlay
            isVisible={generation.showBlueprint}
            phase={generation.blueprintPhase}
            onRevealComplete={generation.handleBlueprintRevealComplete}
            acceleratedReveal={!generation.isGenerating}
          />
        </div>
      </div>

      <ConfigManager
        isOpen={isConfigManagerOpen}
        onClose={() => setIsConfigManagerOpen(false)}
        onConfigSelect={handleConfigSelect}
      />

      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        onApply={generation.handleApplyHistory}
      />

      <OptimizationPanel
        isOpen={generation.isOptimizationPanelOpen}
        onClose={generation.handleCloseOptimizationPanel}
        onOptimize={generation.handleAdvancedOptimize}
        isOptimizing={generation.isGenerating}
      />

      <Notification
        isOpen={notification.isOpen}
        onClose={() => setNotification((current) => ({ ...current, isOpen: false }))}
        title={notification.title}
        message={notification.message}
        type={notification.type}
      />
    </div>
  );
}
