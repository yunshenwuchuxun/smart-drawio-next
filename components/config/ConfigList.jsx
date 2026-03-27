'use client';

import { useCallback, useRef } from 'react';

import Button from '@/components/ui/Button';

function formatDate(value) {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleString();
}

export default function ConfigList({
  configs,
  activeConfigId,
  searchQuery,
  onSearchQueryChange,
  onCreate,
  onExport,
  onImport,
  onActivate,
  onTest,
  onEdit,
  onClone,
  onDelete,
  testingConfigId,
}) {
  const listRef = useRef(null);

  const shouldIgnoreSelection = useCallback(() => {
    if (!listRef.current || typeof window === 'undefined') {
      return false;
    }

    const selection = window.getSelection?.();
    if (!selection || selection.isCollapsed) {
      return false;
    }

    const listEl = listRef.current;
    const normalizeNode = (node) => (node?.nodeType === Node.TEXT_NODE ? node.parentNode : node);
    const anchor = normalizeNode(selection.anchorNode);
    const focus = normalizeNode(selection.focusNode);

    return Boolean(
      (anchor && listEl.contains(anchor)) || (focus && listEl.contains(focus))
    );
  }, []);

  const handleCreateClick = useCallback((event) => {
    if (shouldIgnoreSelection()) {
      event.preventDefault();
      return;
    }

    onCreate();
  }, [onCreate, shouldIgnoreSelection]);

  return (
    <div ref={listRef} className="space-y-6">
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        提示：如果启用了访问密码，服务端环境变量会优先于这里的本地配置。
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={handleCreateClick}>新建配置</Button>
        <Button onClick={onExport} variant="secondary">
          导出配置
        </Button>
        <Button onClick={onImport} variant="secondary">
          导入配置
        </Button>
      </div>

      <div>
        <input
          type="text"
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder="搜索配置…"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>

      {configs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 px-4 py-10 text-center text-sm text-gray-500">
          {searchQuery ? '没有找到匹配的配置。' : '暂无配置，点击“新建配置”创建第一个配置。'}
        </div>
      ) : (
        <div className="space-y-3">
          {configs.map((config) => {
            const isActive = config.id === activeConfigId;
            const isTesting = testingConfigId === config.id;
            const disableActions = Boolean(testingConfigId);

            return (
              <div
                key={config.id}
                className={`rounded-lg border p-4 ${
                  isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-gray-900">{config.name}</h3>
                      {isActive ? (
                        <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700">当前使用</span>
                      ) : null}
                      <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">
                        {config.type}
                      </span>
                    </div>

                    {config.description ? (
                      <p className="mb-2 text-sm text-gray-600">{config.description}</p>
                    ) : null}

                    <div className="space-y-1 text-xs text-gray-500">
                      <div>URL：{config.baseUrl}</div>
                      <div>模型：{config.model}</div>
                      <div>创建时间：{formatDate(config.createdAt)}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    {!isActive ? (
                      <Button size="sm" onClick={() => onActivate(config.id)} disabled={disableActions}>
                        设为当前
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onTest(config)}
                      loading={isTesting}
                      disabled={disableActions && !isTesting}
                    >
                      测试连接
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => onEdit(config)} disabled={disableActions}>
                      编辑
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => onClone(config)} disabled={disableActions}>
                      克隆
                    </Button>
                    {configs.length > 1 ? (
                      <Button size="sm" variant="danger" onClick={() => onDelete(config.id)} disabled={disableActions}>
                        删除
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
