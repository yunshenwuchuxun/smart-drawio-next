import { applyStyleRules, collectRuleChangeKeys } from './theme-engine';

const researchCleanRules = [
  {
    selector: { hasValue: true },
    changes: {
      html: '1',
      whiteSpace: 'wrap',
      align: 'center',
      verticalAlign: 'middle',
      fontSize: '12',
      fontStyle: '0',
    },
  },
  {
    selector: { appliesTo: 'vertices' },
    changes: {
      rounded: '0',
      arcSize: null,
      shadow: null,
      glass: null,
      sketch: null,
      gradientColor: null,
      gradientDirection: null,
      dashed: null,
      dashPattern: null,
      fillOpacity: '100',
      strokeWidth: '2',
    },
  },
  {
    selector: { appliesTo: 'edges' },
    changes: {
      edgeStyle: 'orthogonalEdgeStyle',
      orthogonalLoop: '1',
      jettySize: 'auto',
      curved: null,
      dashed: null,
      dashPattern: null,
      strokeWidth: '2',
      endArrow: 'classicBlock',
    },
  },
];

const presentationCardsRules = [
  {
    selector: { hasValue: true },
    changes: {
      html: '1',
      whiteSpace: 'wrap',
      align: 'center',
      verticalAlign: 'middle',
      fontSize: '13',
    },
  },
  {
    selector: { appliesTo: 'vertices' },
    changes: {
      rounded: '1',
      arcSize: '12',
      shadow: '1',
      glass: null,
      sketch: null,
      fillOpacity: '100',
      strokeWidth: '2',
    },
  },
  {
    selector: { appliesTo: 'edges' },
    changes: {
      curved: '1',
      edgeStyle: null,
      orthogonalLoop: null,
      jettySize: null,
      dashed: null,
      dashPattern: null,
      strokeWidth: '2',
      endArrow: 'classicBlock',
    },
  },
];

const flatMinimalRules = [
  {
    selector: { hasValue: true },
    changes: { fontSize: '12', fontStyle: '0' },
  },
  {
    selector: { appliesTo: 'vertices' },
    changes: {
      shadow: null,
      glass: null,
      sketch: null,
      gradientColor: null,
      gradientDirection: null,
      rounded: '0',
      strokeWidth: '1',
      fillOpacity: '100',
      dashed: null,
      dashPattern: null,
    },
  },
  {
    selector: { appliesTo: 'edges' },
    changes: {
      strokeWidth: '1',
      endArrow: 'classic',
      dashed: null,
      dashPattern: null,
      curved: null,
      edgeStyle: null,
      jumpStyle: null,
    },
  },
];

const comicWhiteboardRules = [
  {
    selector: { hasValue: true },
    changes: { fontStyle: '0' },
  },
  {
    selector: { appliesTo: 'vertices' },
    changes: {
      sketch: '1',
      comic: '1',
      jiggle: '2',
      curveFitting: '1',
      shadow: '1',
      rounded: '1',
      arcSize: '12',
      strokeWidth: '3',
      glass: null,
      gradientColor: null,
    },
  },
  {
    selector: { appliesTo: 'edges' },
    changes: {
      sketch: '1',
      comic: '1',
      jiggle: '1',
      strokeWidth: '2',
      curved: '1',
      endArrow: 'open',
      edgeStyle: null,
      orthogonalLoop: null,
      jettySize: null,
    },
  },
];

const watercolorSketchRules = [
  {
    selector: { hasValue: true },
    changes: { fontStyle: '0' },
  },
  {
    selector: { appliesTo: 'vertices' },
    changes: {
      sketch: '1',
      fillStyle: 'hachure',
      fillWeight: '3',
      hachureGap: '4',
      rounded: '1',
      arcSize: '12',
      strokeWidth: '2',
      shadow: null,
      glass: null,
      gradientColor: null,
      gradientDirection: null,
    },
  },
  {
    selector: { appliesTo: 'edges' },
    changes: {
      sketch: '1',
      strokeWidth: '2',
      curved: '1',
      endArrow: 'open',
      endFill: '0',
      edgeStyle: null,
      orthogonalLoop: null,
      jettySize: null,
    },
  },
];

const minimalOutlineRules = [
  {
    selector: { hasValue: true },
    changes: { fontSize: '11', fontStyle: '0' },
  },
  {
    selector: { appliesTo: 'vertices' },
    changes: {
      fillColor: 'none',
      strokeWidth: '1',
      rounded: '0',
      shadow: null,
      glass: null,
      sketch: null,
      gradientColor: null,
      gradientDirection: null,
      fillOpacity: null,
      dashed: null,
      dashPattern: null,
    },
  },
  {
    selector: { appliesTo: 'edges' },
    changes: {
      strokeWidth: '1',
      endArrow: 'open',
      endFill: '0',
      dashed: null,
      dashPattern: null,
      sketch: null,
    },
  },
];

const stickyNotesRules = [
  {
    selector: { hasValue: true },
    changes: {
      html: '1',
      whiteSpace: 'wrap',
      fontSize: '13',
      fontStyle: '1',
      spacing: '4',
    },
  },
  {
    selector: { appliesTo: 'vertices' },
    changes: {
      rounded: '1',
      arcSize: '16',
      shadow: '1',
      fillOpacity: '90',
      strokeWidth: '1',
      glass: null,
      sketch: null,
      gradientColor: null,
      gradientDirection: null,
    },
  },
  {
    selector: { appliesTo: 'edges' },
    changes: {
      curved: '1',
      strokeWidth: '1',
      endArrow: 'classic',
      edgeStyle: null,
      orthogonalLoop: null,
      jettySize: null,
      dashed: null,
      dashPattern: null,
    },
  },
];

const blueprintTechRules = [
  {
    selector: { hasValue: true },
    changes: { fontSize: '11', fontStyle: '0' },
  },
  {
    selector: { appliesTo: 'vertices' },
    changes: {
      rounded: '0',
      dashed: '1',
      fixDash: '1',
      dashPattern: '6 4',
      strokeWidth: '1',
      fillOpacity: '30',
      shadow: null,
      glass: null,
      sketch: null,
      gradientColor: null,
      gradientDirection: null,
    },
  },
  {
    selector: { appliesTo: 'edges' },
    changes: {
      edgeStyle: 'orthogonalEdgeStyle',
      orthogonalLoop: '1',
      jettySize: 'auto',
      strokeWidth: '1',
      dashed: '1',
      fixDash: '1',
      dashPattern: '6 4',
      endArrow: 'block',
      endFill: '1',
      curved: null,
      sketch: null,
    },
  },
];

const businessCleanRules = [
  {
    selector: { hasValue: true },
    changes: { fontStyle: '1', align: 'center' },
  },
  {
    selector: { appliesTo: 'vertices' },
    changes: {
      rounded: '1',
      arcSize: '8',
      shadow: '1',
      strokeWidth: '2',
      fillOpacity: '100',
      glass: null,
      sketch: null,
      gradientColor: null,
      dashed: null,
    },
  },
  {
    selector: { appliesTo: 'edges' },
    changes: {
      edgeStyle: 'orthogonalEdgeStyle',
      orthogonalLoop: '1',
      jettySize: 'auto',
      rounded: '1',
      strokeWidth: '2',
      endArrow: 'block',
      endFill: '1',
      curved: null,
      dashed: null,
      sketch: null,
    },
  },
];

const wireframeRules = [
  {
    selector: { hasValue: true },
    changes: {
      html: '1',
      whiteSpace: 'wrap',
      fontSize: '12',
      fontStyle: '0',
    },
  },
  {
    selector: { appliesTo: 'vertices' },
    changes: {
      rounded: '0',
      arcSize: null,
      shadow: null,
      glass: null,
      sketch: null,
      gradientColor: null,
      gradientDirection: null,
      fillOpacity: '20',
      strokeWidth: '1',
    },
  },
  {
    selector: { appliesTo: 'edges' },
    changes: {
      curved: null,
      edgeStyle: 'orthogonalEdgeStyle',
      orthogonalLoop: '1',
      jettySize: 'auto',
      dashed: '1',
      dashPattern: '6 6',
      strokeWidth: '1',
    },
  },
];

export const stylePacks = {
  researchClean: {
    id: 'researchClean',
    name: '科研清爽',
    description: '去掉装饰性效果，统一为论文风的清晰折线与规整文本。',
    scope: 'global',
    resetKeys: collectRuleChangeKeys(researchCleanRules),
    apply: applyResearchClean,
  },
  presentationCards: {
    id: 'presentationCards',
    name: '演示卡片',
    description: '为节点增加层次感，并让连线更适合投影与汇报展示。',
    scope: 'global',
    resetKeys: collectRuleChangeKeys(presentationCardsRules),
    apply: applyPresentationCards,
  },
  wireframe: {
    id: 'wireframe',
    name: '线框草图',
    description: '保留结构，弱化视觉装饰，适合先讨论布局与信息层级。',
    scope: 'global',
    resetKeys: collectRuleChangeKeys(wireframeRules),
    apply: applyWireframe,
  },
  flatMinimal: {
    id: 'flatMinimal',
    name: '扁平极简',
    description: '现代扁平设计，去除一切装饰效果。',
    scope: 'global',
    resetKeys: collectRuleChangeKeys(flatMinimalRules),
    apply: applyFlatMinimal,
  },
  comicWhiteboard: {
    id: 'comicWhiteboard',
    name: '漫画白板',
    description: '轻松非正式的白板讨论风格。',
    scope: 'global',
    resetKeys: collectRuleChangeKeys(comicWhiteboardRules),
    apply: applyComicWhiteboard,
  },
  businessClean: {
    id: 'businessClean',
    name: '商务简约',
    description: '正式商务汇报风格，圆角 + 阴影 + 正交连线。',
    scope: 'global',
    resetKeys: collectRuleChangeKeys(businessCleanRules),
    apply: applyBusinessClean,
  },
  watercolorSketch: {
    id: 'watercolorSketch',
    name: '水彩手绘',
    description: '手绘斜线填充 + 圆角 + 曲线连线，艺术感草图风。',
    scope: 'global',
    resetKeys: collectRuleChangeKeys(watercolorSketchRules),
    apply: applyWatercolorSketch,
  },
  minimalOutline: {
    id: 'minimalOutline',
    name: '极简线条',
    description: '无填充纯线框，只保留结构轮廓与文字。',
    scope: 'global',
    resetKeys: collectRuleChangeKeys(minimalOutlineRules),
    apply: applyMinimalOutline,
  },
  stickyNotes: {
    id: 'stickyNotes',
    name: '便签卡片',
    description: '大圆角 + 柔和阴影 + 曲线箭头，便签纸条风格。',
    scope: 'global',
    resetKeys: collectRuleChangeKeys(stickyNotesRules),
    apply: applyStickyNotes,
  },
  blueprintTech: {
    id: 'blueprintTech',
    name: '蓝图技术',
    description: '固定虚线 + 低透明度填充 + 正交连线，工程蓝图风。',
    scope: 'global',
    resetKeys: collectRuleChangeKeys(blueprintTechRules),
    apply: applyBlueprintTech,
  },
};

export function applyResearchClean(xml) {
  return applyStyleRules(xml, researchCleanRules, {
    success: (modified) => `已将 ${modified} 个元素切换为科研清爽风格`,
    empty: '没有元素需要调整',
  });
}

export function applyPresentationCards(xml) {
  return applyStyleRules(xml, presentationCardsRules, {
    success: (modified) => `已将 ${modified} 个元素切换为演示卡片风格`,
    empty: '没有元素需要调整',
  });
}

export function applyWireframe(xml) {
  return applyStyleRules(xml, wireframeRules, {
    success: (modified) => `已将 ${modified} 个元素切换为线框草图风格`,
    empty: '没有元素需要调整',
  });
}

export function applyFlatMinimal(xml) {
  return applyStyleRules(xml, flatMinimalRules, {
    success: (modified) => `已将 ${modified} 个元素切换为扁平极简风格`,
    empty: '没有元素需要调整',
  });
}

export function applyComicWhiteboard(xml) {
  return applyStyleRules(xml, comicWhiteboardRules, {
    success: (modified) => `已将 ${modified} 个元素切换为漫画白板风格`,
    empty: '没有元素需要调整',
  });
}

export function applyBusinessClean(xml) {
  return applyStyleRules(xml, businessCleanRules, {
    success: (modified) => `已将 ${modified} 个元素切换为商务简约风格`,
    empty: '没有元素需要调整',
  });
}

export function applyWatercolorSketch(xml) {
  return applyStyleRules(xml, watercolorSketchRules, {
    success: (modified) => `已将 ${modified} 个元素切换为水彩手绘风格`,
    empty: '没有元素需要调整',
  });
}

export function applyMinimalOutline(xml) {
  return applyStyleRules(xml, minimalOutlineRules, {
    success: (modified) => `已将 ${modified} 个元素切换为极简线条风格`,
    empty: '没有元素需要调整',
  });
}

export function applyStickyNotes(xml) {
  return applyStyleRules(xml, stickyNotesRules, {
    success: (modified) => `已将 ${modified} 个元素切换为便签卡片风格`,
    empty: '没有元素需要调整',
  });
}

export function applyBlueprintTech(xml) {
  return applyStyleRules(xml, blueprintTechRules, {
    success: (modified) => `已将 ${modified} 个元素切换为蓝图技术风格`,
    empty: '没有元素需要调整',
  });
}

export function applyStylePack(xml, packId) {
  const pack = stylePacks[packId];
  if (!pack) return { xml, error: `Unknown style pack: ${packId}` };
  return pack.apply(xml);
}
