export const violetTheme = {
  id: 'violet',
  name: '紫罗兰系',
  promptFragment: `## 紫罗兰系绘图规范

### 配色规范
- **主色调**：Figma 创意紫色系（#EDE9FE 背景, #EC4899 强调），创意高端风格
- **语义配色**：成功(#2DD4BF)、警告(#FBBF24)、错误(#F87171)、信息(#818CF8)
- **对比度**：确保文字清晰可读
- **颜色格式**：所有颜色必须使用 6 位 Hex 格式（#RRGGBB），禁止 rgb()/hsl()/命名色

### 视觉风格
- 启用阴影效果（shadow=1）增加层次感
- 禁用渐变填充
- 使用圆角（arcSize=10）
- 线宽统一（strokeWidth=2）
- 字体：Arial，正文 11-13pt`,

  colorPalette: {
    bg: '#FAF5FF',
    surface: '#EDE9FE',
    primary: '#6D28D9',
    accent: '#EC4899',
    text: '#2E1065',
    mutedText: '#7E6C9A',
    success: '#2DD4BF',
    warning: '#FBBF24',
    error: '#F87171',
    info: '#818CF8',
  },

  defaults: {
    shadow: true,
    gradient: false,
    arcSize: 10,
    strokeWidth: 2,
    fontFamily: 'Poppins, sans-serif',
    fontSize: 13,
    fontStyle: 0,
    sketch: 0,
    edgeStyle: 'orthogonalEdgeStyle',
    edgeRounded: 1,
  },

  colorMapping: {
    '#FFFFFF': '#FAF5FF',
    '#F0F4F8': '#EDE9FE',
    '#1A1A2E': '#6D28D9',
    '#0072B2': '#818CF8',
    '#009E73': '#2DD4BF',
    '#E69F00': '#FBBF24',
    '#D55E00': '#F87171',
    '#56B4E9': '#EC4899',
    '#000000': '#2E1065',
  },
};
