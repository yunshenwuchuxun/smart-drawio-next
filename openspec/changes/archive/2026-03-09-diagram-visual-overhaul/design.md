## Context

smart-drawio-next 通过 LLM 生成 Draw.io XML，再经过客户端后处理管线（`lib/drawing-tricks.js` → `lib/theme-postprocess.js`）优化视觉效果。当前三个子系统存在独立但相关的质量问题。

**箭头定位**：`lib/optimizeArrows.js` 的 `determineEdges()` 使用四象限距离比较选择出入边，`lib/drawing-tricks.js` 的 `smartArrows()` 将锚点固定为边缘中心 (0.5)。对角线布局和多连线场景下效果较差。

**科研主题**：`lib/themes/research.js` 的视觉默认值（arcSize=8, strokeWidth=2, fontFamily=Arial）接近 neutral 主题，缺乏学术论文插图的极简精确风格。

**主题差异化**：所有 10 个主题（`lib/themes/*.js`）的 defaults 仅包含 5 个属性（shadow/gradient/arcSize/strokeWidth/fontFamily），其中 fontFamily 统一为 Arial、strokeWidth 统一为 2，导致主题间视觉差异主要靠颜色。

## Goals / Non-Goals

**Goals:**
- 箭头锚点在多连线场景下均匀分布，不再全部堆叠在 0.5
- `determineEdges()` 使用角度判断而非距离比较，提高对角线布局的路由准确性
- 科研主题产出的图表具有 Nature/Science 论文插图的视觉特征：细线、直角、无装饰、Helvetica 字体、色盲安全配色
- 10 个主题在字体、线宽、连线样式、效果组合上各自独特，不仅靠颜色区分
- LLM 系统提示包含主题的完整视觉属性，指导模型使用正确的字体、线宽和连线样式

**Non-Goals:**
- 不引入外部布局引擎（elkjs、libavoid-js 等）
- 不重新设计主题选择 UI
- 不修改 Draw.io iframe 嵌入方式
- 不做全局避障路由（仅增强局部锚点选择）
- 不修改现有主题的 colorPalette 颜色值（除 research 主题外）

## Decisions

### D1: 角度感知路由算法

**选择**: 在 `determineEdges()` 中用 `Math.atan2(dy, dx)` 计算实际角度，以 ±30° 阈值划分 4 个主方向（上/下/左/右）

**替代方案**:
- A) 保持距离比较但增加权重因子 → 仍为启发式，不解决根本问题
- B) 引入 elkjs 全局布局 → 需要约 2MB 新依赖，架构改动过大

**理由**: `atan2` 直接给出精确角度，阈值方式语义清晰且易于测试。±30° 意味着水平方向覆盖 ±30°（-30° 到 30° 和 150° 到 210°），其余为垂直方向，符合大多数图表的正交布局预期。

### D2: 端口扇出分布策略

**选择**: smartArrows 两趟处理——第一趟收集每个形状每面的边计数，第二趟按序号均匀分配锚点

**分配公式**: `anchor = (i + 1) / (count + 1)`，其中 i 为当前边在该面的序号（0-based），count 为该面总边数。例如 3 条边分布在 0.25、0.5、0.75。

**替代方案**: 按目标位置排序后分配 → 增加复杂度但效果略好。暂时用简单均匀分布，后续可优化排序。

### D3: research 主题基准颜色变更处理

**选择**: 修改 `lib/themes/research.js` 的 colorPalette 为 Okabe-Ito 色盲安全配色，同时更新所有其他 9 个主题的 `colorMapping` 映射源颜色。

**影响**: `colorMapping` 的 key 是 research 主题的颜色值。research 颜色变更后，所有主题的 colorMapping 必须使用新的 research 颜色作为 key。

**理由**: research 是 DEFAULT_THEME_ID，其颜色是 LLM 生成 XML 的基准色。变更基准色是实现色盲安全配色的最直接路径。

### D4: theme defaults 结构扩展

**选择**: 在现有 5 个属性基础上新增 6 个属性：fontSize、fontStyle、sketch、dashed、edgeStyle、edgeRounded。所有属性为可选字段，缺失时使用兼容默认值。

**兼容性**: `lib/prompts.js` 和 `lib/theme-engine.js` 读取新属性时使用 `||` 默认值回退，旧主题结构仍可工作。

### D5: 后处理 tricks 扩展策略

**选择**: 扩展 `lib/theme-postprocess.js` 的 `THEME_POSTPROCESSING_TRICKS` 映射，为不同主题配置不同 trick 组合。

| 主题 | 后处理 tricks |
|------|-------------|
| research | orthogonalRouting, smartArrows, jumpCrossings |
| business | smartArrows |
| warm | smartArrows |
| cool | orthogonalRouting, smartArrows |
| contrast | orthogonalRouting, smartArrows, jumpCrossings |
| 其余主题 | smartArrows |

**理由**: 学术/技术主题需要正交路由和交叉跳跃标记；装饰性主题（warm, pastel, violet）只需箭头优化。

## Risks / Trade-offs

- **research 基准颜色变更** → 所有 9 个主题的 colorMapping 必须同步更新。遗漏一个即导致颜色映射不完整。缓解：单次批量更新所有主题文件，用测试覆盖每个主题的 colorMapping 完整性。
- **fontFamily 字体可用性** → Helvetica、Georgia、Quicksand 等字体在用户系统上可能不存在。缓解：每个主题的 fontFamily 使用字体栈（如 `Helvetica, Arial, sans-serif`），Draw.io 会自动回退。
- **sketch 模式兼容性** → Draw.io 的 `sketch=1` 属性需要较新版本支持。缓解：仅在 pastel 主题启用 sketch 模式作为实验性功能，其余主题不使用。
- **角度阈值 ±30° 可能非最优** → 某些布局可能需要不同阈值。缓解：将阈值提取为 `ANGLE_THRESHOLD` 常量，便于后续调整。
- **端口扇出在极多连线时** → 10+ 条边连同一面时锚点过于密集。缓解：设置最大扇出数（如 MAX_FAN_OUT=6），超出时回退到中心锚点。
