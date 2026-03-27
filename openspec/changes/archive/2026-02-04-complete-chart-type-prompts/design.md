## Context

当前 `lib/prompts.js` 文件包含两个关键对象用于图表生成：
- `CHART_TYPE_NAMES`: 图表类型 ID 到中文名的映射（当前 14 种）
- `CHART_VISUAL_SPECS`: 图表类型的详细 draw.io mxGraph XML 视觉规范（当前 9 种）

`lib/constants.js` 中的 `CHART_TYPES` 定义了 23 种图表类型供 UI 下拉菜单使用。当用户选择缺失映射的类型时，`USER_PROMPT_TEMPLATE` 函数会退化为通用提示，导致 AI 无法获得特定图表的绘图指导。

另外，`lib/image-utils.js` 中的 `getChartTypeName()` 函数有独立的类型名称映射，缺少 `infographic` 类型。

## Goals / Non-Goals

**Goals:**
- 补全 `CHART_TYPE_NAMES`，覆盖全部 23 种类型
- 补全 `CHART_VISUAL_SPECS`，为 22 种非 auto 类型提供详细规范
- 同步 `lib/image-utils.js` 中的类型名称映射
- 保留 `experimental` 和 `comparison` 作为内部可用类型

**Non-Goals:**
- 不修改 `lib/constants.js`（UI 层已完整）
- 不改变现有的 `USER_PROMPT_TEMPLATE` 函数逻辑
- 不引入主题色动态替换机制（继续使用硬编码 + colorMapping）

## Decisions

### Decision 1: 颜色策略 - 硬编码 research 主题色

**选择**: 所有新规范使用 research 主题的固定颜色值

**理由**:
- 与现有 9 个规范保持一致
- 主题切换通过已有的 `colorMapping` 机制自动处理
- 避免引入新的运行时颜色替换复杂度

**标准颜色值**:
| 语义 | 颜色代码 |
|------|----------|
| 容器/背景 | #F7F9FC |
| 主要元素 | #dae8fc |
| 成功 | #d5e8d4 |
| 警告 | #fff2cc |
| 错误 | #f8cecc |
| 描边 | #2C3E50 |

### Decision 2: 复杂形状策略 - 混合方案

**选择**: 优先使用专用 shape 属性，同时提供基础图元回退

**理由**:
- 专用形状（如 `shape=mxgraph.lean_mapping.fishbone_diagram`）效果更好
- 但 AI 可能生成未被 draw.io 识别的形状
- 提供基础图元方案确保兼容性

**实现方式**: 在规范中按优先级描述：
```
1. 优先使用：shape=xxx（如果 draw.io 支持）
2. 回退方案：使用 line/ellipse/rectangle 组合
```

### Decision 3: 独立规范 - 不共享引用

**选择**: 每种图表类型有独立的完整规范字符串

**理由**:
- 便于单独调优每种类型的提示效果
- 避免引用导致的维护复杂度
- token 开销可接受（每次只注入一个规范）

**示例**:
```javascript
// 正确 - 独立定义
CHART_VISUAL_SPECS.tree = `### 树形图\n- 根节点：...`;
CHART_VISUAL_SPECS.mindmap = `### 思维导图\n- 中心节点：...`;

// 避免 - 共享引用
const HIERARCHY_BASE = `...`;
CHART_VISUAL_SPECS.tree = HIERARCHY_BASE;  // ❌
```

### Decision 4: 遗留类型处理

**选择**: 保留 `experimental` 和 `comparison` 在代码中，不添加到 UI

**理由**:
- 这些类型的规范已存在且可用
- 保留供内部或未来使用
- 不影响用户界面

## Risks / Trade-offs

### Risk 1: AI 形状生成不一致
**风险**: AI 可能生成 draw.io 不识别的 shape 值
**缓解**: 规范中明确列出有效的 shape 值，并提供基础图元回退方案

### Risk 2: 规范质量参差
**风险**: 新增 15 个规范可能质量不如原有 9 个
**缓解**: 遵循现有规范的结构和详细程度，实际测试生成效果

### Risk 3: Token 消耗增加
**风险**: 更详细的规范增加 prompt 长度
**缓解**: 单次只注入选中类型的规范，不影响 auto 模式

## Implementation Notes

### 文件修改清单

1. **lib/prompts.js**
   - 扩展 `CHART_TYPE_NAMES` 添加 11 个缺失映射
   - 扩展 `CHART_VISUAL_SPECS` 添加 15 个新规范

2. **lib/image-utils.js**
   - 在 `getChartTypeName()` 中添加 `infographic: '信息图'`

### 规范编写模板

每个新规范遵循此结构：
```javascript
chartType: `
### 图表中文名
- 元素A：shape/style，fillColor=#xxx，strokeColor=#xxx
- 元素B：shape/style，fillColor=#xxx
- 连接：edgeStyle，strokeWidth=2, endArrow=xxx
- 布局：方向，间距，对齐规则`
```
