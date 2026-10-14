export const businessTheme = {
  id: 'business',
  name: '商业主题',
  promptFragment: `## 商业演示绘图规范

### 配色规范
- **主色调**：深邃靛蓝色系（#E0E7FF 背景, #4F46E5 强调），Stripe/Linear 商务风格
- **语义配色**：成功(#059669)、警告(#D97706)、错误(#DC2626)、信息(#4F46E5)
- **对比度**：确保文字清晰可读
- **颜色格式**：所有颜色必须使用 6 位 Hex 格式（#RRGGBB），禁止 rgb()/hsl()/命名色

### 视觉风格
- 启用阴影效果（shadow=1）增加层次感
- 允许渐变填充（gradientDirection=south）
- 使用圆角（arcSize=10）
- 线宽统一（strokeWidth=2）
- 字体：Arial，正文 11-13pt`,

  colorPalette: {
    bg: '#F8FAFC',
    surface: '#E0E7FF',
    primary: '#312E81',
    accent: '#4F46E5',
    text: '#1E1B4B',
    mutedText: '#64748B',
    success: '#059669',
    warning: '#D97706',
    error: '#DC2626',
    info: '#4F46E5',
  },

  defaults: {
    shadow: true,
    gradient: false,
    arcSize: 10,
    strokeWidth: 2,
    fontFamily: 'Arial, sans-serif',
    fontSize: 13,
    fontStyle: 0,
    sketch: 0,
    edgeStyle: 'orthogonalEdgeStyle',
    edgeRounded: 1,
  },

  colorMapping: {
    '#FFFFFF': '#F8FAFC',
    '#F0F4F8': '#E0E7FF',
    '#1A1A2E': '#312E81',
    '#0072B2': '#4F46E5',
    '#009E73': '#059669',
    '#E69F00': '#D97706',
    '#D55E00': '#DC2626',
    '#56B4E9': '#4F46E5',
    '#000000': '#1E1B4B',
  },
};
