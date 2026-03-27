## 1. 主题定义层

- [x] 1.1 创建 `lib/themes/research.js` - 科研主题定义（id, name, promptFragment, colorPalette 使用语义 Token, defaults）
- [x] 1.2 创建 `lib/themes/business.js` - 商业主题定义（语义 Token 配色，启用 shadow/rounded 默认值）
- [x] 1.3 创建 `lib/themes/index.js` - 导出所有主题，提供 `getTheme(id)` 函数
- [x] 1.4 重构 `lib/prompts.js` - 添加 `buildSystemPrompt(theme)` 函数，动态注入主题 promptFragment（含强制 #RRGGBB 格式指令）

## 2. ThemeEngine 核心

- [x] 2.1 创建 `lib/theme-engine.js` - 基础模块结构
- [x] 2.2 实现 `parseStyle(styleString)` - 宽松模式解析（容忍空白、跳过无效 token、后值覆盖）
- [x] 2.3 实现 `stringifyStyle(styleObj)` - 将对象转回 style 字符串
- [x] 2.4 实现 `applyStyleChange(xml, changes)` - 批量修改所有 mxCell 样式
- [x] 2.5 实现 `applyTheme(xml, sourceTheme, targetTheme)` - 使用精确 Hex 匹配映射颜色，未映射色保持原样
- [x] 2.6 实现 `applyStyleToMatching(xml, selector, changes)` - 选择性样式修改
- [x] 2.7 实现 XML 错误处理 - 解析失败时中止并返回原始 XML，返回错误信息
- [x] 2.8 编写 ThemeEngine 单元测试（可选，视时间）

## 3. 样式预设

- [x] 3.1 创建 `lib/style-presets.js` - 定义 shadow/gradient/rounded/glass 预设
- [x] 3.2 实现 `applyPreset(xml, presetId, enabled)` - 应用/移除预设效果
- [x] 3.3 实现 shadow 预设排除 edge 元素逻辑（检查 edgeStyle 或 source/target 属性）
- [x] 3.4 实现 `darkenColor(hex)` - sRGB 乘法（各分量 × 0.8）计算渐变颜色
- [x] 3.5 实现 `resetStyles(xml)` - 重置为默认样式（移除 shadow/gradientColor/arcSize/glass）

## 4. 高级绘图技巧

- [x] 4.1 创建 `lib/drawing-tricks.js` - 技巧目录结构
- [x] 4.2 实现 `gridSnap(xml)` - 网格对齐技巧（排除 relative="1" 的坐标）
- [x] 4.3 实现 `smartArrows(xml)` - 智能箭头锚点优化（1.5 倍比例阈值判断流向）
- [x] 4.4 实现 `labelBackground(xml)` - 连线标签背景
- [x] 4.5 实现 `consistentSpacing(xml)` - 统一间距（可选，复杂度高）

## 5. UI 组件

- [x] 5.1 修改 `components/Chat.jsx` - 添加主题选择器下拉框
- [x] 5.2 创建 `components/ThemePanel.jsx` - 样式预设开关面板（含重置按钮）
- [x] 5.3 创建 `components/TricksPanel.jsx` - 高级技巧按钮面板
- [x] 5.4 修改 `components/CodeEditor.jsx` - 集成 ThemePanel 和 TricksPanel

## 6. 状态管理集成

- [x] 6.1 修改 `app/page.js` - 添加 theme/presets/xmlHistory 状态
- [x] 6.2 实现主题切换处理 - 调用 ThemeEngine.applyTheme
- [x] 6.3 实现预设切换处理 - 调用 ThemeEngine.applyPreset
- [x] 6.4 实现技巧应用处理 - 调用 tricks，保存 XML 快照支持撤销
- [x] 6.5 实现重置样式处理 - 调用 resetStyles，重置所有预设开关
- [x] 6.6 添加 localStorage 持久化 - `smart-excalidraw-theme` 和 `smart-excalidraw-style-presets`

## 7. API 层适配

- [x] 7.1 修改 `app/api/generate/route.js` - 接收 theme 参数
- [x] 7.2 使用 `buildSystemPrompt(theme)` 替换硬编码 SYSTEM_PROMPT

## 8. 验收测试

- [x] 8.1 测试主题选择 - 科研/商业主题生成不同风格图表
- [x] 8.2 测试主题切换 - 已有图表瞬时切换主题（颜色映射正确，未映射色保持不变）
- [x] 8.3 测试样式预设 - 阴影/渐变/圆角开关独立工作，阴影不影响连线
- [x] 8.4 测试高级技巧 - 网格对齐（排除相对坐标）、智能箭头（1.5 阈值）生效
- [x] 8.5 测试持久化 - 刷新后主题和预设状态恢复
- [x] 8.6 测试重置功能 - 重置按钮清除所有预设效果
- [x] 8.7 测试错误处理 - 无效 XML 时显示警告并恢复原始
