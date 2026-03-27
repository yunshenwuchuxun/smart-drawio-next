## ADDED Requirements

### Requirement: XML style parsing
ThemeEngine SHALL 能够解析 mxGraph XML 中所有 mxCell 元素的 style 属性。

style 属性格式为分号分隔的 key=value 对，例如：
`rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#2C3E50;shadow=1;`

#### Constraint: Style parsing tolerance (宽松模式)
样式解析器 MUST 使用宽松模式：
- 容忍 key/value 周围的空白（如 `key = value ;`）
- 跳过无法解析的 token（如缺少 `=`），保留有效部分
- 重复 key 时使用后值覆盖
- 未知 key 原样保留，不丢弃
- 解析器正则 SHOULD 支持：`\s*(\w+)\s*=\s*([^;]*?)\s*;?`

#### Scenario: Parse style attribute
- **WHEN** ThemeEngine 接收包含 `style="fillColor=#dae8fc;shadow=0;"` 的 mxCell
- **THEN** SHALL 解析为 `{ fillColor: '#dae8fc', shadow: '0' }` 对象

#### Scenario: Parse style with duplicates
- **WHEN** 解析 `style="shadow=0;fillColor=#abc;shadow=1;"`
- **THEN** 结果 SHALL 为 `{ shadow: '1', fillColor: '#abc' }`（后值覆盖）

#### Scenario: Parse malformed style
- **WHEN** 解析 `style="rounded=1;badtoken;fillColor=#fff;"`
- **THEN** 结果 SHALL 为 `{ rounded: '1', fillColor: '#fff' }`（跳过 badtoken）

### Requirement: Batch style modification
ThemeEngine SHALL 支持批量修改所有 mxCell 的指定样式属性。

`applyStyleChange(xml, changes)` 函数 MUST：
- 接受 XML 字符串和样式变更对象 `{ key: newValue }`
- 返回修改后的 XML 字符串
- 保持 XML 结构完整性

#### Scenario: Add shadow to all cells
- **WHEN** 调用 `applyStyleChange(xml, { shadow: '1' })`
- **THEN** 所有 mxCell 的 style 属性 SHALL 包含 `shadow=1`

#### Scenario: Remove gradient from all cells
- **WHEN** 调用 `applyStyleChange(xml, { gradientColor: null })`
- **THEN** 所有 mxCell 的 style 属性 SHALL 移除 `gradientColor` 键

### Requirement: Theme color mapping
ThemeEngine SHALL 支持根据主题配色方案批量替换颜色。

`applyTheme(xml, theme)` 函数 MUST：
- 将当前 XML 中的 fillColor/strokeColor 映射到目标主题的配色方案
- 保留语义颜色映射（如 success 色保持映射到 success 色）

#### Constraint: Unmapped color handling
遇到未在源主题映射表中的颜色时，系统 SHALL 保持原样不变。

#### Constraint: Color mapping table
每个主题 MUST 定义 `colorMapping` 对象，结构为 `{ sourceHex: targetHex }`，其中 sourceHex 是前一主题的颜色，targetHex 是目标主题的对应语义 Token 颜色。

颜色匹配 MUST 使用精确 Hex 匹配（大小写不敏感），不支持容差匹配。

#### Scenario: Switch from research to business theme
- **WHEN** 用户将主题从 "科研" 切换到 "商业"
- **THEN** 原本使用 `#F7F9FC`（科研主色）的元素 SHALL 变为 `#E3F2FD`（商业主色）

#### Scenario: Unmapped color preserved
- **WHEN** XML 中存在颜色 `#FF00FF`（不在任何主题映射中）
- **THEN** 该颜色 SHALL 保持为 `#FF00FF` 不变

### Requirement: XML error handling
ThemeEngine 的所有操作 MUST 实现以下错误处理策略：

#### Constraint: XML parse failure strategy
当 XML 解析失败时，系统 SHALL：
1. 中止当前操作
2. 返回原始未修改的 XML
3. 向调用者返回错误信息（但不抛出异常）
4. 在 UI 层显示警告提示："样式变换失败，已恢复原始图表"

### Requirement: Selective element targeting
ThemeEngine SHALL 支持通过选择器仅修改特定元素的样式。

`applyStyleToMatching(xml, selector, changes)` 函数 MUST：
- `selector.shape`: 匹配 style 中包含特定 shape 类型的元素（如 `ellipse`, `rhombus`）
- `selector.hasValue`: 匹配有/无 value 属性的元素

#### Scenario: Add shadow only to rectangles
- **WHEN** 调用 `applyStyleToMatching(xml, { shape: 'rounded' }, { shadow: '1' })`
- **THEN** 仅包含 `rounded=1` 的 mxCell SHALL 添加 `shadow=1`

### Requirement: XML structure preservation
ThemeEngine 的所有操作 MUST 保持 XML 结构完整性。

修改后的 XML MUST：
- 保持有效的 mxfile 结构
- 保留所有 mxCell 的 id、parent、source、target 属性
- 保留 mxGeometry 子元素

#### Scenario: Style change preserves structure
- **WHEN** 对包含 10 个 mxCell 的 XML 应用样式变更
- **THEN** 输出 XML SHALL 仍包含 10 个 mxCell，所有 id 和连接关系不变
