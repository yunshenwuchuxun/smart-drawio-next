export const forestTheme = {
  id: 'forest',
  name: '森林绿系',
  promptFragment: `## 森林绿系绘图规范

### 配色规范
- **主色调**：翡翠密林色系（#DCFCE7 背景, #65A30D 强调），自然健康风格
- **语义配色**：成功(#22C55E)、警告(#EAB308)、错误(#DC2626)、信息(#0D9488)
- **对比度**：确保文字清晰可读
- **颜色格式**：所有颜色必须使用 6 位 Hex 格式（#RRGGBB），禁止 rgb()/hsl()/命名色

### 视觉风格
- 禁用阴影效果（shadow=0）
- 禁用渐变填充
- 使用直角（arcSize=0）
- 线宽统一（strokeWidth=2）
- 字体：Arial，正文 11-13pt`,

  colorPalette: {
    bg: '#F0FDF4',
    surface: '#DCFCE7',
    primary: '#166534',
    accent: '#65A30D',
    text: '#14532D',
    mutedText: '#52675B',
    success: '#22C55E',
    warning: '#EAB308',
    error: '#DC2626',
    info: '#0D9488',
  },

  defaults: {
    shadow: false,
    gradient: false,
    arcSize: 0,
    strokeWidth: 1.5,
    fontFamily: 'Lato, sans-serif',
    fontSize: 12,
    fontStyle: 0,
    sketch: 0,
    edgeStyle: 'orthogonalEdgeStyle',
    edgeRounded: 0,
  },

  colorMapping: {
    '#FFFFFF': '#F0FDF4',
    '#F0F4F8': '#DCFCE7',
    '#1A1A2E': '#166534',
    '#0072B2': '#0D9488',
    '#009E73': '#22C55E',
    '#E69F00': '#EAB308',
    '#D55E00': '#DC2626',
    '#56B4E9': '#65A30D',
    '#000000': '#14532D',
  },
};
