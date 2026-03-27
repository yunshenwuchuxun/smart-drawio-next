## ADDED Requirements

### Requirement: Extended theme defaults structure
每个主题的 defaults 对象 SHALL 支持以下新属性（在现有 shadow/gradient/arcSize/strokeWidth/fontFamily 基础上扩展）：

| 属性 | 类型 | 说明 |
|------|------|------|
| fontSize | number | 主题默认字号（pt） |
| fontStyle | number | 0=正常, 1=bold, 2=italic |
| sketch | number | 0=正常, 1=手绘模式 |
| dashed | number | 0=实线, 1=虚线（仅辅助线） |
| edgeStyle | string | 默认连线路由样式 |
| edgeRounded | number | 0=直角连线, 1=圆角连线 |

所有新属性为可选字段。读取时缺失的属性 SHALL 使用兼容默认值（fontSize=12, fontStyle=0, sketch=0, dashed=0, edgeStyle='orthogonalEdgeStyle', edgeRounded=0）。

#### Constraint: Backward compatibility
新增属性是运行时向后兼容的。现有主题对象缺少新字段时系统正常工作。不标记为 BREAKING 变更。

#### Scenario: Theme with all new properties
- **WHEN** 加载一个包含所有新属性的主题
- **THEN** 系统 SHALL 正确读取并应用所有属性值

#### Scenario: Theme missing new properties uses defaults
- **WHEN** 加载一个不包含新属性的旧主题对象
- **THEN** 系统 SHALL 使用兼容默认值（fontSize=12, fontStyle=0, sketch=0, dashed=0, edgeStyle='orthogonalEdgeStyle', edgeRounded=0）

### Requirement: Per-theme visual identity
每个主题 SHALL 在 defaults 中配置独特的视觉属性组合，确保字体、线宽、连线样式和效果的差异化。

| 主题 | fontFamily | fontSize | strokeWidth | edgeStyle | edgeRounded | sketch | 特殊效果 |
|------|-----------|----------|-------------|-----------|-------------|--------|---------|
| research | Helvetica, Arial, sans-serif | 11 | 1 | orthogonalEdgeStyle | 0 | 0 | 零装饰 |
| business | Arial, sans-serif | 13 | 2 | orthogonalEdgeStyle | 1 | 0 | shadow+gradient |
| warm | Georgia, serif | 13 | 2 | - | 1 | 0 | shadow+rounded |
| cool | Inter, system-ui, sans-serif | 12 | 1.5 | orthogonalEdgeStyle | 0 | 0 | 无装饰 |
| dark | Segoe UI, system-ui, sans-serif | 12 | 1.5 | orthogonalEdgeStyle | 1 | 0 | shadow |
| contrast | Arial, sans-serif | 12 | 2 | orthogonalEdgeStyle | 0 | 0 | 零装饰高对比 |
| pastel | Quicksand, Nunito, sans-serif | 13 | 1.5 | - | 1 | 0 | rounded |
| forest | Lato, sans-serif | 12 | 1.5 | orthogonalEdgeStyle | 0 | 0 | 无装饰 |
| violet | Poppins, sans-serif | 13 | 2 | orthogonalEdgeStyle | 1 | 0 | shadow+gradient |
| neutral | system-ui, sans-serif | 12 | 1.5 | elbowEdgeStyle | 0 | 0 | 无装饰 |

注意：warm 和 pastel 的 edgeStyle 列为 `-` 表示不设置 edgeStyle（使用 curved=1 代替）。

#### Scenario: Research theme uses Helvetica thin lines
- **WHEN** 加载 research 主题
- **THEN** defaults.fontFamily SHALL 为 'Helvetica, Arial, sans-serif'
- **AND** defaults.fontSize SHALL 为 11
- **AND** defaults.strokeWidth SHALL 为 1

#### Scenario: Business theme uses bold shadow style
- **WHEN** 加载 business 主题
- **THEN** defaults.shadow SHALL 为 true
- **AND** defaults.fontSize SHALL 为 13
- **AND** defaults.edgeRounded SHALL 为 1

#### Scenario: Warm theme uses curved edges with serif font
- **WHEN** 加载 warm 主题
- **THEN** defaults.fontFamily SHALL 包含 'Georgia'
- **AND** defaults.edgeStyle SHALL 未设置或为空（使用 curved 连线）

#### Scenario: Cool theme uses Inter with thin lines
- **WHEN** 加载 cool 主题
- **THEN** defaults.fontFamily SHALL 包含 'Inter'
- **AND** defaults.strokeWidth SHALL 为 1.5
- **AND** defaults.edgeRounded SHALL 为 0

### Requirement: Prompt injection of extended defaults
`lib/prompts.js` 的系统提示构建逻辑 SHALL 将主题的完整 defaults（包括新增的 fontSize, fontStyle, edgeStyle, edgeRounded 等）注入到 LLM 系统提示中。

提示内容 SHALL 明确指导 LLM：
1. 使用主题指定的 fontFamily 和 fontSize 设置所有文本节点
2. 使用主题指定的 strokeWidth 设置所有形状和连线
3. 使用主题指定的 edgeStyle 设置所有连线路由
4. 如果主题 edgeRounded=1，连线 SHALL 设置 rounded=1

#### Constraint: DEFAULT_STYLE_LABELS update
`lib/prompts.js` 的 `DEFAULT_STYLE_LABELS` 对象 SHALL 新增以下标签映射：
- fontSize → '字号'
- fontStyle → '字体样式'
- edgeStyle → '连线路由'
- edgeRounded → '连线圆角'
- sketch → '手绘模式'
- dashed → '虚线'

#### Constraint: STYLE_GUIDELINES conflict resolution
`lib/prompts.js` 的 `STYLE_GUIDELINES` 常量中硬编码的"默认字体优先 Arial"和"strokeWidth=2"指令 SHALL 被替换为"遵循当前主题的默认样式设置"，以避免与主题 defaults 冲突。

#### Constraint: Prompt precedence
主题 section 提供默认样式指导。chart-type section 提供图表类型特定指导。当两者冲突时（如某图表类型更适合曲线但主题指定正交），chart-type 指导优先。

#### Scenario: LLM prompt includes font settings
- **WHEN** 构建 research 主题的系统提示
- **THEN** 提示文本 SHALL 包含 fontFamily='Helvetica, Arial, sans-serif' 和 fontSize=11 的指令

#### Scenario: LLM prompt includes edge style
- **WHEN** 构建 warm 主题的系统提示
- **THEN** 提示文本 SHALL 包含使用 curved 连线的指令

### Requirement: Theme engine applies non-color properties
`lib/theme-engine.js` 的 `applyTheme()` 函数 SHALL 在颜色映射之外，还应用目标主题的 fontFamily、fontSize、strokeWidth、edgeStyle、edgeRounded 属性到 XML 中的对应元素。

变换规则：
- fontFamily：替换所有 mxCell style 中的 fontFamily 值（缺失则插入，已有则替换）
- fontSize：替换所有 mxCell style 中的 fontSize 值（缺失则插入，已有则替换）
- strokeWidth：替换所有 mxCell style 中的 strokeWidth 值（缺失则插入，已有则替换）
- edgeStyle：仅替换边（有 source/target 属性的 mxCell）style 中的 edgeStyle 值
- edgeRounded：仅对边设置 rounded=<edgeRounded>，不影响节点的 arcSize/rounded

#### Constraint: Property scope
fontFamily、fontSize、fontStyle、strokeWidth 作用于所有 mxCell（顶点和边）。edgeStyle 和 edgeRounded 仅作用于边（isEdgeCell 返回 true 的元素）。

#### Constraint: Insertion vs replacement
对于非颜色属性，如果目标 mxCell 的 style 中不存在该 key，applyTheme SHALL 插入该属性。如果已存在，SHALL 替换为目标主题的值。

#### Constraint: Curved theme materialization
当目标主题使用 curved 连线（如 warm, pastel）时：
- 对所有边 SET `curved=1`
- 对所有边 REMOVE `edgeStyle`、`orthogonalLoop`、`jettySize`
当目标主题使用正交连线（如 research, business）时：
- 对所有边 SET `edgeStyle=<theme.defaults.edgeStyle>`
- 对所有边 REMOVE `curved`
- 如果主题 defaults.edgeRounded=1，SET `rounded=1`；否则 REMOVE `rounded`

#### Constraint: Precedence rules
主题 defaults 是基础层。Style presets（shadow, gradient 等）可覆盖主题 defaults。用户手动编辑覆盖一切。applyTheme() 不会覆盖 style presets 或用户手动设置的值——它仅在主题切换时应用。

#### Scenario: Theme switch updates font family
- **WHEN** 从 research 主题切换到 warm 主题
- **THEN** XML 中所有 mxCell 的 fontFamily SHALL 从 'Helvetica, Arial, sans-serif' 变为 'Georgia, serif'

#### Scenario: Theme switch updates edge style
- **WHEN** 从 research 主题切换到 warm 主题
- **THEN** XML 中所有边的 edgeStyle SHALL 被移除，curved SHALL 设为 1

### Requirement: Per-theme post-processing tricks
`lib/theme-postprocess.js` 的 `THEME_POSTPROCESSING_TRICKS` 映射 SHALL 为不同主题配置各自的后处理 trick 组合。

| 主题 | 后处理 tricks |
|------|-------------|
| research | orthogonalRouting, smartArrows, jumpCrossings |
| business | smartArrows |
| warm | smartArrows |
| cool | orthogonalRouting, smartArrows |
| dark | smartArrows |
| contrast | orthogonalRouting, smartArrows, jumpCrossings |
| pastel | smartArrows |
| forest | smartArrows |
| violet | smartArrows |
| neutral | smartArrows |

#### Constraint: Post-processing execution order
Tricks SHALL 按全局固定顺序执行：orthogonalRouting → smartArrows → jumpCrossings。此顺序适用于所有主题，不可更改。orthogonalRouting 先设置路由模式，smartArrows 再优化锚点，jumpCrossings 最后添加交叉标记。

#### Scenario: Research theme applies three tricks
- **WHEN** 对 research 主题的生成结果执行后处理
- **THEN** 系统 SHALL 依次应用 orthogonalRouting、smartArrows、jumpCrossings

#### Scenario: Business theme applies smartArrows only
- **WHEN** 对 business 主题的生成结果执行后处理
- **THEN** 系统 SHALL 仅应用 smartArrows

#### Scenario: Cool theme applies orthogonal routing and smart arrows
- **WHEN** 对 cool 主题的生成结果执行后处理
- **THEN** 系统 SHALL 依次应用 orthogonalRouting、smartArrows

## Property-Based Testing Invariants

### Requirement: applyTheme idempotency
对同一主题重复应用 SHALL 为幂等操作。

#### Scenario: Same theme identity
- **WHEN** `applyTheme(xml, A, A)` 被调用（源和目标主题相同）
- **THEN** 输出 XML SHALL 与输入 XML 完全相同

#### Scenario: Double application idempotent
- **WHEN** `applyTheme(applyTheme(xml, A, B), A, B)` 被调用
- **THEN** 结果 SHALL 与 `applyTheme(xml, A, B)` 完全相同（前提：映射的 image 与 domain 的交集是固定点）

### Requirement: applyTheme non-color preservation
`applyTheme` 的颜色映射 SHALL 不影响非颜色属性。

#### Scenario: Non-color keys unchanged by color remapping
- **WHEN** applyTheme 执行颜色映射
- **THEN** `{fillColor, strokeColor, fontColor, gradientColor, labelBackgroundColor}` 以外的所有 style key SHALL 保持不变

### Requirement: Curved-orthogonal theme switch completeness
主题切换 SHALL 完整清理前一主题的连线样式。

#### Scenario: Switch to curved theme removes orthogonal keys
- **WHEN** 从正交主题切换到 curved 主题（warm/pastel）
- **THEN** 所有边 SHALL 有 `curved=1`
- **AND** 所有边 SHALL 不含 `edgeStyle`、`orthogonalLoop`、`jettySize`

#### Scenario: Switch to orthogonal theme removes curved key
- **WHEN** 从 curved 主题切换到正交主题（research/business/cool）
- **THEN** 所有边 SHALL 有 `edgeStyle=<theme default>`
- **AND** 所有边 SHALL 不含 `curved`

### Requirement: Theme registry structural invariants

#### Scenario: All themes have exact 10 palette tokens
- **WHEN** 遍历所有 10 个主题
- **THEN** 每个主题的 `colorPalette` keys SHALL 恰好为 `{bg, surface, primary, accent, text, mutedText, success, warning, error, info}`

#### Scenario: All colorMapping keys match research palette
- **WHEN** 遍历所有非 research 主题
- **THEN** 每个主题的 `colorMapping` keys SHALL 包含 research 主题的全部 9 个基准颜色

#### Scenario: Semantic hue bounds preserved
- **WHEN** 遍历所有主题的 error 颜色
- **THEN** 色相 SHALL 在红色范围 [330°, 360°) ∪ [0°, 30°]
- **WHEN** 遍历所有主题的 warning 颜色
- **THEN** 色相 SHALL 在暖色范围 [30°, 60°]

### Requirement: parseStyle/stringifyStyle round-trip

#### Scenario: Round-trip for well-formed objects
- **WHEN** 对象 o 的所有 key 匹配 `/^\w+$/` 且 value 不含分号
- **THEN** `parseStyle(stringifyStyle(o))` SHALL 等于 o（排除 null/undefined 值后）

#### Scenario: Canonical form stabilization
- **WHEN** 对任意可解析的 style 字符串 s
- **THEN** `stringifyStyle(parseStyle(stringifyStyle(parseStyle(s))))` SHALL 等于 `stringifyStyle(parseStyle(s))`
