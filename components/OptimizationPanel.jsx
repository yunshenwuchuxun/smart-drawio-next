'use client';

import { useCallback, useMemo, useState } from 'react';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { buildOptimizationSuggestions, OPTIMIZATION_SUGGESTIONS } from '@/lib/optimization-suggestions';

const INITIAL_FORM_STATE = {
  customSuggestion: '',
  selectedSuggestions: [],
  validationMessage: '',
};

export default function OptimizationPanel({ isOpen, onClose, onOptimize, isOptimizing }) {
  const [selectedSuggestions, setSelectedSuggestions] = useState(INITIAL_FORM_STATE.selectedSuggestions);
  const [customSuggestion, setCustomSuggestion] = useState(INITIAL_FORM_STATE.customSuggestion);
  const [validationMessage, setValidationMessage] = useState(INITIAL_FORM_STATE.validationMessage);

  const resetForm = useCallback(() => {
    setSelectedSuggestions(INITIAL_FORM_STATE.selectedSuggestions);
    setCustomSuggestion(INITIAL_FORM_STATE.customSuggestion);
    setValidationMessage(INITIAL_FORM_STATE.validationMessage);
  }, []);

  const handleClose = useCallback(() => {
    if (isOptimizing) {
      return;
    }

    resetForm();
    onClose();
  }, [isOptimizing, onClose, resetForm]);

  const handleToggleSuggestion = useCallback((id) => {
    setValidationMessage('');
    setSelectedSuggestions((current) => (
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    ));
  }, []);

  const handleOptimize = useCallback(() => {
    const suggestions = buildOptimizationSuggestions(selectedSuggestions, customSuggestion);

    if (suggestions.length === 0) {
      setValidationMessage('请至少选择一个优化建议，或输入一条自定义建议。');
      return;
    }

    setValidationMessage('');
    onOptimize(suggestions);
  }, [customSuggestion, onOptimize, selectedSuggestions]);

  const selectedCount = selectedSuggestions.length + (customSuggestion.trim() ? 1 : 0);

  const suggestionItems = useMemo(() => OPTIMIZATION_SUGGESTIONS.map((suggestion) => {
    const checked = selectedSuggestions.includes(suggestion.id);

    return (
      <label
        key={suggestion.id}
        className={`flex cursor-pointer items-start rounded-lg border p-3 transition-colors ${checked ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:bg-gray-50'}`}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={() => handleToggleSuggestion(suggestion.id)}
          disabled={isOptimizing}
          className="mt-1 mr-3 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
        />
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900">{suggestion.label}</div>
          <div className="mt-1 text-xs text-gray-500">{suggestion.description}</div>
        </div>
      </label>
    );
  }), [handleToggleSuggestion, isOptimizing, selectedSuggestions]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="高级优化" maxWidth="max-w-2xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-gray-500">
            选择你希望模型继续改进的方向，适合做结构收敛与视觉统一。
          </p>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
            已选 {selectedCount} 项
          </span>
        </div>

        <section>
          <h3 className="mb-3 text-sm font-medium text-gray-700">预设优化建议</h3>
          <div className="space-y-2">{suggestionItems}</div>
        </section>

        <section>
          <h3 className="mb-2 text-sm font-medium text-gray-700">自定义优化建议</h3>
          <textarea
            value={customSuggestion}
            onChange={(event) => {
              setCustomSuggestion(event.target.value);
              setValidationMessage('');
            }}
            disabled={isOptimizing}
            placeholder="例如：压缩节点数量，并把主路径强调得更明显。"
            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            rows={4}
          />
          {validationMessage && (
            <p className="mt-2 text-sm text-red-600">{validationMessage}</p>
          )}
        </section>

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
          <Button variant="secondary" onClick={handleClose} disabled={isOptimizing}>
            取消
          </Button>
          <Button onClick={handleOptimize} loading={isOptimizing}>
            开始优化
          </Button>
        </div>
      </div>
    </Modal>
  );
}
