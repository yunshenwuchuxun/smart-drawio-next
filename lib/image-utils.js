/**
 * 图片处理工具函数
 * 支持客户端图片验证、base64转换和元数据提取
 */

// 支持的图片格式
export const SUPPORTED_IMAGE_TYPES = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif'
};

// 最大文件大小(5MB)
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/**
 * 验证图片文件
 * @param {File} file - 图片文件
 * @returns {Object} { isValid: boolean, error?: string }
 */
export function validateImage(file) {
  // 检查文件类型
  if (!Object.keys(SUPPORTED_IMAGE_TYPES).includes(file.type)) {
    return {
      isValid: false,
      error: `不支持的图片格式。支持的格式：${Object.values(SUPPORTED_IMAGE_TYPES).join(', ')}`
    };
  }

  // 检查文件大小
  if (file.size > MAX_IMAGE_SIZE) {
    return {
      isValid: false,
      error: `图片大小不能超过 ${Math.round(MAX_IMAGE_SIZE / 1024 / 1024)}MB`
    };
  }

  return { isValid: true };
}

/**
 * 将图片文件转换为base64
 * @param {File} file - 图片文件
 * @returns {Promise<string>} base64字符串（不包含data:前缀）
 */
export function convertToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;
      // 移除data:image/xxx;base64,前缀，只返回base64数据
      const base64Data = result.split(',')[1];
      resolve(base64Data);
    };

    reader.onerror = () => {
      reject(new Error('图片读取失败'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * 获取图片的base64 URL（用于预览）
 * @param {File} file - 图片文件
 * @returns {Promise<string>} 完整的data URL
 */
export function getImagePreviewUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = () => {
      reject(new Error('图片预览失败'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * 获取图片尺寸信息
 * @param {File} file - 图片文件
 * @returns {Promise<{width: number, height: number}>} 图片尺寸
 */
export function getImageDimensions(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const dimensions = {
        width: img.width,
        height: img.height
      };
      URL.revokeObjectURL(url);
      resolve(dimensions);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('无法读取图片尺寸'));
    };

    img.src = url;
  });
}

/**
 * 格式化文件大小显示
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的大小
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 获取文件的扩展名
 * @param {File} file - 文件对象
 * @returns {string} 扩展名
 */
export function getFileExtension(file) {
  return SUPPORTED_IMAGE_TYPES[file.type] || 'unknown';
}

/**
 * 创建图片对象用于API调用
 * @param {File} file - 图片文件
 * @returns {Promise<Object>} { data: string, mimeType: string }
 */
export async function createImageObject(file) {
  const validation = validateImage(file);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  try {
    const [base64Data, dimensions] = await Promise.all([
      convertToBase64(file),
      getImageDimensions(file)
    ]);

    return {
      data: base64Data,
      mimeType: file.type,
      dimensions,
      size: file.size,
      name: file.name
    };
  } catch (error) {
    throw new Error(`图片处理失败: ${error.message}`);
  }
}

/**
 * 生成图片描述提示词
 * @param {string} chartType - 图表类型
 * @returns {string} 针对图片的提示词
 */
export function generateImagePrompt(chartType) {
  const chartTypeText = chartType && chartType !== 'auto'
    ? `请将图片内容转换为${getChartTypeName(chartType)}类型的draw.io图表。`
    : '请分析图片内容并选择合适的图表类型转换为draw.io图表。';

  return `${chartTypeText}

请仔细分析图片中的：
1. 文字内容和标签
2. 图形元素和结构
3. 流程或连接关系
4. 布局和层次关系
5. 数据或数值信息

基于分析结果，创建清晰、准确、符合学术论文标准的draw.io图表，确保：
- 保留图片中的所有关键信息
- 使用合适的图表类型展示内容
- 保持逻辑关系和结构
- 添加必要的文字说明
- 输出标准的draw.io mxGraph XML格式`;
}

/**
 * 获取图表类型名称
 * @param {string} chartType - 图表类型代码
 * @returns {string} 图表类型中文名
 */
function getChartTypeName(chartType) {
  const typeNames = {
    flowchart: '流程图',
    mindmap: '思维导图',
    orgchart: '组织架构图',
    sequence: '时序图',
    class: 'UML类图',
    er: 'ER图',
    gantt: '甘特图',
    timeline: '时间线',
    tree: '树形图',
    network: '网络拓扑图',
    architecture: '架构图',
    dataflow: '数据流图',
    state: '状态图',
    swimlane: '泳道图',
    concept: '概念图',
    fishbone: '鱼骨图',
    swot: 'SWOT分析图',
    pyramid: '金字塔图',
    funnel: '漏斗图',
    venn: '韦恩图',
    matrix: '矩阵图',
    infographic: '信息图',
  };

  return typeNames[chartType] || '自动';
}