export const neutralTheme = {
  id: 'neutral',
  name: '中性灰阶',
  promptFragment: `## 中性灰阶绘图规范

### 配色规范
- **主色调**：Vercel 瑞士极简色系（#E5E5E5 背景, #525252 强调），稳重通用风格
- **语义配色**：成功(#22C55E)、警告(#EAB308)、错误(#EF4444)、信息(#3B82F6)
- **对比度**：确保文字清晰可读
- **颜色格式**：所有颜色必须使用 6 位 Hex 格式（#RRGGBB），禁止 rgb()/hsl()/命名色

### 视觉风格
- 禁用阴影效果（shadow=0）
- 禁用渐变填充
- 使用直角（arcSize=0）
- 线宽统一（strokeWidth=2）
- 字体：Arial，正文 11-13pt`,

  colorPalette: {
    bg: '#FAFAFA',
    surface: '#E5E5E5',
    primary: '#171717',
    accent: '#525252',
    text: '#0A0A0A',
    mutedText: '#737373',
    success: '#22C55E',
    warning: '#EAB308',
    error: '#EF4444',
    info: '#3B82F6',
  },

  defaults: {
    shadow: false,
    gradient: false,
    arcSize: 0,
    strokeWidth: 1.5,
    fontFamily: 'system-ui, sans-serif',
    fontSize: 12,
    fontStyle: 0,
    sketch: 0,
    edgeStyle: 'elbowEdgeStyle',
    edgeRounded: 0,
  },

  colorMapping: {
    '#FFFFFF': '#FAFAFA',
    '#F0F4F8': '#E5E5E5',
    '#1A1A2E': '#171717',
    '#0072B2': '#3B82F6',
    '#009E73': '#22C55E',
    '#E69F00': '#EAB308',
    '#D55E00': '#EF4444',
    '#56B4E9': '#525252',
    '#000000': '#0A0A0A',
  },
};
