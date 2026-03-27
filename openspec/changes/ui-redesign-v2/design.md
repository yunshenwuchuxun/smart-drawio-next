## Context

Smart Drawio Next 是一个 AI 图表生成工具，嵌入 draw.io iframe 实现编辑能力。当前 UI 功能完整但视觉混乱，需要全面重设计以达到 Apple/Linear/Figma 级别的专业感。

当前架构：
- 用户输入 → Chat.jsx → page.js → /api/generate → LLM → XML → DrawioCanvas
- 左右两栏布局，百分比分割
- 左侧同时显示：Tabs + Input + Code Editor + Style Panels + Trick Panels
- drawio iframe 带有自己的 UI（工具栏、形状侧边栏、格式面板）

约束：
- 必须保留 drawio 在线编辑能力
- Desktop-first，支持响应式降级（<1024px overlay drawer, <768px hamburger）
- 纯前端可部署（Vercel 免费版）
- 不破坏现有功能

## Goals / Non-Goals

**Goals:**
- 建立 "Technical Glass" 设计系统
- 实现 Light/Dark 双主题
- 通过 Spatial Stack 布局减少认知负荷
- 统一 drawio iframe 与主应用的视觉语言
- 实现 "Blueprint" 生成动画，提升体验
- 支持侧边栏折叠，最大化画布空间

**Non-Goals:**
- Command Palette (后续迭代)
- 斜杠命令功能 (后续迭代)
- 功能变更（仅 UI/UX 重设计）
- Modal 内容重设计（仅样式更新）

## Decisions

### Decision 1: 强调色选择 International Orange

**选择**: #FF4F00 (International Orange)

**理由**:
- 暗示"正在建构"的语义，契合 AI 生成工具的属性
- 与通用蓝色系工具产品形成差异化
- 在 Light/Dark 模式下都有良好对比度（Dark 下调整为 #FF5F1F）
- 用量克制：仅用于主要操作和活跃状态

**替代方案**: Blue (#2563EB) - 更安全但缺乏辨识度

### Decision 2: Spatial Stack 替代 Accordion

**选择**: 面板使用"空间堆栈"模式

**实现**:
```
┌──────────────┐
│ INPUT (flex) │  ← 聚焦时展开
├──────────────┤
│ CODE (48px)  │  ← 折叠为标题
├──────────────┤
│ TOOLS (48px) │  ← 折叠为标题
└──────────────┘
```

点击折叠标题时：
1. 当前聚焦面板压缩为 48px Header
2. 被点击的面板展开为 flex: 1
3. 使用 spring 动画过渡

**理由**:
- 减少视觉噪音，一次只聚焦一个任务
- 比传统 Accordion 更有空间感
- 与 macOS 侧边栏交互模式一致

### Decision 3: drawio CSS 注入策略

**选择**: 通过 `configure=1` 参数 + CSS 属性注入样式

**实现**:
```javascript
// DrawioCanvas.jsx
src={`https://embed.diagrams.net/?embed=1&proto=json&ui=min&format=0&configure=1`}

// postMessage configure action
{
  action: 'configure',
  config: {
    css: `
      .geToolbarContainer { background: #FAFAFA !important; }
      .geSidebarContainer .geTitle { font-family: 'Geist Mono' !important; }
      ...
    `
  }
}
```

**理由**:
- 不需要修改 drawio 源码
- 可以在运行时动态切换主题
- 足够覆盖主要 UI 元素

**限制**: 某些内部元素可能无法完全覆盖，接受这一局限性

### Decision 4: Dark Mode 画布策略

**选择**: Dark Mode 下画布保持白色背景

**理由**:
- 用户创建的图表通常需要导出/打印，白底更通用
- 与文档编辑器（Notion、Google Docs）惯例一致
- drawio iframe 主题切换需要重新加载，会丢失编辑状态

**实现**:
- UI 外壳响应 Dark Mode
- drawio iframe 保持 `dark=0`
- 画布区域作为"内容承载区"始终保持亮色

### Decision 5: 生成动画使用 Overlay 层

**选择**: 在 iframe 上方覆盖 Blueprint Overlay

**理由**:
- 无法直接控制 iframe 内部动画
- Overlay 可以实现完整的三阶段动画
- 揭幕效果比简单 fade 更有仪式感

**实现**:
```jsx
<div className="relative">
  <DrawioCanvas />
  {isGenerating && <BlueprintOverlay phase={generationPhase} />}
</div>
```

### Decision 6: 侧边栏宽度策略

**选择**: 固定 320px，可折叠至 48px

**理由**:
- 百分比布局导致在不同屏幕宽度下比例失调
- 320px 足够容纳输入框和代码编辑器
- 48px 折叠态（Spine）仅保留状态指示，最大化画布

**不选**: 可拖拽调整宽度 - 增加实现复杂度，收益有限

### Decision 7: 设计 Token 架构

**选择**: CSS Variables + JS Constants 双轨制

**实现**:
```css
/* globals.css */
:root {
  --color-accent: #FF4F00;
  --color-bg-app: #F9FAFB;
  ...
}
[data-theme='dark'] {
  --color-accent: #FF5F1F;
  --color-bg-app: #050505;
  ...
}
```

```javascript
// design-system.js
export const tokens = {
  colors: { accent: 'var(--color-accent)', ... },
  spacing: { 1: '4px', 2: '8px', ... },
  animation: {
    spring: 'cubic-bezier(0.25, 1, 0.5, 1)',
    duration: { fast: '150ms', normal: '200ms', slow: '300ms' }
  }
}
```

**理由**:
- CSS Variables 支持运行时主题切换
- JS Constants 提供类型安全和编辑器补全
- Tailwind 通过 CSS Variables 读取，无需重新构建

## Open Questions

所有 Open Questions 已在 Plan 阶段通过双模型审查 + 用户确认解决：

1. **Monaco Editor 在动画过程中的性能** → 已决策：使用 ResizeObserver + requestAnimationFrame + editor.layout()，动画期间设置文本 opacity 0.5 隐藏抖动
2. **drawio CSS 注入的完整性** → 已决策：采用 fallback 策略，注入失败时保持默认样式，不中断功能
3. **Dark Mode 系统偏好检测** → 已决策：默认 `system` 模式自动跟随，用户可手动覆盖为 `light`/`dark`

### 额外决策（Plan 阶段补充）

4. **响应式策略**: >=1024px 正常布局, <1024px overlay drawer, <768px hamburger 菜单
5. **面板模式**: 默认单面板聚焦，>=1440px 支持 Alt+点击拆分视图
6. **Accessibility**: WCAG AA 标准 (4.5:1 文字对比度, 3:1 UI 对比度)
7. **动画无障碍**: prefers-reduced-motion 时所有动画时长设为 0ms
8. **iframe 快捷键**: 不桥接，iframe 聚焦时由 drawio 处理
9. **主题切换 iframe 处理**: 重新加载 iframe + 保存恢复 XML
10. **localStorage key**: 迁移到 `smart-drawio-*` 前缀，首次加载自动迁移旧数据
11. **未保存工作保护**: 30s 自动保存 + beforeunload 警告
12. **浏览器支持**: Chrome/Edge/Firefox/Safari 最近 2 版本 + iOS Safari 15+
13. **性能指标**: LCP<2.5s, FID<100ms, CLS<0.1

## References

- Gemini MCP Design Session: 215748b1-86e5-476f-9423-1ead8cbccf64
- draw.io Embed Mode: https://www.drawio.com/doc/faq/embed-mode
- draw.io Configuration: https://www.drawio.com/doc/faq/configure-diagram-editor
- Linear Design System (参考)
- Apple Human Interface Guidelines (参考)
