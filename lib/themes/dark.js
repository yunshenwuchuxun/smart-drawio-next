export const darkTheme = {
  id: 'dark',
  name: '深色模式',
  promptFragment: `## 深色模式绘图规范

### 配色规范
- **主色调**：GitHub 暗夜色系（#161B22 背景, #F78166 强调），护眼现代风格
- **语义配色**：成功(#3FB950)、警告(#D29922)、错误(#F85149)、信息(#58A6FF)，使用高亮度语义色确保可见性
- **对比度**：浅色文字在暗色背景上清晰可读
- **颜色格式**：所有颜色必须使用 6 位 Hex 格式（#RRGGBB），禁止 rgb()/hsl()/命名色

### 视觉风格
- 启用阴影效果（shadow=1）增加层次感
- 禁用渐变填充
- 使用圆角（arcSize=10）
- 线宽统一（strokeWidth=2）
- 字体：Arial，正文 11-13pt`,

  colorPalette: {
    bg: '#0D1117',
    surface: '#161B22',
    primary: '#58A6FF',
    accent: '#F78166',
    text: '#E6EDF3',
    mutedText: '#7D8590',
    success: '#3FB950',
    warning: '#D29922',
    error: '#F85149',
    info: '#58A6FF',
  },

  defaults: {
    shadow: true,
    gradient: false,
    arcSize: 10,
    strokeWidth: 1.5,
    fontFamily: 'Segoe UI, system-ui, sans-serif',
    fontSize: 12,
    fontStyle: 0,
    sketch: 0,
    edgeStyle: 'orthogonalEdgeStyle',
    edgeRounded: 1,
  },

  colorMapping: {
    '#FFFFFF': '#0D1117',
    '#F0F4F8': '#161B22',
    '#1A1A2E': '#58A6FF',
    '#0072B2': '#58A6FF',
    '#009E73': '#3FB950',
    '#E69F00': '#D29922',
    '#D55E00': '#F85149',
    '#56B4E9': '#F78166',
    '#000000': '#E6EDF3',
  },
};
