export const coolTheme = {
  id: 'cool',
  name: '冷色系',
  promptFragment: `## 冷色系绘图规范

### 配色规范
- **主色调**：IBM 碳素青色系（#CCFBF1 背景, #0D9488 强调），冷静专业风格
- **语义配色**：成功(#10B981)、警告(#F59E0B)、错误(#EF4444)、信息(#0891B2)
- **对比度**：确保文字清晰可读
- **颜色格式**：所有颜色必须使用 6 位 Hex 格式（#RRGGBB），禁止 rgb()/hsl()/命名色

### 视觉风格
- 禁用阴影效果（shadow=0）
- 禁用渐变填充
- 使用直角（arcSize=0）
- 线宽统一（strokeWidth=2）
- 字体：Arial，正文 11-13pt`,

  colorPalette: {
    bg: '#F0FDFA',
    surface: '#CCFBF1',
    primary: '#134E4A',
    accent: '#0D9488',
    text: '#042F2E',
    mutedText: '#5C7A80',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#0891B2',
  },

  defaults: {
    shadow: false,
    gradient: false,
    arcSize: 0,
    strokeWidth: 1.5,
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 12,
    fontStyle: 0,
    sketch: 0,
    edgeStyle: 'orthogonalEdgeStyle',
    edgeRounded: 0,
  },

  colorMapping: {
    '#FFFFFF': '#F0FDFA',
    '#F0F4F8': '#CCFBF1',
    '#1A1A2E': '#134E4A',
    '#0072B2': '#0891B2',
    '#009E73': '#10B981',
    '#E69F00': '#F59E0B',
    '#D55E00': '#EF4444',
    '#56B4E9': '#0D9488',
    '#000000': '#042F2E',
  },
};
