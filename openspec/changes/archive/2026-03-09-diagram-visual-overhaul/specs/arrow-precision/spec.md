## ADDED Requirements

### Requirement: Angle-aware edge direction selection
`lib/optimizeArrows.js` 的 `determineEdges()` 函数 SHALL 使用 `Math.atan2(dy, dx)` 计算源元素中心到目标元素中心的角度，基于角度阈值（±30°）选择出边和入边方向，替代当前的四象限距离比较逻辑。

角度区间划分：
- **右 (right→left)**: -30° ≤ angle < 30°
- **下 (bottom→top)**: 30° ≤ angle < 150°
- **左 (left→right)**: 150° ≤ angle 或 angle < -150°
- **上 (top→bottom)**: -150° ≤ angle < -30°

注意：角度从源中心到目标中心计算，所以 startEdge 是源形状的出边（如源在目标上方，startEdge=bottom），endEdge 是目标的入边（如目标在源下方，endEdge=top）。

#### Constraint: Overlapping elements fallback
当源元素与目标元素中心重合时（dx=0 且 dy=0），`atan2(0,0)` 返回 0。此时 `determineEdges()` SHALL 跳过角度判断，直接返回默认值 `{ startEdge: 'right', endEdge: 'left' }`（与当前行为一致）。

#### Constraint: Missing or degenerate geometry
当边的 source 或 target 元素缺少 `mxGeometry`、几何为 `relative="1"`、或宽高为 0 时，`smartArrows()` SHALL 跳过该边，不修改其样式。

#### Scenario: Vertical layout uses top-bottom edges
- **WHEN** 源元素中心在目标元素中心正上方（角度约 90°）
- **THEN** `determineEdges()` SHALL 返回 `{ startEdge: 'bottom', endEdge: 'top' }`

#### Scenario: Horizontal layout uses left-right edges
- **WHEN** 源元素中心在目标元素中心正右方（角度约 0°）
- **THEN** `determineEdges()` SHALL 返回 `{ startEdge: 'left', endEdge: 'right' }`

#### Scenario: Diagonal layout at 45 degrees prefers vertical
- **WHEN** 源元素中心在目标元素中心右下方（角度约 45°，在 30°-150° 区间）
- **THEN** `determineEdges()` SHALL 返回垂直方向 `{ startEdge: 'bottom', endEdge: 'top' }`

#### Scenario: Near-horizontal diagonal prefers horizontal
- **WHEN** 源元素中心到目标元素中心角度约 20°（在 -30° 到 30° 区间）
- **THEN** `determineEdges()` SHALL 返回水平方向 `{ startEdge: 'left', endEdge: 'right' }`

### Requirement: Port fan-out distribution
`lib/drawing-tricks.js` 的 `smartArrows()` 函数 SHALL 在同一形状的同一面有多条边时，将锚点均匀分布而非全部设为 0.5。

分配公式：`anchor = (i + 1) / (count + 1)`，其中 i 为当前边在该面的序号（0-based），count 为该面总边数。

算法流程：
1. 第一趟遍历：统计每个形状每个面（top/bottom/left/right）作为出口或入口的边数，按 `(cellId, face, role)` 三元组独立追踪（role 为 'exit' 或 'entry'）
2. 第二趟遍历：按公式分配锚点，设置 exitX/exitY 或 entryX/entryY
3. 最大扇出数 MAX_FAN_OUT=6，超出时该面的所有边回退到 0.5 中心锚点（仅影响超出的面，不影响同一形状的其他面）

#### Constraint: Edge ordering for fan-out
同一面的多条边按 XML 文档顺序（即 `querySelectorAll('mxCell')` 返回顺序）排序后分配序号。此排序方式是稳定且确定性的。

#### Constraint: Overwrite policy
`smartArrows()` SHALL 始终覆盖边上已有的 `exitX/exitY/entryX/entryY` 值。smartArrows 是自动修复操作，不保留 LLM 或用户设置的锚点。

#### Scenario: Single edge uses center anchor
- **WHEN** 形状 A 的 bottom 面只有 1 条出边
- **THEN** smartArrows SHALL 设置该边的 exitX=0.5, exitY=1

#### Scenario: Three edges fan out on same face
- **WHEN** 形状 A 的 bottom 面有 3 条出边
- **THEN** smartArrows SHALL 分别设置 exitX=0.25, exitX=0.5, exitX=0.75（exitY 均为 1）

#### Scenario: Max fan-out exceeded falls back to center
- **WHEN** 形状 A 的某面有超过 6 条边
- **THEN** smartArrows SHALL 将所有边的锚点设为中心值 0.5

### Requirement: Perimeter spacing on edges
`lib/drawing-tricks.js` 的 `smartArrows()` 函数 SHALL 为所有处理的边添加 `sourcePerimeterSpacing=8;targetPerimeterSpacing=8` 样式属性。

#### Scenario: Perimeter spacing applied to edges
- **WHEN** smartArrows 处理一条有 source 和 target 的边
- **THEN** 该边的 style 属性 SHALL 包含 `sourcePerimeterSpacing=8` 和 `targetPerimeterSpacing=8`

#### Scenario: Existing perimeter spacing preserved on one side
- **WHEN** 边已有 `sourcePerimeterSpacing` 但缺少 `targetPerimeterSpacing`
- **THEN** smartArrows SHALL 保留 `sourcePerimeterSpacing` 原有值，仅填充缺失的 `targetPerimeterSpacing=8`

### Requirement: Jump crossings trick
`lib/drawing-tricks.js` SHALL 新增 `jumpCrossings` trick，为所有边添加 `jumpStyle=arc;jumpSize=8` 样式属性，使交叉连线显示半圆弧跳跃标记。

#### Constraint: Jump crossings overwrite policy
`jumpCrossings` SHALL 始终覆盖边上已有的 `jumpStyle` 和 `jumpSize` 值，统一为 `arc` 和 `8`。

#### Scenario: Jump style applied to all edges
- **WHEN** 用户应用 jumpCrossings trick
- **THEN** 所有边的 style 属性 SHALL 包含 `jumpStyle=arc` 和 `jumpSize=8`

#### Scenario: Jump crossings registered in tricks registry
- **WHEN** 查看 `lib/drawing-tricks.js` 的 tricks 导出对象
- **THEN** SHALL 包含 `jumpCrossings` 键，具有 id、name（'交叉跳跃'）、description、scope='global'、apply 函数

#### Scenario: Jump crossings available in tool registry
- **WHEN** `lib/tool-registry.js` 被导入
- **THEN** `tricks` 对象 SHALL 包含 `jumpCrossings` 条目

## Property-Based Testing Invariants

### Requirement: determineEdges angle invariants
以下不变量 SHALL 对所有非重叠矩形对成立：

#### Scenario: Swap symmetry
- **WHEN** `determineEdges(s, t)` 返回 `(startEdge, endEdge)`
- **THEN** `determineEdges(t, s)` SHALL 返回 `(opposite(endEdge), opposite(startEdge))`，其中 opposite(left)=right, opposite(top)=bottom 等

#### Scenario: Translation invariance
- **WHEN** 将两个矩形同时平移向量 v
- **THEN** `determineEdges` 的结果 SHALL 不变

#### Scenario: Outward-normal sanity
- **WHEN** `p_s` 和 `p_t` 是选定的边缘中心点，`v = p_t - p_s`
- **THEN** `normal(startEdge) · v >= 0` 且 `normal(endEdge) · v <= 0`（箭头不会指回源形状或穿过目标形状）

### Requirement: smartArrows idempotency
`smartArrows` 函数 SHALL 满足幂等性。

#### Scenario: Double application equals single
- **WHEN** 对任意 XML 连续应用两次 `smartArrows`
- **THEN** 结果 SHALL 与应用一次完全相同（`smartArrows(smartArrows(xml)) === smartArrows(xml)`）

### Requirement: Fan-out distribution invariants
端口扇出分布 SHALL 满足以下数学属性：

#### Scenario: All anchors in valid range
- **WHEN** 任意 bucket 的边数 n ∈ [1,6]
- **THEN** 所有生成的锚点值 SHALL 严格在 (0, 1) 区间内（不含边界）

#### Scenario: Uniform spacing
- **WHEN** 同一 bucket 有 n 条边（n ∈ [1,6]）
- **THEN** 相邻锚点间距 SHALL 恒等于 `1/(n+1)`

#### Scenario: Symmetry around center
- **WHEN** 同一 bucket 有 n 条边
- **THEN** `anchor[i] + anchor[n-1-i] = 1`（镜像对称），平均值恒为 0.5

#### Scenario: Bucket independence
- **WHEN** 向其他面/角色/形状添加新的边
- **THEN** 原有 bucket 的锚点分配 SHALL 不变

#### Scenario: Face-axis preservation
- **WHEN** 锚点分配给 left/right 面
- **THEN** 仅 y 轴锚点变化（exitY/entryY），x 轴固定为 0 或 1
- **WHEN** 锚点分配给 top/bottom 面
- **THEN** 仅 x 轴锚点变化（exitX/entryX），y 轴固定为 0 或 1

### Requirement: Global anchor bounds
所有由 smartArrows 生成的 exitX、exitY、entryX、entryY 值 SHALL 在 [0, 1] 范围内。

#### Scenario: Arbitrary graph anchor validity
- **WHEN** 对任意合法 Draw.io XML 应用 smartArrows
- **THEN** 所有边的 exitX, exitY, entryX, entryY 样式值 SHALL 为 0 到 1 之间的数值
