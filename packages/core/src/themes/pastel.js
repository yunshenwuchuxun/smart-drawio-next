export const pastelTheme = {
  id: 'pastel',
  name: '柔和粉彩',
  promptFragment: `## 柔和粉彩绘图规范

### 配色规范
- **主色调**：马卡龙梦境色系（#FFE4E6 背景, #A78BFA 强调），轻松友好风格
- **语义配色**：成功(#6EE7B7)、警告(#FCD34D)、错误(#FCA5A5)、信息(#93C5FD)
- **对比度**：确保文字清晰可读
- **颜色格式**：所有颜色必须使用 6 位 Hex 格式（#RRGGBB），禁止 rgb()/hsl()/命名色

### 视觉风格
- 禁用阴影效果（shadow=0）
- 禁用渐变填充
- 使用圆角（arcSize=10）
- 线宽统一（strokeWidth=2）
- 字体：Arial，正文 11-13pt`,

  colorPalette: {
    bg: '#FFF1F2',
    surface: '#FFE4E6',
    primary: '#F472B6',
    accent: '#A78BFA',
    text: '#374151',
    mutedText: '#9CA3AF',
    success: '#6EE7B7',
    warning: '#FCD34D',
    error: '#FCA5A5',
    info: '#93C5FD',
  },

  defaults: {
    shadow: false,
    gradient: false,
    arcSize: 10,
    strokeWidth: 1.5,
    fontFamily: 'Quicksand, Nunito, sans-serif',
    fontSize: 13,
    fontStyle: 0,
    sketch: 0,
    edgeRounded: 1,
  },

  colorMapping: {
    '#FFFFFF': '#FFF1F2',
    '#F0F4F8': '#FFE4E6',
    '#1A1A2E': '#F472B6',
    '#0072B2': '#93C5FD',
    '#009E73': '#6EE7B7',
    '#E69F00': '#FCD34D',
    '#D55E00': '#FCA5A5',
    '#56B4E9': '#A78BFA',
    '#000000': '#374151',
  },
};
