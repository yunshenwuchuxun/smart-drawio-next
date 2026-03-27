'use client';

import { useEffect, useState } from 'react';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { configManager } from '@/lib/config-manager';

const EMPTY_CONFIG = {
  name: '',
  type: 'openai',
  baseUrl: '',
  apiKey: '',
  model: '',
  description: '',
};
const FIELD_CLASSES = 'w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900';

function buildInitialForm(config) {
  return {
    ...EMPTY_CONFIG,
    ...config,
  };
}

export default function ConfigEditorModal({
  config,
  isCreating,
  onSave,
  onCancel,
  apiKeyLocked = false,
}) {
  const [formData, setFormData] = useState(() => buildInitialForm(config));
  const [models, setModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [saving, setSaving] = useState(false);
  const [useCustomModel, setUseCustomModel] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setFormData(buildInitialForm(config));
    setModels([]);
    setUseCustomModel(true);
    setSaving(false);
    setError('');
  }, [config]);

  useEffect(() => {
    if (!formData.model) {
      return;
    }

    if (models.length === 0) {
      setUseCustomModel(true);
      return;
    }

    const exists = models.some((model) => model.id === formData.model);
    setUseCustomModel(!exists);
  }, [formData.model, models]);

  const handleFieldChange = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleProviderChange = (nextType) => {
    setFormData((current) => ({
      ...current,
      type: nextType,
      model: '',
    }));
    setModels([]);
    setUseCustomModel(true);
  };

  const handleLoadModels = async () => {
    if (!formData.type || !formData.baseUrl || !formData.apiKey) {
      setError('请先填写提供商类型、基础 URL 和 API 密钥。');
      return;
    }

    setLoadingModels(true);
    setError('');

    try {
      const availableModels = await configManager.fetchModels(formData);
      setModels(availableModels);

      if (availableModels.length === 0) {
        setUseCustomModel(true);
        return;
      }

      const modelExists = availableModels.some((model) => model.id === formData.model);
      if (!modelExists) {
        setUseCustomModel(false);
        setFormData((current) => ({
          ...current,
          model: availableModels[0].id,
        }));
        return;
      }

      setUseCustomModel(false);
    } catch (loadError) {
      setError(loadError.message || '加载模型失败');
      setModels([]);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.type || !formData.baseUrl || !formData.apiKey || !formData.model) {
      setError('请填写所有必填字段。');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await onSave({
        ...formData,
        name: formData.name.trim(),
        baseUrl: formData.baseUrl.trim(),
        apiKey: formData.apiKey,
        model: formData.model.trim(),
        description: formData.description?.trim() || '',
      });
    } catch (saveError) {
      setError(saveError.message || '保存配置失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onCancel} title={isCreating ? '新建配置' : '编辑配置'} maxWidth="max-w-md">
      <div className="space-y-4">
        {apiKeyLocked ? (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            当前配置的 API 密钥已加密，未解锁时不会显示原值；如需保存或测试，请重新输入密钥。
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            配置名称 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(event) => handleFieldChange('name', event.target.value)}
            placeholder="例如：我的 OpenAI"
            className={FIELD_CLASSES}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">描述</label>
          <textarea
            value={formData.description || ''}
            onChange={(event) => handleFieldChange('description', event.target.value)}
            placeholder="配置说明（可选）"
            rows={2}
            className={FIELD_CLASSES}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            提供商类型 <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.type}
            onChange={(event) => handleProviderChange(event.target.value)}
            className={FIELD_CLASSES}
          >
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            基础 URL <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.baseUrl}
            onChange={(event) => handleFieldChange('baseUrl', event.target.value)}
            placeholder={formData.type === 'openai' ? 'https://api.openai.com/v1' : 'https://api.anthropic.com/v1'}
            className={FIELD_CLASSES}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            API 密钥 <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            value={formData.apiKey}
            onChange={(event) => handleFieldChange('apiKey', event.target.value)}
            placeholder="sk-..."
            className={FIELD_CLASSES}
          />
        </div>

        <Button onClick={handleLoadModels} variant="secondary" className="w-full" loading={loadingModels}>
          {loadingModels ? '加载模型中…' : '加载可用模型'}
        </Button>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            模型 <span className="text-red-500">*</span>
          </label>

          {models.length > 0 ? (
            <div className="mb-2 flex items-center gap-4 text-sm text-gray-700">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  checked={!useCustomModel}
                  onChange={() => {
                    setUseCustomModel(false);
                    setFormData((current) => ({
                      ...current,
                      model: models[0]?.id || current.model,
                    }));
                  }}
                />
                从列表选择
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  checked={useCustomModel}
                  onChange={() => {
                    setUseCustomModel(true);
                    setFormData((current) => ({
                      ...current,
                      model: '',
                    }));
                  }}
                />
                手动输入
              </label>
            </div>
          ) : null}

          {models.length > 0 && !useCustomModel ? (
            <select
              value={formData.model}
              onChange={(event) => handleFieldChange('model', event.target.value)}
              className={FIELD_CLASSES}
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={formData.model}
              onChange={(event) => handleFieldChange('model', event.target.value)}
              placeholder="例如：gpt-4.1、claude-3-5-sonnet"
              className={FIELD_CLASSES}
            />
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={onCancel} disabled={saving || loadingModels}>
            取消
          </Button>
          <Button onClick={handleSave} loading={saving}>
            {isCreating ? '创建配置' : '保存配置'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
