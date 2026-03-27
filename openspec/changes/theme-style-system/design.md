## Context

Smart Drawio Next 当前只有硬编码的学术论文风格（`lib/prompts.js` 中的 `SYSTEM_PROMPT`）。用户需要科研主题（极简、可打印、高对比度）和商业主题（现代、演示友好、允许阴影渐变）两种视觉风格。

当前架构：
- 用户输入 → Chat.jsx → page.js → /api/generate → LLM → XML → DrawioCanvas
- 样式修改仅通过 OptimizationPanel 后处理（需要 LLM 调用）

约束：
- 必须纯前端可部署（Vercel 免费版）
- 主题切换应尽量瞬时完成，避免 LLM 调用
- 不破坏现有功能（图表生成、历史记录、配置管理）

## Goals / Non-Goals

**Goals:**
- 用户可在生成前选择主题，影响 LLM 输出风格
- 用户可在生成后瞬时切换主题/样式，无需重新生成
- 提供阴影、渐变、圆角等样式效果的独立开关
- 简单样式指令（"去掉阴影"）前端直接处理，复杂指令降级到 LLM
- 内置常用 draw.io 高级技巧供用户选用

**Non-Goals:**
- 用户自定义主题（仅内置科研/商业两种）
- 实时协作编辑
- 图表结构变更（如自动布局优化）——仅样式变换

## Decisions

### Decision 1: 混合架构（Prompt 驱动 + 前端后处理）

**选择**: 生成阶段用 Prompt 驱动主题，后处理用纯前端 ThemeEngine

**备选方案**:
- A. 纯 Prompt 驱动：主题切换需重新生成，消耗 token，延迟高
- B. 纯后处理：无法影响结构，商业图可能缺少层次感元素
- C. 混合架构（选定）：生成时注入主题 prompt，后续切换用前端变换

**理由**: 平衡效果与性能，主题切换瞬时，LLM 调用仅在真正需要时发生

### Decision 2: ThemeEngine 基于正则 + DOM 解析

**选择**: 使用正则表达式解析 style 属性，DOMParser 解析 XML 结构

**备选方案**:
- A. 纯正则：简单但难以处理嵌套结构
- B. 完整 XML 库（如 xml2js）：增加依赖体积
- C. DOMParser + 正则（选定）：浏览器原生，无额外依赖

**理由**: 浏览器原生 DOMParser 足够处理 mxGraph XML，正则用于 style 属性键值对

### Decision 3: 主题定义为 JS 模块

**选择**: `lib/themes/{research,business}.js` 导出主题对象

**结构**:
```javascript
export const researchTheme = {
  id: 'research',
  name: '科研主题',
  promptFragment: '## 学术论文绘图规范...',
  colorPalette: {
    primary: { fill: '#F7F9FC', stroke: '#2C3E50' },
    semantic: { success: '#d5e8d4', warning: '#fff2cc', error: '#f8cecc' }
  },
  defaults: {
    shadow: false,
    gradient: false,
    arcSize: 0,
    strokeWidth: 2,
    fontFamily: 'Arial'
  }
};
```

**理由**: 静态模块可被打包优化，无运行时加载开销

### Decision 4: 样式预设与主题解耦

**选择**: 样式效果（shadow、gradient、arcSize）独立于主题，可叠加应用

**理由**: 用户可能希望"科研主题 + 阴影"或"商业主题 - 渐变"，解耦提供灵活性

### Decision 5: 指令分流策略

**选择**: 前端维护简单指令映射表，匹配失败时降级到 LLM

```javascript
const SIMPLE_COMMANDS = {
  '去掉阴影': { action: 'setStyle', key: 'shadow', value: '0' },
  '添加阴影': { action: 'setStyle', key: 'shadow', value: '1' },
  '圆角': { action: 'setStyle', key: 'arcSize', value: '10' },
  // ...
};
```

**理由**: 常见操作瞬时响应，提升用户体验

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| ThemeEngine 正则解析可能遗漏边缘 case | 编写测试用例覆盖各种 mxCell style 格式 |
| 商业主题 prompt 可能生成过于花哨的图 | 限制渐变/阴影使用范围，保持可读性 |
| 简单指令映射表难以覆盖所有表达 | 提供"其他"选项降级到 LLM，逐步扩充映射 |
| 主题切换后结构不变可能显得突兀 | 在 UI 中提示用户"仅样式变换，如需结构调整请重新生成" |

## Open Questions

1. ~~是否需要支持用户自定义主题？~~ → 决定为 Non-Goal
2. ~~高级绘图技巧的具体列表待从 draw.io 文档整理~~ → 已定义：smart-arrows, orthogonal-routing, label-background, grid-snap, consistent-spacing
3. ~~是否需要"重置为默认样式"功能？~~ → 决定为需要，提供重置按钮清除所有预设效果
