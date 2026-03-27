# UI Redesign V2: "Technical Glass"

## Problem

当前 Smart Drawio 的 UI 存在以下结构性问题：

1. **视觉层级混乱** - 所有控件同时可见，没有主次之分
2. **Canvas 主权被削弱** - 左侧面板使用百分比宽度，挤占画布空间
3. **控件碎片化** - 样式预设、高级技巧、优化按钮分散在不同区域
4. **双系统视觉冲突** - 我们的 UI + drawio 内置 UI 形成割裂感
5. **无设计系统** - 间距、颜色、字体大小无统一规范
6. **缺乏品牌辨识度** - 与通用工具类产品无差异

## Solution

实施 "Technical Glass" 设计系统，全面重构 UI 架构：

### 1. 布局架构：Spatial Stack

- **左侧边栏**: 固定 320px 宽，可折叠至 48px（Spine 模式）
- **面板组织**: 使用"空间堆栈"模式替代传统 Accordion
  - INPUT / CODE / TOOLS 三个 Card
  - 点击标题时，聚焦的 Card 展开，其他压缩为 48px Header
  - 过渡动画: `flex-grow 0.4s cubic-bezier(0.25, 1, 0.5, 1)`
- **画布区域**: flex: 1，占据剩余全部空间

### 2. 视觉身份

- **强调色**: International Orange (#FF4F00)
  - 仅用于: 生成按钮、活跃状态、代码变更提示
- **字体**:
  - UI: Inter Variable, -0.01em tracking
  - 代码: Geist Mono
  - 分区标题: Geist Mono, 10px, uppercase, opacity 0.5
- **阴影策略**:
  - Light: 微妙投影
  - Dark: 用边框替代阴影

### 3. Dark Mode

从第一天起支持 Light/Dark 双主题：
- 使用 CSS Variables + `[data-theme]` 选择器
- 画布保持白色背景（如文档编辑器）
- UI 外壳响应主题切换

### 4. 生成时刻："Blueprint" 效果

替代普通 Loading Spinner，实现三阶段动画：
1. **Scanning**: 橙色激光线扫描
2. **Drafting**: 骨骼块脉动
3. **Reveal**: 蓝图向下滑出揭示图表

### 5. Draw.io 视觉整合

通过 CSS 注入统一 drawio iframe 的视觉语言：
- 默认关闭右侧格式面板 (`format=0`)
- 覆盖工具栏、侧边栏样式
- 使其看起来是同一产品的一部分

### 6. 微交互增强

- "Magnetic" 生成按钮（鼠标靠近时微移）
- 代码编辑器"脏状态"边框变色
- 错误状态抖动反馈

## Scope

### In Scope

- `lib/design-system.js` - 设计 Token 系统（颜色、间距、字体、动画）
- `app/globals.css` - CSS Variables for Light/Dark
- `app/page.js` - 主布局重构（Spatial Stack 架构）
- `components/Sidebar.jsx` - 新的侧边栏容器组件
- `components/SidebarCard.jsx` - 可折叠的面板卡片
- `components/InputCard.jsx` - 输入区域重设计
- `components/CodeCard.jsx` - 代码编辑器区域重设计
- `components/ToolsCard.jsx` - 样式/技巧合并区域
- `components/BlueprintOverlay.jsx` - 生成时刻动画
- `components/Spine.jsx` - 折叠态侧边栏
- `components/DrawioCanvas.jsx` - 添加 CSS 注入配置
- Dark Mode 切换逻辑和持久化

### Out of Scope

- Command Palette (⌘K) - 后续迭代
- 斜杠命令 (/) - 后续迭代
- Mobile/Tablet 响应式 - 仅保留 Desktop
- Modal 组件重设计 - 使用现有 Modal
- 历史记录/配置管理功能变更 - 仅样式更新

## Impact

- **app/page.js**: 主布局重大重构
- **app/globals.css**: 全面重写
- **lib/design-system.js**: 全面重写
- **components/Chat.jsx**: 拆分为 InputCard
- **components/CodeEditor.jsx**: 拆分为 CodeCard
- **components/ThemePanel.jsx**: 合并到 ToolsCard
- **components/TricksPanel.jsx**: 合并到 ToolsCard
- **components/DrawioCanvas.jsx**: 添加 configure 参数和 CSS 注入
- **components/ui/***: 更新以使用新 Token

## References

- Gemini MCP Design Consultation (SESSION_ID: 215748b1-86e5-476f-9423-1ead8cbccf64)
- Design inspiration: Linear, Figma, Apple System UI
- Draw.io embed docs: https://www.drawio.com/doc/faq/embed-mode
