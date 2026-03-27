## ADDED Requirements

### Requirement: Design Token System

`lib/design-system.js` MUST 导出完整的设计 Token 系统。

#### Constraint: Color tokens

颜色 Token MUST 包含以下完整列表（Light / Dark 值）：
- `accent`: #FF4F00 / #FF5F1F
- `accentHover`: #E64600 / #FF7340
- `accentAlpha10`: rgba(255,79,0,0.1) / rgba(255,95,31,0.1)
- `bgApp`: #F9FAFB / #050505
- `bgSurface`: #FFFFFF / #121212
- `bgInput`: #F3F4F6 / #1E1E1E
- `textPrimary`: #111827 / #EDEDED
- `textSecondary`: #6B7280 / #A1A1AA
- `textTertiary`: #9CA3AF / #71717A
- `borderSubtle`: rgba(0,0,0,0.08) / rgba(255,255,255,0.12)
- `borderActive`: rgba(0,0,0,0.15) / rgba(255,255,255,0.2)
- `error`: #DC2626 / #EF4444
- `success`: #16A34A / #22C55E
- `warning`: #CA8A04 / #EAB308
- `focusRing`: rgba(255,79,0,0.4) / rgba(255,95,31,0.4)

Accent 色使用规则：
- ALLOWED: 主要操作按钮、活跃/选中状态、代码脏状态指示、生成动画
- FORBIDDEN: 错误状态（用 error token）、销毁操作（用 error token）

所有 token MUST 满足 WCAG AA 对比度标准（4.5:1 文字，3:1 UI 元素）。

#### Constraint: Typography tokens

字体 Token MUST 包含：
- `fontSans`: 'Inter', system-ui, sans-serif（UI 标签和内容）
- `fontMono`: 'Geist Mono', monospace（代码和分区标题）
- 字号层级：
  - `display`: 32px / 40px line-height / -0.02em / weight 600
  - `h1`: 24px / 32px / -0.01em / 600
  - `h2`: 18px / 28px / 0 / 600
  - `h3`: 16px / 24px / 0 / 500
  - `body`: 14px / 20px / 0 / 400
  - `bodySm`: 13px / 18px / 0 / 400
  - `caption`: 12px / 16px / 0.01em / 400
  - `code`: 13px / 20px / 0 / 400 (Geist Mono)
  - `sectionLabel`: 10px / 16px / 0.08em / 500 (Geist Mono, uppercase)
- 字体加载策略：使用 `next/font` 加载 Inter 和 Geist Mono，fallback 为 system-ui

#### Constraint: Spacing tokens

间距 Token MUST 使用 4px 基准：
- 1: 4px, 2: 8px, 3: 12px, 4: 16px, 5: 20px, 6: 24px, 8: 32px, 10: 40px, 12: 48px, 16: 64px

#### Constraint: Radius tokens

圆角 Token MUST 包含：
- `sm`: 4px
- `md`: 6px
- `lg`: 8px
- `xl`: 12px
- `full`: 9999px

#### Constraint: Shadow tokens

Light 模式使用阴影，Dark 模式使用边框替代：
- `shadow.card`: Light `0 1px 3px rgba(0,0,0,0.1)` / Dark `0 0 0 1px rgba(255,255,255,0.06)`
- `shadow.sidebar`: Light `4px 0 12px rgba(0,0,0,0.05)` / Dark `0 0 0 1px rgba(255,255,255,0.08)`
- `shadow.overlay`: Light `0 24px 48px rgba(0,0,0,0.2)` / Dark `0 24px 48px rgba(0,0,0,0.6)`

#### Constraint: Z-index tokens

- `base`: 0
- `sidebar`: 20
- `overlay`: 30
- `modal`: 40
- `toast`: 50

#### Constraint: Animation tokens

动画 Token MUST 包含：
- `spring`: cubic-bezier(0.25, 1, 0.5, 1)
- `ease`: cubic-bezier(0.4, 0, 0.2, 1)
- `duration.fast`: 150ms
- `duration.normal`: 200ms
- `duration.slow`: 300ms
- `duration.panel`: 400ms

`prefers-reduced-motion` 处理：
- WHEN 系统启用 reduced-motion
- THEN 所有 duration 值 SHALL 设为 0ms
- THEN 状态变化仍然发生，仅跳过动画

#### Scenario: Token usage in components

- **WHEN** 组件需要使用颜色
- **THEN** MUST 通过 CSS Variables (`var(--color-*)`) 引用
- **THEN** MUST NOT 硬编码颜色值

### Requirement: CSS Variables System

`app/globals.css` MUST 定义 Light/Dark 主题的 CSS Variables。

#### Constraint: Theme selector

- Light 主题使用 `:root` 选择器
- Dark 主题使用 `[data-theme='dark']` 选择器

#### Constraint: Font loading

使用 `next/font` 的 `Inter` 和 `Geist_Mono`，通过 CSS Variables 传递：
- `--font-inter`: Inter Variable
- `--font-geist-mono`: Geist Mono
- fallback: `system-ui, -apple-system, sans-serif`

#### Constraint: Reduced motion

MUST 包含 `@media (prefers-reduced-motion: reduce)` 规则：
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

#### Scenario: Theme switching

- **WHEN** `document.documentElement.dataset.theme` 设置为 `'dark'`
- **THEN** 所有使用 CSS Variables 的元素 SHALL 自动切换为 Dark 主题颜色

### Requirement: localStorage Key Migration

所有 localStorage key MUST 从 `smart-excalidraw-*` 迁移到 `smart-drawio-*` 前缀。

#### Constraint: Migration strategy

- 首次加载时检测旧 key 是否存在
- 存在则复制到新 key，然后删除旧 key
- 新数据只写入 `smart-drawio-*` key

#### Constraint: Key mapping

- `smart-excalidraw-configs` → `smart-drawio-configs`
- `smart-excalidraw-active-config` → `smart-drawio-active-config`
- `smart-excalidraw-history` → `smart-drawio-history`
- `smart-excalidraw-theme` → `smart-drawio-diagram-theme`
- `smart-excalidraw-style-presets` → `smart-drawio-style-presets`
- 新增 `smart-drawio-theme-mode`: `'light'` | `'dark'` | `'system'`
- 新增 `smart-drawio-sidebar-collapsed`: `boolean`
- 新增 `smart-drawio-active-panel`: `'input'` | `'code'` | `'tools'`

#### Constraint: Storage failure handling

- **WHEN** localStorage 不可用（SSR、隐私模式、配额超限）
- **THEN** 使用内存变量 fallback，不 crash
- **THEN** 功能正常运行但不持久化

### Requirement: Sidebar Layout

侧边栏 MUST 实现固定宽度可折叠布局。

#### Constraint: Dimensions

- 展开宽度: 320px (固定)
- 折叠宽度: 48px (Spine 模式)

#### Constraint: Collapse behavior

- 折叠态仅显示：Logo (dimmed, opacity 0.4) + 展开按钮 + 状态指示器
- 状态指示器：8px 圆形
  - 绿色 (#16A34A): 就绪
  - 橙色 (#FF4F00) 闪烁 (1s interval): 生成中
  - 红色 (#DC2626): 错误
- 折叠态所有元素 MUST 有 tooltip（500ms 延迟）

#### Constraint: Animation

- 折叠/展开过渡: 300ms, cubic-bezier(0.25, 1, 0.5, 1)
- 动画 MUST 可中断：快速连续点击时从当前位置反向
- 使用 CSS `width` transition（非 transform），确保 Canvas 自动填充

#### Constraint: Responsive behavior

- \>= 1024px: 正常侧边栏布局
- < 1024px: 侧边栏变为 overlay drawer (z-index: 20)，背景遮罩 rgba(0,0,0,0.3)
- < 768px: 侧边栏隐藏，hamburger 菜单触发全屏 drawer

#### Constraint: State persistence

- 侧边栏折叠状态 MUST 保存到 `smart-drawio-sidebar-collapsed`
- 页面刷新后恢复上次状态

#### Scenario: Collapse toggle

- **WHEN** 用户点击折叠按钮或按 `Ctrl+\` (Windows) / `⌘\` (Mac)
- **THEN** 侧边栏 SHALL 在 300ms 内动画过渡到折叠态/展开态
- **THEN** Canvas SHALL 自动填充释放的空间

### Requirement: Spatial Stack Panels

侧边栏内部 MUST 使用空间堆栈模式组织面板。

#### Constraint: Panel structure

三个面板：
- INPUT (输入): 图表类型选择 + 主题选择 + 文本输入 + 文件/图片上传 + 生成按钮
- CODE (代码): 撤销/重做/清除/应用工具栏 + Monaco Editor
- TOOLS (工具): 样式预设开关 + 高级技巧按钮 + 重置按钮

#### Constraint: Focus behavior

默认模式（单面板聚焦）：
- 一次只能有一个面板处于"聚焦"状态
- 聚焦面板: flex: 1 (占据剩余空间), min-height: 200px
- 非聚焦面板: height: 48px (仅显示标题栏), overflow: hidden
- 默认聚焦: INPUT

可选拆分视图（仅 >= 1440px 屏幕宽度）：
- Alt+点击面板标题时，允许两个面板同时展开
- 两个展开面板各占 flex: 1（等分空间）
- 第三个面板保持 48px 折叠

#### Constraint: Collapsed panel header

48px 高度的折叠标题栏 MUST 包含：
- 左侧：展开箭头 (▸) + 面板名称 (sectionLabel 字体)
- 右侧：面板状态摘要（如 CODE 面板显示行数，TOOLS 显示活跃预设数）
- 最小触控目标: 48px × 320px

#### Constraint: Animation

- 过渡时长: 400ms, cubic-bezier(0.25, 1, 0.5, 1)
- 动画 MUST 可中断：快速切换时从当前位置反向
- Monaco Editor 处理：
  - 使用 ResizeObserver 监听容器尺寸变化
  - 在 requestAnimationFrame 中调用 `editor.layout()`
  - 动画期间设置 editor 文本 opacity 0.5，动画结束后恢复 1.0

#### Constraint: State preservation

- 面板切换时 MUST 保留所有 DOM 状态（滚动位置、光标、undo history）
- 实现方式：使用 CSS `visibility: hidden` + `height: 0` 而非 unmount
- 当前聚焦面板 MUST 保存到 `smart-drawio-active-panel`

#### Scenario: Panel switching

- **GIVEN** INPUT 面板当前聚焦
- **WHEN** 用户点击 CODE 面板标题
- **THEN** INPUT SHALL 压缩为 48px 高度
- **THEN** CODE SHALL 展开为 flex: 1
- **THEN** 焦点 SHALL 移到 CODE 面板的第一个交互元素
- **THEN** 过渡 SHALL 使用 spring 动画

### Requirement: Blueprint Generation Overlay

生成图表时 MUST 显示 Blueprint 动画效果。

#### Constraint: Overlay positioning

- Overlay MUST 精确覆盖 drawio iframe 区域 (position: absolute, inset: 0)
- z-index: 30 (overlay token)
- 背景色: var(--color-bg-app)

#### Constraint: Animation phases

Phase 1 - Scanning (0-2s 循环, 从点击生成开始到收到第一个 SSE chunk):
- 橙色激光线 (2px height, #FF4F00) 从顶部扫描到底部
- CSS: `animation: scan 2s cubic-bezier(0.45, 0, 0.55, 1) infinite`
- 激光线带发光效果: `box-shadow: 0 0 15px 2px rgba(255,79,0,0.5)`
- 背景: 点阵网格 (20px 间距, rgba(0,0,0,0.03))

Phase 2 - Drafting (收到第一个 SSE chunk 到最后一个 chunk):
- 骨骼块在中心区域脉动显示
- 使用 CSS Grid 4x4 布局，居中于 overlay
- 每个块: rounded rectangle, 高度 20-40px 随机, `animation: pulse-draft 1.5s ease infinite`
- 不同 animation-delay (0.1s-0.5s) 创造随机感

Phase 3 - Reveal (生成完成后):
- Overlay 向下滑出 + 淡出
- `transform: translateY(20px) scale(0.98); opacity: 0`
- 时长: 600ms, 缓动: cubic-bezier(0.16, 1, 0.3, 1)
- 完成后从 DOM 移除

#### Constraint: Animation on CSS only

- 所有动画 MUST 仅使用 `transform` 和 `opacity` 属性（GPU 合成层）
- MUST NOT 使用 JS requestAnimationFrame 驱动动画帧
- 确保在主线程处理 SSE 数据时动画不卡顿

#### Constraint: Interruption handling

- **WHEN** 用户在生成过程中再次点击生成
- **THEN** 当前 overlay 立即重置为 Phase 1
- **WHEN** 用户手动停止生成
- **THEN** overlay 执行加速版 Reveal (300ms) 后消失

#### Scenario: Generation flow

- **WHEN** 用户点击生成按钮
- **THEN** Blueprint Overlay SHALL 出现并显示 Scanning 动画
- **WHEN** 开始接收流式响应 (第一个 SSE data chunk)
- **THEN** Overlay SHALL 切换到 Drafting 动画
- **WHEN** 生成完成 (SSE stream 关闭)
- **THEN** Overlay SHALL 执行 Reveal 动画后消失
- **THEN** CODE 面板 SHALL 自动聚焦显示生成的代码

### Requirement: Draw.io CSS Integration

drawio iframe MUST 通过 CSS 注入与主应用视觉统一。

#### Constraint: URL parameters

iframe src MUST 包含:
- `embed=1`
- `proto=json`
- `ui=min`
- `format=0` (关闭右侧格式面板)
- `configure=1` (启用配置)

#### Constraint: CSS injection method

通过 postMessage `configure` action 在 iframe `init` 事件后注入：
```javascript
iframeRef.current.contentWindow.postMessage(JSON.stringify({
  action: 'configure',
  config: { css: CSS_STRING }
}), DRAWIO_ORIGIN);
```

#### Constraint: CSS injection targets

CSS MUST 覆盖以下元素 (使用 `!important`)：
- `.geMenubarContainer`: background, border-bottom, font-family
- `.geToolbarContainer`: background, border-bottom, height, padding
- `.geSidebarContainer`: background, border-right
- `.geSidebarContainer .geTitle`: font-family, font-size, text-transform, letter-spacing, color
- `.geToolbarButton`: border-radius, opacity, transition
- `.geToolbarButton:hover`: background, opacity

#### Constraint: Fallback strategy

- CSS 注入失败（configure 不被支持或 class 名变更）时，iframe 保持默认样式
- MUST NOT 导致 iframe 功能中断
- 日志记录注入失败但不向用户显示错误

#### Scenario: Visual consistency

- **WHEN** drawio iframe 加载并发送 `init` 事件
- **THEN** 应用 SHALL 发送 configure action 注入 CSS
- **THEN** 工具栏背景 SHALL 与 `--color-bg-app` 一致
- **THEN** 侧边栏标题 SHALL 使用 Geist Mono, 10px, uppercase

### Requirement: Dark Mode Support

应用 MUST 支持 Light/Dark 双主题。

#### Constraint: Theme mode state machine

三个模式: `light` | `dark` | `system`
- `system`: 跟随 `matchMedia('(prefers-color-scheme: dark)')` 的值
- 用户手动选择 `light` 或 `dark` 时覆盖系统设置
- 系统设置变更时，若当前为 `system` 模式，MUST 立即响应

#### Constraint: Default theme

- 默认值: `system`
- 首次加载时检测系统偏好

#### Constraint: Persistence

- 用户主题偏好 MUST 保存到 `localStorage` key: `smart-drawio-theme-mode`
- 值: `'light'` | `'dark'` | `'system'`

#### Constraint: drawio iframe theme sync

- 主题切换时 drawio iframe MUST 重新加载以注入对应主题的 CSS
- 重新加载前 MUST 保存当前图表 XML
- 重新加载后 MUST 恢复保存的 XML
- 画布背景始终保持白色 (dark=0)，仅 UI 元素样式变化

#### Constraint: Theme switch UX

- 切换方式: 立即切换（无动画）
- 防闪烁: 在 `<head>` 中内联 script 读取 localStorage 并设置 `data-theme`

#### Scenario: System theme change

- **GIVEN** 用户选择了 `system` 模式
- **WHEN** 操作系统从 Light 切换到 Dark
- **THEN** UI 外壳 SHALL 立即切换到 Dark 主题
- **THEN** drawio iframe SHALL 重新加载并注入 Dark CSS
- **THEN** 图表内容 SHALL 保持不变

### Requirement: TopBar

顶部栏 MUST 提供全局导航和状态信息。

#### Constraint: Layout

- 高度: 48px (固定)
- 左侧: Logo + 产品名 "Smart Drawio" (Inter, 16px, weight 600)
- 中间: 模型状态指示器 (连接的模型名称 + 绿点)
- 右侧: 主题切换按钮 + 历史记录按钮 + 设置按钮

#### Constraint: Theme toggle

- 图标: Sun (light) / Moon (dark) / Auto (system)
- 点击循环: light → dark → system → light

### Requirement: Auto-save and Unsaved Work Protection

应用 MUST 自动保存用户工作并防止意外丢失。

#### Constraint: Auto-save

- 每 30 秒自动保存当前 XML 到 `smart-drawio-autosave`
- 仅在内容有变化时触发保存
- 保存时不显示 UI 反馈（静默）

#### Constraint: Close warning

- **WHEN** 存在未保存的变更且用户尝试关闭/刷新页面
- **THEN** 浏览器 SHALL 显示 `beforeunload` 确认对话框

#### Constraint: Recovery

- **WHEN** 页面重新加载且存在 autosave 数据
- **THEN** 应用 SHALL 自动恢复到上次保存的状态

### Requirement: Micro-interactions

关键元素 MUST 实现微交互增强。

#### Constraint: Generate button

- 鼠标靠近 50px 内时，按钮内箭头图标向光标方向微移 2-3px
- 使用 `transform: translate()` 实现
- 触控设备 (`pointer: coarse`): 禁用磁性效果
- `prefers-reduced-motion`: 禁用磁性效果

#### Constraint: Code dirty state

- 脏状态检测: 编辑器内容 hash 与上次应用的内容 hash 不同
- 检测时机: 编辑器内容变化后 500ms debounce
- 编辑器边框 SHALL 变为 accent 色 (#FF4F00)
- "应用" 按钮 SHALL 高亮显示 (accent 背景色)

#### Constraint: Error feedback

- API 错误时:
  - 输入框 SHALL 执行 X 轴抖动 (3px, 3 次, 300ms total)
  - CSS: `@keyframes shake { 0%,100% { transform: translateX(0) } 25%,75% { transform: translateX(-3px) } 50% { transform: translateX(3px) } }`
  - 侧边栏左边框 SHALL 闪烁红色 2 次 (0.3s on, 0.3s off)
  - 错误消息 SHALL 显示在 INPUT 面板内部，inline 样式

### Requirement: Keyboard Shortcuts

MUST 支持以下键盘快捷键。

#### Constraint: OS detection

- 自动检测操作系统，显示对应修饰键
- macOS: `⌘`, Windows/Linux: `Ctrl`
- 快捷键提示 MUST 在所有按钮 tooltip 中显示

#### Constraint: Scope

- 所有快捷键仅在 iframe 外部（主应用）有焦点时生效
- 当 drawio iframe 有焦点时，快捷键由 drawio 处理，不桥接

#### Constraint: Shortcut map

- `Ctrl/⌘ + Enter`: 生成/提交
- `Ctrl/⌘ + \`: 折叠/展开侧边栏
- `[` / `]`: 切换面板焦点（仅当焦点不在输入框/编辑器内时）
- `Escape` 优先级: 关闭 Modal > 停止生成 > 折叠侧边栏
- `?`: 显示快捷键帮助（仅当焦点不在输入框/编辑器内时）

#### Constraint: Focus management

- 面板切换时焦点移至新展开面板的第一个交互元素
- Escape 从侧边栏回到画布时，不清除侧边栏状态

#### Scenario: Shortcut invocation

- **WHEN** 用户按下 `Ctrl/⌘ + \`
- **THEN** 侧边栏 SHALL 切换折叠/展开状态
- **THEN** 焦点 SHALL 保持在当前位置

### Requirement: Browser Compatibility

MUST 支持以下浏览器。

#### Constraint: Supported browsers

- Chrome/Edge: 最近 2 个版本
- Firefox: 最近 2 个版本
- Safari: 最近 2 个版本
- iOS Safari: 15+

#### Constraint: Performance targets

- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1
- 面板切换动画: 60fps
- 所有动画 MUST 使用 GPU 合成属性 (transform/opacity)

### Requirement: Accessibility

MUST 满足 WCAG AA 标准。

#### Constraint: Color contrast

- 文字对比度: >= 4.5:1
- UI 元素对比度: >= 3:1
- 焦点环: 2px solid var(--color-focus-ring), offset 2px

#### Constraint: ARIA

- 侧边栏面板: `role="tablist"` + `role="tab"` + `role="tabpanel"`
- 折叠/展开: `aria-expanded`
- 生成状态: `aria-live="polite"` 区域，生成完成时播报 "图表已生成"
- 所有图标按钮: `aria-label`

#### Constraint: Keyboard navigation

- Tab 键可在所有交互元素间导航
- 面板标题可通过 Enter/Space 激活
- 最小触控目标: 44x44 CSS px
