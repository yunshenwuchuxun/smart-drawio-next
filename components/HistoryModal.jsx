'use client';

import { useCallback, useState } from 'react';

import ConfirmDialog from '@/components/ConfirmDialog';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { CHART_TYPES } from '@/lib/constants';
import { historyManager } from '@/lib/history-manager';

const INITIAL_CONFIRM_STATE = {
  isOpen: false,
  title: '',
  message: '',
  onConfirm: null,
};

function truncateText(text, maxLength = 100) {
  if (!text) return '';
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function formatTimestamp(timestamp) {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function HistoryModal({ isOpen, onClose, onApply }) {
  const [, setHistoryVersion] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState(INITIAL_CONFIRM_STATE);

  const refreshHistories = useCallback(() => {
    setHistoryVersion((current) => current + 1);
  }, []);

  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog(INITIAL_CONFIRM_STATE);
  }, []);

  const openConfirmDialog = useCallback((nextState) => {
    setConfirmDialog({ ...INITIAL_CONFIRM_STATE, ...nextState });
  }, []);

  const histories = isOpen ? historyManager.getHistories() : [];
  const hasHistories = histories.length > 0;

  const handleApply = useCallback((history) => {
    onApply?.(history);
    onClose();
  }, [onApply, onClose]);

  const handleDelete = useCallback((id) => {
    openConfirmDialog({
      isOpen: true,
      title: '删除历史记录',
      message: '确定要删除这条历史记录吗？',
      onConfirm: () => {
        historyManager.deleteHistory(id);
        refreshHistories();
      },
    });
  }, [openConfirmDialog, refreshHistories]);

  const handleClearAll = useCallback(() => {
    openConfirmDialog({
      isOpen: true,
      title: '清空历史记录',
      message: '确定要清空所有历史记录吗？此操作不可恢复。',
      onConfirm: () => {
        historyManager.clearAll();
        refreshHistories();
      },
    });
  }, [openConfirmDialog, refreshHistories]);

  const historyCards = histories.map((history) => {
    const chartTypeLabel = CHART_TYPES[history.chartType] || history.chartType;

    return (
      <article
        key={history.id}
        className="rounded-lg border border-gray-200 p-4 transition-colors hover:border-gray-300"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700">
                {chartTypeLabel}
              </span>
              <span className="text-xs text-gray-500">{formatTimestamp(history.timestamp)}</span>
            </div>
            <p className="mb-2 text-sm text-gray-900">{truncateText(history.userInput)}</p>
            {history.config && (
              <p className="text-xs text-gray-500">
                模型：{history.config.name} - {history.config.model}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button size="sm" onClick={() => handleApply(history)}>
              应用
            </Button>
            <Button size="sm" variant="danger" onClick={() => handleDelete(history.id)}>
              删除
            </Button>
          </div>
        </div>
      </article>
    );
  });

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="历史记录" maxWidth="max-w-4xl">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-gray-500">
              查看最近生成过的图表记录，并可一键恢复到编辑区。
            </p>
            {hasHistories && (
              <Button size="sm" variant="danger" onClick={handleClearAll}>
                清空全部
              </Button>
            )}
          </div>

          {hasHistories ? (
            <div className="space-y-3">{historyCards}</div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 py-10 text-center text-sm text-gray-500">
              暂无历史记录
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={closeConfirmDialog}
        onConfirm={() => {
          confirmDialog.onConfirm?.();
          closeConfirmDialog();
        }}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type="danger"
      />
    </>
  );
}
