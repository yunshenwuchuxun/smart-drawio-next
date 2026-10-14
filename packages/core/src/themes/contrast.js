export const contrastTheme = {
  id: 'contrast',
  name: '高对比度',
  promptFragment: `## 高对比度绘图规范

### 配色规范
- **主色调**：纯黑白配色（#FFFFFF 背景, #000000 边框），极简打印友好
- **语义配色**：成功(#008000)、警告(#FFB000)、错误(#C00000)、信息(#0000FF)，高饱和度保证辨识
- **对比度**：最大化黑白对比，适合无障碍访问
- **颜色格式**：所有颜色必须使用 6 位 Hex 格式（#RRGGBB），禁止 rgb()/hsl()/命名色

### 视觉风格
- 禁用阴影效果（shadow=0）
- 禁用渐变填充
- 使用直角（arcSize=0）
- 线宽统一（strokeWidth=2）
- 字体：Arial，正文 11-13pt`,

  colorPalette: {
    bg: '#FFFFFF',
    surface: '#FFFFFF',
    primary: '#000000',
    accent: '#000000',
    text: '#000000',
    mutedText: '#000000',
    success: '#008000',
    warning: '#FFB000',
    error: '#C00000',
    info: '#0000FF',
  },

  defaults: {
    shadow: false,
    gradient: false,
    arcSize: 0,
    strokeWidth: 2,
    fontFamily: 'Arial, sans-serif',
    fontSize: 12,
    fontStyle: 0,
    sketch: 0,
    edgeStyle: 'orthogonalEdgeStyle',
    edgeRounded: 0,
  },

  colorMapping: {
    '#FFFFFF': '#FFFFFF',
    '#F0F4F8': '#FFFFFF',
    '#1A1A2E': '#000000',
    '#0072B2': '#000000',
    '#009E73': '#FFFFFF',
    '#E69F00': '#FFFFFF',
    '#D55E00': '#FFFFFF',
    '#56B4E9': '#FFFFFF',
    '#000000': '#000000',
  },
};
