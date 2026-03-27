## ADDED Requirements

### Requirement: Drawing tricks catalog
系统 SHALL 内置以下高级绘图技巧：

| Trick ID | 名称 | 描述 |
|----------|------|------|
| `smart-arrows` | 智能箭头 | 自动调整箭头连接点位置 |
| `orthogonal-routing` | 正交路由 | 连线使用直角弯折 |
| `label-background` | 标签背景 | 连线标签添加白色背景 |
| `grid-snap` | 网格对齐 | 所有坐标对齐到 10px 网格 |
| `consistent-spacing` | 统一间距 | 同层元素间距一致化 |

每个技巧 MUST 定义：
- `id`: 唯一标识符
- `name`: 显示名称
- `description`: 功能描述
- `scope`: 作用范围（`global` | `selected`）
- `apply(xml)`: 应用函数

#### Scenario: Label background trick applied
- **WHEN** 用户启用 "标签背景" 技巧
- **THEN** 所有带 value 的 edge 元素 SHALL 添加 `labelBackgroundColor=#ffffff`

### Requirement: Grid snap implementation
`grid-snap` 技巧 SHALL 将所有 mxGeometry 的 x, y 坐标四舍五入到 10 的倍数。

#### Constraint: Exclude relative coordinates
Grid snap MUST 排除相对坐标（`relative="1"` 的 mxGeometry）。

判断规则：检查 mxGeometry 元素的 `relative` 属性，若值为 `"1"` 则跳过该坐标的对齐处理。

#### Scenario: Coordinates snapped to grid
- **WHEN** 用户应用 "网格对齐" 技巧
- **AND** 某元素坐标为 `x="127" y="183"`
- **THEN** 坐标 SHALL 变为 `x="130" y="180"`

#### Scenario: Relative geometry preserved
- **WHEN** 用户应用 "网格对齐" 技巧
- **AND** 某 mxGeometry 有 `relative="1"` 且 `x="0.5" y="0.5"`
- **THEN** 坐标 SHALL 保持为 `x="0.5" y="0.5"` 不变

### Requirement: Smart arrows implementation
`smart-arrows` 技巧 SHALL 优化连线锚点位置。

#### Constraint: Direction detection algorithm
流向判断使用 1.5 倍比例阈值：

```javascript
function detectFlowDirection(sourceCenter, targetCenter) {
  const deltaX = Math.abs(targetCenter.x - sourceCenter.x);
  const deltaY = Math.abs(targetCenter.y - sourceCenter.y);

  if (deltaX > deltaY * 1.5) {
    return 'horizontal';  // 水平流向
  } else {
    return 'vertical';    // 垂直流向（包括对角线偏向垂直的情况）
  }
}
```

优化规则：
- 垂直流向的连线：source 用底部锚点（exitY=1, exitX=0.5），target 用顶部锚点（entryY=0, entryX=0.5）
- 水平流向的连线：source 用右侧锚点（exitX=1, exitY=0.5），target 用左侧锚点（entryX=0, entryY=0.5）

#### Scenario: Vertical arrow anchors optimized
- **WHEN** 用户应用 "智能箭头" 技巧
- **AND** 存在从上方元素连接到下方元素的箭头
- **THEN** 连线 SHALL 使用 `exitY=1;exitX=0.5;entryY=0;entryX=0.5;` 样式

#### Scenario: Horizontal arrow anchors optimized
- **WHEN** 用户应用 "智能箭头" 技巧
- **AND** 存在从左侧元素连接到右侧元素的箭头（deltaX > deltaY * 1.5）
- **THEN** 连线 SHALL 使用 `exitX=1;exitY=0.5;entryX=0;entryY=0.5;` 样式

#### Scenario: Diagonal arrow defaults to vertical
- **WHEN** source 和 target 的 deltaX 与 deltaY 接近（如 100 vs 80）
- **THEN** 系统 SHALL 按垂直流向处理（因为 100 < 80 * 1.5 = 120）

### Requirement: Tricks panel UI
系统 SHALL 提供高级技巧面板，列出所有可用技巧。

面板 MUST：
- 与样式预设面板分开显示（可折叠）
- 每个技巧显示为按钮（非持久开关）
- 点击后立即应用到当前 XML
- 显示技巧描述和作用范围

#### Scenario: Apply trick from panel
- **WHEN** 用户点击 "网格对齐" 技巧按钮
- **THEN** 技巧 SHALL 立即应用到当前图表
- **AND** 显示 "已应用网格对齐" 提示

### Requirement: Undo trick application
用户 SHALL 能够撤销技巧应用。

系统 MUST 在应用技巧前保存当前 XML 状态。

#### Scenario: Undo trick
- **WHEN** 用户应用技巧后点击 "撤销"
- **THEN** XML SHALL 恢复到应用技巧前的状态
