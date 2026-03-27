## ADDED Requirements

### Requirement: Style preset definition
系统 SHALL 定义以下样式预设效果：

| Preset ID | 名称 | 影响的 style 属性 |
|-----------|------|------------------|
| `shadow` | 阴影效果 | `shadow=1` |
| `gradient` | 渐变填充 | `gradientColor`, `gradientDirection` |
| `rounded` | 圆角样式 | `arcSize` |
| `glass` | 玻璃效果 | `glass=1` |

每个预设 MUST 定义：
- `id`: 唯一标识符
- `name`: 显示名称
- `styleChanges`: 启用时应用的样式变更对象
- `disableChanges`: 禁用时应用的样式变更对象

#### Constraint: Shadow preset excludes edges
`shadow` 预设 MUST 排除 edge（连线）元素。判断规则：
- 检查 style 是否包含 `edgeStyle`
- 或检查 mxCell 是否有 `source` 和 `target` 属性
满足任一条件则跳过该元素。

#### Scenario: Shadow preset applied
- **WHEN** 用户启用 "阴影效果" 预设
- **THEN** 所有形状元素 SHALL 添加 `shadow=1` 样式
- **AND** 连线元素 SHALL 不受影响

#### Scenario: Gradient preset with direction
- **WHEN** 用户启用 "渐变填充" 预设
- **THEN** 所有填充元素 SHALL 添加 `gradientDirection=south` 和根据当前颜色计算的 `gradientColor`

### Requirement: Gradient color calculation
渐变颜色 MUST 使用以下算法计算：

#### Constraint: sRGB multiply algorithm
`gradientColor` = 原 fillColor 各 RGB 分量乘以 0.8，结果取整并 clamp 到 [0, 255]。

```javascript
function darkenColor(hex) {
  // hex 格式: #RRGGBB
  const r = Math.floor(parseInt(hex.slice(1, 3), 16) * 0.8);
  const g = Math.floor(parseInt(hex.slice(3, 5), 16) * 0.8);
  const b = Math.floor(parseInt(hex.slice(5, 7), 16) * 0.8);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
```

#### Scenario: Gradient color auto-calculation
- **WHEN** 用户对 `fillColor=#dae8fc` 的元素启用渐变预设
- **THEN** 系统 SHALL 设置 `gradientColor=#aeb9c9`（各分量 × 0.8）

### Requirement: Style preset UI panel
系统 SHALL 提供样式预设面板，显示所有可用预设的开关。

面板 MUST：
- 显示在代码编辑器区域附近
- 每个预设显示为可切换的开关
- 实时预览效果（应用到当前 XML）

#### Scenario: Toggle preset in panel
- **WHEN** 用户在样式面板中切换 "阴影效果" 开关为开启
- **THEN** 当前图表 SHALL 立即应用阴影效果，无需 LLM 调用

### Requirement: Preset state persistence
系统 SHALL 将预设状态持久化到 localStorage。

存储键为 `smart-excalidraw-style-presets`，值为 JSON 对象 `{ presetId: boolean }`。

#### Scenario: Preset states restored on load
- **WHEN** 用户启用阴影和圆角预设后刷新页面
- **THEN** 样式面板 SHALL 显示阴影和圆角开关为开启状态

### Requirement: Theme-aware preset defaults
不同主题 SHALL 有不同的预设默认值。

- 科研主题：所有视觉效果预设默认关闭
- 商业主题：阴影和圆角预设默认开启

#### Scenario: Business theme enables shadow by default
- **WHEN** 用户切换到 "商业主题"
- **AND** 用户未手动修改过预设状态
- **THEN** 阴影预设 SHALL 自动开启

### Requirement: Preset compatibility
某些预设 MUST 相互兼容或互斥。

- `shadow` 和 `glass` 可同时启用
- `gradient` 的 `gradientColor` SHALL 基于当前 `fillColor` 使用 sRGB 乘法自动计算（各分量 × 0.8）

#### Scenario: Shadow and glass combined
- **WHEN** 用户同时启用 `shadow` 和 `glass` 预设
- **THEN** 所有形状元素 SHALL 同时包含 `shadow=1` 和 `glass=1` 样式

### Requirement: Reset to default styles
系统 SHALL 提供"重置为默认样式"功能。

#### Constraint: Reset behavior
重置功能 MUST：
- 移除所有预设效果（shadow、gradient、rounded、glass）
- 将所有 mxCell 的相关样式属性恢复到主题默认值
- 不影响颜色（fillColor/strokeColor 保持不变）

#### Scenario: Reset applied
- **WHEN** 用户点击"重置为默认样式"按钮
- **THEN** 所有预设开关 SHALL 变为关闭状态
- **AND** XML 中所有 `shadow=1`、`gradientColor`、`arcSize`、`glass=1` SHALL 被移除
