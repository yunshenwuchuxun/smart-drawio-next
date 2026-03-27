import { applyStyleRules, collectRuleChangeKeys } from './theme-engine';

const wrapLabelsRules = [
  {
    selector: { hasValue: true },
    changes: { html: '1', whiteSpace: 'wrap' },
  },
];

const centerTextRules = [
  {
    selector: { hasValue: true },
    changes: { align: 'center', verticalAlign: 'middle' },
  },
];

const textPanelRules = [
  {
    selector: { hasValue: true },
    changes: {
      labelBackgroundColor: '#ffffff',
      labelBorderColor: '#d0d7de',
    },
  },
];

const boldTextRules = [
  {
    selector: { hasValue: true },
    changes: {
      fontStyle: (styleObj) => String((parseInt(styleObj.fontStyle || '0') | 1)),
    },
  },
];

const compactTextRules = [
  {
    selector: { hasValue: true },
    changes: { fontSize: '11' },
  },
];

const textPaddingRules = [
  {
    selector: { hasValue: true },
    changes: {
      spacing: '6',
      spacingTop: '4',
      spacingBottom: '4',
      spacingLeft: '8',
      spacingRight: '8',
    },
  },
];

export const textStyleTools = {
  wrapLabels: {
    id: 'wrapLabels',
    name: '自动换行',
    description: '为所有带文字元素启用 html=1 与 whiteSpace=wrap。',
    scope: 'global',
    resetKeys: collectRuleChangeKeys(wrapLabelsRules),
    apply: wrapLabels,
  },
  centerText: {
    id: 'centerText',
    name: '文本居中',
    description: '统一文本水平/垂直居中，适合流程图与卡片节点。',
    scope: 'global',
    resetKeys: collectRuleChangeKeys(centerTextRules),
    apply: centerText,
  },
  textPanels: {
    id: 'textPanels',
    name: '文本衬底',
    description: '给所有标签增加白底与浅边框，提升复杂图可读性。',
    scope: 'global',
    resetKeys: collectRuleChangeKeys(textPanelRules),
    apply: textPanels,
  },
  boldText: {
    id: 'boldText',
    name: '文本加粗',
    description: '所有有文字的元素设为粗体。',
    scope: 'global',
    resetKeys: ['fontStyle'],
    apply: boldText,
  },
  compactText: {
    id: 'compactText',
    name: '缩小字号',
    description: '所有文字统一设为 11px，适合密集图表。',
    scope: 'global',
    resetKeys: collectRuleChangeKeys(compactTextRules),
    apply: compactText,
  },
  textPadding: {
    id: 'textPadding',
    name: '文本间距',
    description: '增加文本与形状边界的间距，呼吸感更好。',
    scope: 'global',
    resetKeys: collectRuleChangeKeys(textPaddingRules),
    apply: textPadding,
  },
};

export function wrapLabels(xml) {
  return applyStyleRules(xml, wrapLabelsRules, {
    success: (modified) => `已为 ${modified} 个文本元素开启自动换行`,
    empty: '没有带文本的元素需要处理',
  });
}

export function centerText(xml) {
  return applyStyleRules(xml, centerTextRules, {
    success: (modified) => `已为 ${modified} 个文本元素设置居中`,
    empty: '没有带文本的元素需要处理',
  });
}

export function textPanels(xml) {
  return applyStyleRules(xml, textPanelRules, {
    success: (modified) => `已为 ${modified} 个文本元素添加衬底`,
    empty: '没有带文本的元素需要处理',
  });
}

export function boldText(xml) {
  return applyStyleRules(xml, boldTextRules, {
    success: (modified) => `已为 ${modified} 个文本元素设置粗体`,
    empty: '没有带文本的元素需要处理',
  });
}

export function compactText(xml) {
  return applyStyleRules(xml, compactTextRules, {
    success: (modified) => `已将 ${modified} 个文本元素字号设为 11px`,
    empty: '没有带文本的元素需要处理',
  });
}

export function textPadding(xml) {
  return applyStyleRules(xml, textPaddingRules, {
    success: (modified) => `已为 ${modified} 个文本元素增加间距`,
    empty: '没有带文本的元素需要处理',
  });
}

export function applyTextStyleTool(xml, toolId) {
  const tool = textStyleTools[toolId];
  if (!tool) return { xml, error: `Unknown text style tool: ${toolId}` };
  return tool.apply(xml);
}
