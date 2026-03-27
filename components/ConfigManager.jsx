'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import ConfirmDialog from '@/components/ConfirmDialog';
import Notification from '@/components/Notification';
import ConfigEditorModal from '@/components/config/ConfigEditorModal';
import ConfigList from '@/components/config/ConfigList';
import Modal from '@/components/ui/Modal';
import { getConfig as getRuntimeConfig } from '@/lib/config';
import { configManager } from '@/lib/config-manager';

const EMPTY_CONFIG = {
  name: '',
  type: 'openai',
  baseUrl: '',
  apiKey: '',
  model: '',
  description: '',
};
const EMPTY_NOTIFICATION = {
  isOpen: false,
  title: '',
  message: '',
  type: 'info',
};
const EMPTY_CONFIRM_DIALOG = {
  isOpen: false,
  title: '',
  message: '',
  onConfirm: null,
};

function filterConfigs(configs, query) {
  const normalizedQuery = (query || '').trim().toLowerCase();
  if (!normalizedQuery) {
    return configs;
  }

  return configs.filter((config) => {
    const haystack = [config.name, config.description, config.type]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(normalizedQuery);
  });
}

function downloadTextFile(filename, content) {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function ConfigManager({ isOpen, onClose, onConfigSelect }) {
  const [configs, setConfigs] = useState([]);
  const [activeConfigId, setActiveConfigId] = useState(null);
  const [editingSession, setEditingSession] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [testingConfigId, setTestingConfigId] = useState(null);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState(EMPTY_NOTIFICATION);
  const [confirmDialog, setConfirmDialog] = useState(EMPTY_CONFIRM_DIALOG);

  const loadConfigs = useCallback(() => {
    try {
      setConfigs(configManager.getAllConfigs());
      setActiveConfigId(configManager.getActiveConfigId());
    } catch (loadError) {
      setError(`加载配置失败：${loadError.message}`);
    }
  }, []);

  const closeEditor = useCallback(() => {
    setEditingSession(null);
  }, []);

  const notify = (type, title, message) => {
    setNotification({
      isOpen: true,
      title,
      message,
      type,
    });
  };

  const syncSelectedConfig = useCallback(() => {
    onConfigSelect?.(getRuntimeConfig());
  }, [onConfigSelect]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setError('');
      setTestingConfigId(null);
      closeEditor();
      setNotification(EMPTY_NOTIFICATION);
      setConfirmDialog(EMPTY_CONFIRM_DIALOG);
      return;
    }

    loadConfigs();
  }, [closeEditor, isOpen, loadConfigs]);

  const filteredConfigs = useMemo(
    () => filterConfigs(configs, searchQuery),
    [configs, searchQuery]
  );

  const handleCreateNew = () => {
    setError('');
    setEditingSession({
      config: { ...EMPTY_CONFIG },
      isCreating: true,
      apiKeyLocked: false,
    });
  };

  const handleEdit = (config) => {
    setError('');
    setEditingSession({
      config: configManager.toEditableConfig(config),
      isCreating: false,
      apiKeyLocked: configManager.isApiKeyLocked(config),
    });
  };

  const handleDelete = (configId) => {
    setConfirmDialog({
      isOpen: true,
      title: '确认删除',
      message: '确定要删除这个配置吗？此操作不可恢复。',
      onConfirm: async () => {
        try {
          configManager.deleteConfig(configId);
          loadConfigs();
          setError('');
          syncSelectedConfig();
          notify('success', '删除成功', '配置已成功删除。');
        } catch (deleteError) {
          setError(`删除配置失败：${deleteError.message}`);
        }
      },
    });
  };

  const handleClone = (config) => {
    try {
      configManager.cloneConfig(config.id, `${config.name} (副本)`);
      loadConfigs();
      setError('');
      notify('success', '克隆成功', '已创建配置副本。');
    } catch (cloneError) {
      setError(`克隆配置失败：${cloneError.message}`);
    }
  };

  const handleSetActive = (configId) => {
    try {
      configManager.setActiveConfig(configId);
      loadConfigs();
      syncSelectedConfig();
      setError('');
    } catch (setActiveError) {
      setError(`切换配置失败：${setActiveError.message}`);
    }
  };

  const handleTestConnection = async (config) => {
    setTestingConfigId(config.id);
    setError('');

    try {
      const result = await configManager.testConnection(config);
      notify(
        result.success ? 'success' : 'error',
        result.success ? '连接测试成功' : '连接测试失败',
        result.message
      );
    } catch (testError) {
      notify('error', '连接测试失败', testError.message);
    } finally {
      setTestingConfigId(null);
    }
  };

  const handleSaveConfig = async (configData) => {
    try {
      if (editingSession?.isCreating) {
        configManager.createConfig(configData);
        syncSelectedConfig();
        notify('success', '创建成功', '配置已创建。');
      } else {
        configManager.updateConfig(editingSession.config.id, configData);
        if (editingSession.config.id === activeConfigId) {
          syncSelectedConfig();
        }
        notify('success', '保存成功', '配置已更新。');
      }

      closeEditor();
      loadConfigs();
      setError('');
    } catch (saveError) {
      throw new Error(saveError.message || '保存配置失败');
    }
  };

  const handleExport = () => {
    try {
      downloadTextFile('llm-configs.json', configManager.exportConfigs());
      setError('');
    } catch (exportError) {
      setError(`导出配置失败：${exportError.message}`);
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (event) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      try {
        const text = await file.text();
        const result = configManager.importConfigs(text);
        if (!result.success) {
          throw new Error(result.message);
        }

        loadConfigs();
        setError('');
        syncSelectedConfig();
        notify('success', '导入成功', `成功导入 ${result.count} 个配置。`);
      } catch (importError) {
        setError(`导入配置失败：${importError.message}`);
      }
    };
    input.click();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {editingSession ? (
        <ConfigEditorModal
          config={editingSession.config}
          isCreating={editingSession.isCreating}
          onSave={handleSaveConfig}
          onCancel={closeEditor}
          apiKeyLocked={editingSession.apiKeyLocked}
        />
      ) : (
        <Modal isOpen={isOpen} onClose={onClose} title="配置管理" maxWidth="max-w-4xl">
          <div className="space-y-4">
            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            ) : null}

            <ConfigList
              configs={filteredConfigs}
              activeConfigId={activeConfigId}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              onCreate={handleCreateNew}
              onExport={handleExport}
              onImport={handleImport}
              onActivate={handleSetActive}
              onTest={handleTestConnection}
              onEdit={handleEdit}
              onClone={handleClone}
              onDelete={handleDelete}
              testingConfigId={testingConfigId}
            />
          </div>
        </Modal>
      )}

      <Notification
        isOpen={notification.isOpen}
        onClose={() => setNotification(EMPTY_NOTIFICATION)}
        title={notification.title}
        message={notification.message}
        type={notification.type}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(EMPTY_CONFIRM_DIALOG)}
        onConfirm={() => {
          confirmDialog.onConfirm?.();
          setConfirmDialog(EMPTY_CONFIRM_DIALOG);
        }}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type="danger"
      />
    </>
  );
}
