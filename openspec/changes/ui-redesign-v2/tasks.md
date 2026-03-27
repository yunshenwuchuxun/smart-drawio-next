# UI Redesign V2 Tasks

## 1. 设计系统基础

- [x] 1.1 重写 `lib/design-system.js` - 完整 Token 系统（颜色含 accent 使用规则、字体含 sectionLabel、间距、圆角、阴影、z-index、动画）
- [x] 1.2 重写 `app/globals.css` - CSS Variables Light/Dark 主题 + prefers-reduced-motion 规则 + font-face 定义
- [x] 1.3 修改 `app/layout.js` - 添加 Inter 字体加载 (next/font)，保留 Geist Mono
- [x] 1.4 创建 `lib/theme-mode.js` - 主题模式管理 (light/dark/system) + matchMedia 监听 + localStorage 持久化 + 防闪烁 inline script

## 2. localStorage Key 迁移

- [x] 2.1 创建 `lib/storage.js` - localStorage 包装器（失败 fallback 到内存变量）
- [x] 2.2 实现 `migrateKeys()` - smart-excalidraw-* → smart-drawio-* 自动迁移
- [x] 2.3 更新所有 localStorage 引用使用 smart-drawio-* 新 key

## 3. 布局架构重构

- [x] 3.1 创建 `components/layout/Sidebar.jsx` - 侧边栏容器，320px/48px 宽度切换 + 300ms spring 动画 + 可中断
- [x] 3.2 创建 `components/layout/Spine.jsx` - 折叠态 (Logo dimmed + 展开按钮 + 状态指示器 8px 圆形三色 + tooltip)
- [x] 3.3 创建 `components/layout/SidebarCard.jsx` - 可折叠面板卡片 (48px header 含箭头+名称+摘要, flex:1 展开, min-height:200px, visibility:hidden 保留 DOM)
- [x] 3.4 创建 `components/layout/TopBar.jsx` - 顶部栏 48px (Logo + 模型状态 + 主题切换 Sun/Moon/Auto + 历史 + 设置)
- [x] 3.5 重构 `app/page.js` - Spatial Stack 布局 + 响应式断点 (1024px overlay / 768px hamburger)

## 4. 面板组件重设计

- [x] 4.1 创建 `components/panels/InputCard.jsx` - 从 Chat.jsx 拆分: 图表类型+主题选择+文本输入+文件上传+图片上传+生成按钮(含 Magnetic 效果)
- [x] 4.2 创建 `components/panels/CodeCard.jsx` - 从 CodeEditor.jsx 拆分: 工具栏+Monaco+脏状态检测(hash+500ms debounce)+accent 边框
- [x] 4.3 创建 `components/panels/ToolsCard.jsx` - 合并 ThemePanel+TricksPanel: 样式预设 toggle chips + 技巧 action chips + 重置
- [x] 4.4 实现面板焦点切换 - 400ms spring + 可中断 + Alt+点击拆分视图 (>=1440px)
- [x] 4.5 实现 Monaco ResizeObserver - requestAnimationFrame + editor.layout() + 动画期间 opacity 0.5

## 5. Blueprint 生成动画

- [x] 5.1 创建 `components/BlueprintOverlay.jsx` - 三阶段动画容器 (position:absolute inset:0, z-index:30)
- [x] 5.2 实现 Scanning - 橙色激光线 2px + box-shadow glow + 点阵网格背景 + scan keyframes 2s infinite
- [x] 5.3 实现 Drafting - CSS Grid 4x4 骨骼块 + pulse-draft keyframes 1.5s + staggered delays
- [x] 5.4 实现 Reveal - translateY(20px) scale(0.98) opacity:0 + 600ms cubic-bezier(0.16,1,0.3,1)
- [x] 5.5 实现中断处理 - 重新生成时重置 Phase 1 / 手动停止时加速 Reveal 300ms
- [x] 5.6 集成到生成流程 - Scanning→(first SSE chunk)→Drafting→(stream close)→Reveal→CODE 面板自动聚焦

## 6. Draw.io 视觉整合

- [x] 6.1 修改 `components/DrawioCanvas.jsx` - URL 添加 format=0 + configure=1
- [x] 6.2 创建 `lib/drawio-styles.js` - 集中管理 Light/Dark CSS 覆盖规则 (geToolbarContainer, geSidebarContainer, geTitle, geToolbarButton)
- [x] 6.3 实现 CSS 注入 - init 事件后通过 postMessage configure action 注入
- [x] 6.4 实现 fallback - 注入失败时保持默认样式 + console.warn 不显示错误

## 7. Dark Mode 实现

- [x] 7.1 实现主题模式切换 - document.documentElement.dataset.theme + matchMedia 系统偏好监听
- [x] 7.2 实现防闪烁 - head 内联 script 读取 localStorage 设置 data-theme
- [x] 7.3 实现 drawio iframe 主题同步 - 切换时保存 XML → 重新加载 iframe → 恢复 XML
- [x] 7.4 添加 TopBar 主题切换按钮 - Sun/Moon/Auto 图标 + 点击循环 light→dark→system→light

## 8. 微交互实现

- [x] 8.1 实现 Magnetic 生成按钮 - 50px 范围内箭头微移 2-3px + pointer:coarse/reduced-motion 禁用
- [x] 8.2 实现代码脏状态 - hash 对比 + 500ms debounce + accent 边框 + 应用按钮高亮
- [x] 8.3 实现错误抖动 - shake keyframes 300ms + 侧边栏边框红色闪烁 2 次
- [x] 8.4 实现 Spine 状态指示器 - 绿/橙闪/红 三态 + 1s interval 橙色闪烁

## 9. 键盘快捷键

- [x] 9.1 实现 OS 检测 - navigator.platform/userAgentData 判断 Mac/Windows + 修饰键显示
- [x] 9.2 实现 Ctrl/⌘+Enter - 生成/提交（仅 iframe 外焦点）
- [x] 9.3 实现 Ctrl/⌘+\ - 折叠/展开侧边栏
- [ ] 9.4 实现 [/] - 面板焦点切换（排除输入框/编辑器内焦点）
- [ ] 9.5 实现 Escape 优先级 - 关闭 Modal > 停止生成 > 折叠侧边栏
- [ ] 9.6 创建 `components/ShortcutsHelp.jsx` - 快捷键帮助弹窗
- [ ] 9.7 实现 ? 触发帮助 - 排除输入框/编辑器内焦点

## 10. Auto-save 和工作保护

- [ ] 10.1 实现 30s 自动保存 - smart-drawio-autosave + 变化检测
- [ ] 10.2 实现 beforeunload 警告 - 未保存变更时阻止关闭
- [ ] 10.3 实现页面恢复 - 加载时检测 autosave 数据并恢复

## 11. 无障碍 (Accessibility)

- [ ] 11.1 添加 ARIA 属性 - 面板 tablist/tab/tabpanel + aria-expanded + aria-live 生成状态
- [ ] 11.2 添加焦点管理 - 面板切换时焦点移至首交互元素 + 焦点环 2px accent
- [ ] 11.3 确保所有图标按钮有 aria-label
- [ ] 11.4 确保所有触控目标 >= 44x44 CSS px

## 12. 组件迁移与清理

- [ ] 12.1 迁移 Chat.jsx 功能到 InputCard.jsx
- [ ] 12.2 迁移 CodeEditor.jsx 功能到 CodeCard.jsx
- [ ] 12.3 更新所有 Modal 组件使用新 Token
- [ ] 12.4 更新 ui/ 基础组件 (Button, Input, Modal, Select, Spinner) 使用新 Token
- [ ] 12.5 移除旧组件引用 (Chat.jsx, ThemePanel.jsx, TricksPanel.jsx 如无其他引用)

## 13. 测试与验收

- [ ] 13.1 测试 Spatial Stack 面板切换 60fps
- [ ] 13.2 测试 Blueprint 动画各阶段过渡
- [ ] 13.3 测试 drawio CSS 注入效果 + fallback
- [ ] 13.4 测试 Dark Mode 完整切换（含 iframe 重新加载恢复）
- [ ] 13.5 测试键盘快捷键全部功能
- [ ] 13.6 测试响应式断点 (1024px / 768px)
- [ ] 13.7 测试 localStorage 迁移 + 失败 fallback
- [ ] 13.8 测试 autosave + beforeunload
- [ ] 13.9 执行 `pnpm build` 确保构建通过
