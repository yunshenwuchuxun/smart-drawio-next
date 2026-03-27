export function darkenColor(hex) {
  if (!hex || !hex.startsWith('#') || hex.length !== 7) return hex;
  const r = Math.floor(parseInt(hex.slice(1, 3), 16) * 0.8);
  const g = Math.floor(parseInt(hex.slice(3, 5), 16) * 0.8);
  const b = Math.floor(parseInt(hex.slice(5, 7), 16) * 0.8);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export const stylePresets = {
  shadow: {
    id: 'shadow',
    name: '阴影效果',
    description: '为形状添加投影，连线保持不变。',
    appliesTo: 'vertices',
    styleChanges: { shadow: '1' },
    disableChanges: { shadow: null },
  },
  gradient: {
    id: 'gradient',
    name: '渐变填充',
    description: '根据当前填充色自动生成向下渐变。',
    appliesTo: 'vertices',
    styleChanges: {
      gradientDirection: 'south',
      gradientColor: (style) => {
        const fill = style.fillColor;
        return fill ? darkenColor(fill) : null;
      },
    },
    disableChanges: { gradientColor: null, gradientDirection: null },
  },
  rounded: {
    id: 'rounded',
    name: '圆角样式',
    description: '为节点启用圆角边框。',
    appliesTo: 'vertices',
    styleChanges: { arcSize: '10', rounded: '1' },
    disableChanges: { arcSize: null, rounded: null },
  },
  glass: {
    id: 'glass',
    name: '玻璃效果',
    description: '为节点添加 draw.io 玻璃高光。',
    appliesTo: 'vertices',
    styleChanges: { glass: '1' },
    disableChanges: { glass: null },
  },
  sketch: {
    id: 'sketch',
    name: '手绘风格',
    description: '开启 draw.io 的 rough sketch 手绘效果。',
    appliesTo: 'all',
    styleChanges: { sketch: '1' },
    disableChanges: { sketch: null },
  },
  dashed: {
    id: 'dashed',
    name: '虚线描边',
    description: '统一改为虚线边框/连线，适合辅助区域与说明关系。',
    appliesTo: 'all',
    styleChanges: { dashed: '1', dashPattern: '8 8' },
    disableChanges: { dashed: null, dashPattern: null },
  },
  transparent: {
    id: 'transparent',
    name: '透明填充',
    description: '降低节点填充不透明度，适合线框图与轻量卡片。',
    appliesTo: 'vertices',
    styleChanges: { fillOpacity: '70' },
    disableChanges: { fillOpacity: null },
  },
  boldStroke: {
    id: 'boldStroke',
    name: '粗线描边',
    description: '所有形状和连线加粗到 3px，视觉更醒目。',
    appliesTo: 'all',
    styleChanges: { strokeWidth: '3' },
    disableChanges: { strokeWidth: null },
  },
  comic: {
    id: 'comic',
    name: '漫画风格',
    description: '比手绘更卡通化，线条有轻微抖动但更可控。',
    appliesTo: 'all',
    styleChanges: { sketch: '1', comic: '1', jiggle: '2', curveFitting: '1' },
    disableChanges: { sketch: null, comic: null, jiggle: null, curveFitting: null },
  },
  noStroke: {
    id: 'noStroke',
    name: '无边框',
    description: '移除形状描边，只剩填充色块，现代扁平风格。',
    appliesTo: 'vertices',
    styleChanges: { strokeColor: 'none' },
    disableChanges: { strokeColor: null },
  },
  absoluteArc: {
    id: 'absoluteArc',
    name: '等宽圆角',
    description: '圆角使用绝对像素值，所有形状圆角大小统一。',
    appliesTo: 'vertices',
    styleChanges: { rounded: '1', absoluteArcSize: '1', arcSize: '12' },
    disableChanges: { absoluteArcSize: null, arcSize: null },
  },
  crossHatch: {
    id: 'crossHatch',
    name: '交叉填充',
    description: '形状使用交叉斜线图案填充，适合技术图纸与手绘风。',
    appliesTo: 'vertices',
    styleChanges: { sketch: '1', fillStyle: 'cross-hatch', hachureGap: '4' },
    disableChanges: { sketch: null, fillStyle: null, hachureGap: null },
  },
  dotFill: {
    id: 'dotFill',
    name: '点状填充',
    description: '形状使用散点图案填充，呈现点描画效果。',
    appliesTo: 'vertices',
    styleChanges: { sketch: '1', fillStyle: 'dots', hachureGap: '6' },
    disableChanges: { sketch: null, fillStyle: null, hachureGap: null },
  },
  zigzagFill: {
    id: 'zigzagFill',
    name: '锯齿填充',
    description: '形状使用锯齿线条填充，活泼有趣的视觉效果。',
    appliesTo: 'vertices',
    styleChanges: { sketch: '1', fillStyle: 'zigzag', hachureGap: '8' },
    disableChanges: { sketch: null, fillStyle: null, hachureGap: null },
  },
  semiOpaque: {
    id: 'semiOpaque',
    name: '半透明',
    description: '整体降低不透明度，适合叠层图与背景辅助元素。',
    appliesTo: 'all',
    styleChanges: { opacity: '75' },
    disableChanges: { opacity: null },
  },
  fadeStroke: {
    id: 'fadeStroke',
    name: '描边渐隐',
    description: '降低描边不透明度，营造轻盈淡雅的线条效果。',
    appliesTo: 'all',
    styleChanges: { strokeOpacity: '40' },
    disableChanges: { strokeOpacity: null },
  },
  fixedDash: {
    id: 'fixedDash',
    name: '固定虚线',
    description: '虚线图案不随缩放拉伸，缩放时保持一致的间距。',
    appliesTo: 'all',
    styleChanges: { dashed: '1', fixDash: '1', dashPattern: '8 8' },
    disableChanges: { dashed: null, fixDash: null, dashPattern: null },
  },
  openArrow: {
    id: 'openArrow',
    name: '空心箭头',
    description: '连线使用空心三角箭头，更轻盈的指向效果。',
    appliesTo: 'edges',
    styleChanges: { endArrow: 'open', endFill: '0' },
    disableChanges: { endArrow: null, endFill: null },
  },
};

export const PRESET_IDS = Object.keys(stylePresets);

const EMPTY_PRESET_STATE = PRESET_IDS.reduce((acc, presetId) => {
  acc[presetId] = false;
  return acc;
}, {});

const PRESET_DEFAULTS = {
  research: { shadow: false, gradient: false, rounded: false, glass: false },
  business: { shadow: true, rounded: true },
  warm: { shadow: true, rounded: true },
  cool: {},
  dark: { shadow: true, rounded: true },
  contrast: {},
  pastel: { rounded: true },
  forest: {},
  violet: { shadow: true, rounded: true },
  neutral: {},
};

export function getPresetDefaults(themeId) {
  return { ...EMPTY_PRESET_STATE, ...(PRESET_DEFAULTS[themeId] || {}) };
}
