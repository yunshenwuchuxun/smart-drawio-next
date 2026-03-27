'use client';

import { memo, useCallback, useEffect, useRef } from 'react';
import { Editor } from '@monaco-editor/react';

import EditorToolbar from './code-editor/EditorToolbar';
import JsonErrorBanner from './code-editor/JsonErrorBanner';

const EDITOR_OPTIONS = {
  minimap: { enabled: false },
  fontSize: 13,
  lineNumbers: 'on',
  scrollBeyondLastLine: false,
  automaticLayout: true,
  tabSize: 2,
  wordWrap: 'on',
};

function CodeEditor({
  code,
  onChange,
  onApply,
  onOptimize,
  onAdvancedOptimize,
  onClear,
  jsonError,
  onClearJsonError,
  isGenerating,
  isApplyingCode,
  isOptimizingCode,
  isTruncated,
  canContinue,
  onContinue,
}) {
  const applyActionStateRef = useRef({
    onApply,
    isGenerating,
    isApplyingCode,
    isOptimizingCode,
  });

  useEffect(() => {
    applyActionStateRef.current = {
      onApply,
      isGenerating,
      isApplyingCode,
      isOptimizingCode,
    };
  }, [onApply, isGenerating, isApplyingCode, isOptimizingCode]);

  const handleEditorMount = useCallback((editor, monaco) => {
    editor.addAction({
      id: 'apply-code',
      label: 'Apply Code',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => {
        const latestState = applyActionStateRef.current;
        const currentCode = editor.getValue();

        if (
          latestState.onApply &&
          currentCode.trim() &&
          !latestState.isGenerating &&
          !latestState.isApplyingCode &&
          !latestState.isOptimizingCode
        ) {
          latestState.onApply();
        }
      },
    });
  }, []);

  return (
    <div className="flex relative flex-col h-full bg-gray-50 border-t border-gray-200">
      <EditorToolbar
        canContinue={canContinue}
        hasCode={Boolean(code.trim())}
        isApplyingCode={isApplyingCode}
        isGenerating={isGenerating}
        isOptimizingCode={isOptimizingCode}
        isTruncated={isTruncated}
        onAdvancedOptimize={onAdvancedOptimize}
        onApply={onApply}
        onClear={onClear}
        onContinue={onContinue}
        onOptimize={onOptimize}
      />

      <JsonErrorBanner error={jsonError} onClear={onClearJsonError} />

      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          value={code}
          onChange={onChange}
          onMount={handleEditorMount}
          theme="vs-light"
          options={EDITOR_OPTIONS}
        />
      </div>
    </div>
  );
}

export default memo(CodeEditor);