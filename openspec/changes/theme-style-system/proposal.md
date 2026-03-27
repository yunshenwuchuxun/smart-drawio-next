## Why

当前系统只有硬编码的"学术论文"风格，无法满足商业演示、教育培训等不同场景的视觉需求。用户希望能够：
1. 在生成时选择不同主题（科研 vs 商业）
2. 快速切换样式效果（阴影、渐变、圆角等）而无需重新生成
3. 通过自然语言持续微调图表样式

## What Changes

- **新增主题系统**：内置科研主题（Research）和商业主题（Business），影响 LLM 生成时的 prompt
- **新增 ThemeEngine**：纯前端 XML 样式变换引擎，支持瞬时主题切换和样式效果应用
- **新增样式预设**：阴影、渐变、圆角等可独立开关的样式效果
- **新增高级绘图技巧库**：整理 draw.io 常用技巧（智能箭头、连接点策略等）
- **扩展多轮修改**：支持自然语言指令的样式微调（简单指令前端处理，复杂指令调用 LLM）
- **新增 UI 控件**：主题选择器、样式效果开关面板

## Capabilities

### New Capabilities

- `theme-system`: 主题定义、切换逻辑、prompt 片段管理
- `theme-engine`: 纯前端 XML 样式变换引擎，解析 mxGraph XML 并批量修改 style 属性
- `style-presets`: 样式预设定义（阴影、渐变、圆角等效果的开关和参数）
- `drawing-tricks`: 高级绘图技巧库，从 draw.io 文档整理的可选增强功能

### Modified Capabilities

（无现有 spec 需要修改）

## Impact

- **lib/prompts.js**: 重构为动态 prompt 组装，支持主题注入
- **lib/themes/**: 新增目录，存放主题定义和 prompt 片段
- **lib/theme-engine.js**: 新增，纯前端 XML 变换逻辑
- **lib/style-presets.js**: 新增，样式预设定义
- **lib/drawing-tricks.js**: 新增，高级绘图技巧库
- **components/Chat.jsx**: 新增主题选择器 UI
- **components/ThemePanel.jsx**: 新增样式效果开关面板
- **app/page.js**: 新增主题/样式相关状态管理
- **localStorage**: 新增 `smart-excalidraw-theme` 和 `smart-excalidraw-style-presets` 键
