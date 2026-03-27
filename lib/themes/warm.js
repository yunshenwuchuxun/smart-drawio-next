export const warmTheme = {
  id: 'warm',
  name: '暖色系',
  promptFragment: `## 暖色系绘图规范

### 配色规范
- **主色调**：大地琥珀色系（#FFEDD5 背景, #EA580C 强调），温暖自然风格
- **语义配色**：成功(#16A34A)、警告(#CA8A04)、错误(#DC2626)、信息(#2563EB)
- **对比度**：确保文字清晰可读
- **颜色格式**：所有颜色必须使用 6 位 Hex 格式（#RRGGBB），禁止 rgb()/hsl()/命名色

### 视觉风格
- 启用阴影效果（shadow=1）增加层次感
- 禁用渐变填充
- 使用圆角（arcSize=10）
- 线宽统一（strokeWidth=2）
- 字体：Arial，正文 11-13pt`,

  colorPalette: {
    bg: '#FFF7ED',
    surface: '#FFEDD5',
    primary: '#9A3412',
    accent: '#EA580C',
    text: '#431407',
    mutedText: '#78716C',
    success: '#16A34A',
    warning: '#CA8A04',
    error: '#DC2626',
    info: '#2563EB',
  },

  defaults: {
    shadow: true,
    gradient: false,
    arcSize: 10,
    strokeWidth: 2,
    fontFamily: 'Georgia, serif',
    fontSize: 13,
    fontStyle: 0,
    sketch: 0,
    edgeRounded: 1,
  },

  colorMapping: {
    '#FFFFFF': '#FFF7ED',
    '#F0F4F8': '#FFEDD5',
    '#1A1A2E': '#9A3412',
    '#0072B2': '#2563EB',
    '#009E73': '#16A34A',
    '#E69F00': '#CA8A04',
    '#D55E00': '#DC2626',
    '#56B4E9': '#EA580C',
    '#000000': '#431407',
  },
};
