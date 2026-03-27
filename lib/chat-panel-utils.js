import { CHART_TYPES } from '@/lib/constants';

export const CHAT_TABS = [
  { id: 'text', label: '文本输入' },
  { id: 'file', label: '文件上传' },
  { id: 'image', label: '图片上传' },
];

export const FILE_STATUS = {
  IDLE: 'idle',
  PARSING: 'parsing',
  SUCCESS: 'success',
  ERROR: 'error',
};

export const SUPPORTED_TEXT_FILE_EXTENSIONS = ['.md', '.txt', '.json', '.csv'];
export const MAX_TEXT_FILE_SIZE = 10 * 1024 * 1024;

export function createEmptyFileState() {
  return {
    file: null,
    status: FILE_STATUS.IDLE,
    error: '',
    content: '',
  };
}

export function getTextFileExtension(fileName = '') {
  const lastDotIndex = fileName.lastIndexOf('.');
  return lastDotIndex >= 0 ? fileName.slice(lastDotIndex).toLowerCase() : '';
}

export function validateTextFileSelection(file) {
  if (!file) {
    return {
      isValid: false,
      error: '请选择要上传的文件。',
    };
  }

  const extension = getTextFileExtension(file.name);
  if (!SUPPORTED_TEXT_FILE_EXTENSIONS.includes(extension)) {
    return {
      isValid: false,
      error: `仅支持 ${SUPPORTED_TEXT_FILE_EXTENSIONS.join(', ')} 文件。`,
    };
  }

  if (file.size > MAX_TEXT_FILE_SIZE) {
    return {
      isValid: false,
      error: `文件大小不能超过 ${Math.round(MAX_TEXT_FILE_SIZE / 1024 / 1024)}MB。`,
    };
  }

  return {
    isValid: true,
    error: '',
  };
}

export function readTextFile(file) {
  return new Promise((resolve, reject) => {
    const validation = validateTextFileSelection(file);
    if (!validation.isValid) {
      reject(new Error(validation.error));
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const content = typeof event.target?.result === 'string' ? event.target.result.trim() : '';
      if (!content) {
        reject(new Error('文件内容为空。'));
        return;
      }

      resolve(content);
    };

    reader.onerror = () => {
      reject(new Error('文件读取失败。'));
    };

    reader.readAsText(file, 'UTF-8');
  });
}

export function buildImagePrompt(chartType = 'auto') {
  const chartTypeLabel = chartType && chartType !== 'auto'
    ? CHART_TYPES[chartType] ?? chartType
    : null;

  const summary = chartTypeLabel
    ? `请将图片内容转换为 ${chartTypeLabel} 类型的 draw.io 图表。`
    : '请先分析图片内容，再选择最合适的图表类型生成 draw.io 图表。';

  return `${summary}

请重点识别图片中的结构、文字、层级、流程与连接关系，保留关键语义，并输出清晰、可编辑的 draw.io mxGraph XML。`;
}

export function buildImageGenerationPayload(selectedImage, chartType = 'auto') {
  if (!selectedImage?.data || !selectedImage?.mimeType) {
    return null;
  }

  return {
    text: buildImagePrompt(chartType),
    image: {
      data: selectedImage.data,
      mimeType: selectedImage.mimeType,
    },
  };
}