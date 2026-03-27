export const OPTIMIZATION_SUGGESTIONS = [
  { id: 'layout', label: '统一布局方向', description: '统一主要流程方向，例如自上而下或从左到右。' },
  { id: 'merge', label: '合并重复元素', description: '识别并合并重复或语义重叠的节点与容器。' },
  { id: 'edge', label: '规范连接线样式', description: '统一连接线箭头、粗细、标签和字体大小。' },
  { id: 'text', label: '优化文本换行', description: '改善节点内文字换行，提升可读性。' },
  { id: 'style', label: '统一元素样式', description: '统一同类元素的颜色、边框、字体与圆角。' },
  { id: 'container', label: '调整容器层级', description: '优化泳道或容器的嵌套结构与层级关系。' },
  { id: 'simplify', label: '精简冗余节点', description: '删除非必要节点，合并重复表达。' },
  { id: 'annotation', label: '添加注释标注', description: '补充必要的编号、说明或图例注释。' },
  { id: 'shadow', label: '添加阴影效果', description: '为关键节点添加适度阴影，增强层次感。' },
  { id: 'gradient', label: '添加渐变填充', description: '为重点区域加入克制的渐变填充。' },
  { id: 'rounded', label: '优化圆角样式', description: '统一圆角半径，使整体更现代。' },
  { id: 'legend', label: '自动生成图例', description: '若缺失图例，则补充简洁明确的图例说明。' },
  { id: 'colorblind', label: '色盲友好检查', description: '检查配色对比，避免红绿组合导致辨识困难。' },
  { id: 'grid', label: '网格对齐验证', description: '检查节点与连接线是否按统一网格对齐。' },
  { id: 'spacing', label: '优化留白边距', description: '调整元素间距与图表边距，减少拥挤感。' },
  { id: 'labelBg', label: '专业标注样式', description: '为连接线标签添加背景和边框，提高可读性。' },
];

export function buildOptimizationSuggestions(selectedIds = [], customSuggestion = '') {
  const presetSuggestions = selectedIds
    .map((id) => OPTIMIZATION_SUGGESTIONS.find((item) => item.id === id))
    .filter(Boolean)
    .map((item) => `${item.label}：${item.description}`);

  const custom = customSuggestion.trim();
  return custom ? [...presetSuggestions, custom] : presetSuggestions;
}
