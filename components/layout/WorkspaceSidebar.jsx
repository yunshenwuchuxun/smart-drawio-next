'use client';

import Chat from '@/components/Chat';
import CodeEditor from '@/components/CodeEditor';
import Sidebar from '@/components/layout/Sidebar';
import SidebarCard from '@/components/layout/SidebarCard';
import ToolsCard from '@/components/panels/ToolsCard';

function ApiErrorBanner({ message, onDismiss }) {
  if (!message) {
    return null;
  }

  return (
    <div
      className="px-4 py-3 flex items-start justify-between flex-shrink-0 max-h-32 overflow-y-auto"
      style={{
        background: 'var(--color-accent-alpha10)',
        borderBottom: '1px solid var(--color-error)',
      }}
    >
      <div className="flex items-start space-x-2 min-w-0 flex-1">
        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-error)' }} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <p className="text-xs break-words line-clamp-6" style={{ color: 'var(--color-error)' }}>{message}</p>
      </div>
      <button
        onClick={onDismiss}
        className="p-1 rounded touch-target focus-ring"
        style={{ color: 'var(--color-error)' }}
        aria-label="Dismiss error"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}

export default function WorkspaceSidebar({
  activePanel,
  apiError,
  chatPanel,
  codePanel,
  onDismissApiError,
  onPanelToggle,
  status,
  toolsPanel,
}) {
  const codeSummary = codePanel.code ? `${codePanel.code.split('\n').length} lines` : null;

  return (
    <Sidebar status={status}>
      <ApiErrorBanner message={apiError} onDismiss={onDismissApiError} />

      <div className="flex flex-col flex-1 min-h-0" role="tablist">
        <SidebarCard
          id="input"
          name="INPUT"
          isExpanded={activePanel === 'input'}
          onToggle={onPanelToggle}
          summary={chatPanel.currentChartType !== 'auto' ? chatPanel.currentChartType : null}
        >
          <Chat
            onSendMessage={chatPanel.onSendMessage}
            isGenerating={chatPanel.isGenerating}
            initialInput={chatPanel.currentInput}
            initialChartType={chatPanel.currentChartType}
            theme={chatPanel.currentTheme}
            onThemeChange={chatPanel.onThemeChange}
            onStop={chatPanel.onStop}
          />
        </SidebarCard>

        <SidebarCard
          id="code"
          name="CODE"
          isExpanded={activePanel === 'code'}
          onToggle={onPanelToggle}
          summary={codeSummary}
        >
          <CodeEditor
            code={codePanel.code}
            onChange={codePanel.onChange}
            onApply={codePanel.onApply}
            onOptimize={codePanel.onOptimize}
            onAdvancedOptimize={codePanel.onAdvancedOptimize}
            onClear={codePanel.onClear}
            jsonError={codePanel.jsonError}
            onClearJsonError={codePanel.onClearJsonError}
            isGenerating={codePanel.isGenerating}
            isApplyingCode={codePanel.isApplyingCode}
            isOptimizingCode={codePanel.isOptimizingCode}
            isTruncated={codePanel.isTruncated}
            canContinue={codePanel.canContinue}
            onContinue={codePanel.onContinue}
          />
        </SidebarCard>

        <ToolsCard
          isExpanded={activePanel === 'tools'}
          onToggle={onPanelToggle}
          presets={toolsPanel.presets}
          stylePresets={toolsPanel.stylePresets}
          textStyleTools={toolsPanel.textStyleTools}
          stylePacks={toolsPanel.stylePacks}
          tricks={toolsPanel.tricks}
          onPresetToggle={toolsPanel.onPresetToggle}
          onApplyTextTool={toolsPanel.onApplyTextTool}
          onApplyStylePack={toolsPanel.onApplyStylePack}
          onApplyTrick={toolsPanel.onApplyTrick}
        />
      </div>
    </Sidebar>
  );
}
