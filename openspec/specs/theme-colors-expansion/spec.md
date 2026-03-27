## MODIFIED Requirements

### Requirement: Color mapping completeness
每个主题的 colorMapping MUST 包含 9 个基准颜色的映射。

由于 research 主题 colorPalette 更新为 Okabe-Ito 色盲安全配色，基准颜色 SHALL 变更为：
- `#FFFFFF`: 纯白背景
- `#F0F4F8`: research 主题新 surface 色
- `#1A1A2E`: research 主题新 primary/text 色
- `#0072B2`: research 主题新 info/accent 色（Okabe-Ito 蓝）
- `#009E73`: research 主题新 success 色（Okabe-Ito 绿）
- `#E69F00`: research 主题新 warning 色（Okabe-Ito 橙）
- `#D55E00`: research 主题新 error 色（Okabe-Ito 深橙红）
- `#56B4E9`: research 主题新 accent 色（Okabe-Ito 浅蓝）
- `#000000`: 纯黑文字

#### Scenario: Complete color mapping available with new base colors
- **WHEN** 从 research 主题切换到任意其他主题
- **THEN** 所有 9 个新基准颜色 SHALL 被正确映射到目标主题颜色

#### Constraint: Clean break migration
系统不支持旧 research 基准颜色（#2C3E50, #dae8fc, #d5e8d4 等）的向后兼容。这是一次性迁移，所有 colorMapping 使用新 Okabe-Ito 颜色作为唯一映射源。

#### Constraint: colorMapping source of truth
颜色映射使用每个主题文件中显式定义的 `colorMapping` 对象（当前行为）。`getColorMapping()` 函数从 `colorPalette` token 动态计算的映射仅作为补充。

#### Constraint: CHART_VISUAL_SPECS sync required
`openspec/specs/chart-type-prompts/spec.md` 中 CHART_VISUAL_SPECS 硬编码的旧 research 颜色（#dae8fc, #d5e8d4, #fff2cc, #f8cecc, #2C3E50, #F7F9FC）SHALL 同步更新为新 Okabe-Ito 颜色。此为迁移任务，需在 tasks.md 中体现。

### Requirement: Warm theme definition
系统 SHALL 提供暖色系主题（id: 'warm'），使用橙/红/黄为主色调。

#### Constraint: Warm theme color mapping
colorMapping MUST 使用新 research 基准颜色作为映射源：
```
#FFFFFF → #FFFFFF
#F0F4F8 → #FFF6EE
#1A1A2E → #3B1F16
#0072B2 → #3D8BFF
#009E73 → #3FBF7F
#E69F00 → #FFB000
#D55E00 → #E53935
#56B4E9 → #FF6A3D
#000000 → #3B1F16
```

#### Constraint: Warm theme defaults
defaults MUST 为：shadow=true, gradient=false, arcSize=10, strokeWidth=2, fontFamily='Georgia, serif', fontSize=13, fontStyle=0, sketch=0, edgeStyle=undefined (使用 curved=1), edgeRounded=1

#### Scenario: Warm theme loaded
- **WHEN** 用户选择暖色系主题
- **THEN** 系统 SHALL 加载 warm 主题配置
- **AND** 生成的图表 SHALL 使用橙/红/黄色系配色和 Georgia 衬线字体

### Requirement: Cool theme definition
系统 SHALL 提供冷色系主题（id: 'cool'），使用绿/青/紫为主色调。

#### Constraint: Cool theme color mapping
colorMapping MUST 使用新 research 基准颜色作为映射源（保持目标色不变）。

#### Constraint: Cool theme defaults
defaults MUST 为：shadow=false, gradient=false, arcSize=0, strokeWidth=1.5, fontFamily='Inter, system-ui, sans-serif', fontSize=12, fontStyle=0, sketch=0, edgeStyle='orthogonalEdgeStyle', edgeRounded=0

#### Scenario: Cool theme loaded
- **WHEN** 用户选择冷色系主题
- **THEN** 系统 SHALL 加载 cool 主题配置
- **AND** 生成的图表 SHALL 使用绿/青/紫色系配色和 Inter 字体

### Requirement: Dark theme definition
系统 SHALL 提供深色模式主题（id: 'dark'），使用暗色背景浅色文字。

#### Constraint: Dark theme defaults
defaults MUST 为：shadow=true, gradient=false, arcSize=10, strokeWidth=1.5, fontFamily='Segoe UI, system-ui, sans-serif', fontSize=12, fontStyle=0, sketch=0, edgeStyle='orthogonalEdgeStyle', edgeRounded=1

#### Scenario: Dark theme loaded
- **WHEN** 用户选择深色模式主题
- **THEN** 系统 SHALL 加载 dark 主题配置
- **AND** 生成的图表 SHALL 使用暗色背景和浅色元素

### Requirement: Contrast theme definition
系统 SHALL 提供高对比度主题（id: 'contrast'），使用纯黑白配色。

#### Constraint: Contrast theme defaults
defaults MUST 为：shadow=false, gradient=false, arcSize=0, strokeWidth=2, fontFamily='Arial, sans-serif', fontSize=12, fontStyle=0, sketch=0, edgeStyle='orthogonalEdgeStyle', edgeRounded=0

#### Scenario: Contrast theme loaded
- **WHEN** 用户选择高对比度主题
- **THEN** 系统 SHALL 加载 contrast 主题配置
- **AND** 生成的图表 SHALL 使用纯黑白配色，无任何装饰效果

### Requirement: Pastel theme definition
系统 SHALL 提供柔和粉彩主题（id: 'pastel'），使用低饱和马卡龙色。

#### Constraint: Pastel theme defaults
defaults MUST 为：shadow=false, gradient=false, arcSize=10, strokeWidth=1.5, fontFamily='Quicksand, Nunito, sans-serif', fontSize=13, fontStyle=0, sketch=0, edgeStyle=undefined (使用 curved=1), edgeRounded=1

#### Scenario: Pastel theme loaded
- **WHEN** 用户选择柔和粉彩主题
- **THEN** 系统 SHALL 加载 pastel 主题配置
- **AND** 生成的图表 SHALL 使用马卡龙配色和 Quicksand 字体

### Requirement: Forest theme definition
系统 SHALL 提供森林绿系主题（id: 'forest'），以绿色为主色调。

#### Constraint: Forest theme defaults
defaults MUST 为：shadow=false, gradient=false, arcSize=0, strokeWidth=1.5, fontFamily='Lato, sans-serif', fontSize=12, fontStyle=0, sketch=0, edgeStyle='orthogonalEdgeStyle', edgeRounded=0

#### Scenario: Forest theme loaded
- **WHEN** 用户选择森林绿系主题
- **THEN** 系统 SHALL 加载 forest 主题配置
- **AND** 生成的图表 SHALL 使用绿色系配色和 Lato 字体

### Requirement: Violet theme definition
系统 SHALL 提供紫罗兰系主题（id: 'violet'），以紫色为主色调。

#### Constraint: Violet theme defaults
defaults MUST 为：shadow=true, gradient=false, arcSize=10, strokeWidth=2, fontFamily='Poppins, sans-serif', fontSize=13, fontStyle=0, sketch=0, edgeStyle='orthogonalEdgeStyle', edgeRounded=1

#### Scenario: Violet theme loaded
- **WHEN** 用户选择紫罗兰系主题
- **THEN** 系统 SHALL 加载 violet 主题配置
- **AND** 生成的图表 SHALL 使用紫色系配色和 Poppins 字体

### Requirement: Neutral theme definition
系统 SHALL 提供中性灰阶主题（id: 'neutral'），使用多层次灰色。

#### Constraint: Neutral theme defaults
defaults MUST 为：shadow=false, gradient=false, arcSize=0, strokeWidth=1.5, fontFamily='system-ui, sans-serif', fontSize=12, fontStyle=0, sketch=0, edgeStyle='elbowEdgeStyle', edgeRounded=0

#### Scenario: Neutral theme loaded
- **WHEN** 用户选择中性灰阶主题
- **THEN** 系统 SHALL 加载 neutral 主题配置
- **AND** 生成的图表 SHALL 使用灰阶配色和 system-ui 字体

### Requirement: Style presets support new themes
`lib/style-presets.js` 的 `getPresetDefaults(themeId)` 函数 SHALL 为所有主题返回合适的预设默认值。

#### Scenario: Research theme preset defaults
- **WHEN** 调用 getPresetDefaults('research')
- **THEN** 返回 { shadow: false, gradient: false, rounded: false, glass: false }

## ADDED Requirements

### Requirement: Research theme Okabe-Ito color palette
`lib/themes/research.js` 的 colorPalette SHALL 使用 Okabe-Ito 色盲安全配色方案。

colorPalette MUST 使用以下精确值：
```
bg: #FFFFFF
surface: #F0F4F8
primary: #1A1A2E
accent: #56B4E9
text: #1A1A2E
mutedText: #525252
success: #009E73
warning: #E69F00
error: #D55E00
info: #0072B2
```

配色依据：
- Okabe-Ito 方案是色觉缺陷友好的标准配色（Nature, Science 推荐）
- primary/text 使用深色以确保打印和灰度下的可读性
- accent (#56B4E9) 和 info (#0072B2) 使用两种蓝色深浅区分
- success (#009E73) 使用蓝绿色而非纯绿色，避免红绿色盲混淆
- warning (#E69F00) 和 error (#D55E00) 使用橙色和深橙红色，色相有区分且灰度下亮度不同

#### Scenario: Research palette is colorblind-safe
- **WHEN** 加载 research 主题
- **THEN** colorPalette 的所有语义色 SHALL 在常见色觉缺陷类型（protanopia, deuteranopia, tritanopia）下可区分

### Requirement: Research theme academic visual defaults
`lib/themes/research.js` 的 defaults SHALL 使用 Nature/Science 论文插图规范的视觉属性。

defaults MUST 使用以下值：
```
shadow: false
gradient: false
arcSize: 0
strokeWidth: 1
fontFamily: 'Helvetica, Arial, sans-serif'
fontSize: 11
fontStyle: 0
sketch: 0
dashed: 0
edgeStyle: 'orthogonalEdgeStyle'
edgeRounded: 0
```

#### Scenario: Research theme has thin strokes
- **WHEN** 加载 research 主题
- **THEN** defaults.strokeWidth SHALL 为 1

#### Scenario: Research theme has sharp corners
- **WHEN** 加载 research 主题
- **THEN** defaults.arcSize SHALL 为 0
- **AND** defaults.edgeRounded SHALL 为 0

#### Scenario: Research theme uses Helvetica
- **WHEN** 加载 research 主题
- **THEN** defaults.fontFamily SHALL 为 'Helvetica, Arial, sans-serif'
- **AND** defaults.fontSize SHALL 为 11

### Requirement: Research theme enhanced prompt fragment
`lib/themes/research.js` 的 promptFragment SHALL 包含强化的 Nature/IEEE/ACM 学术论文插图规范指令。

promptFragment MUST 指导 LLM：
1. 使用 strokeWidth=1 的细线条（学术标准 0.5-1pt）
2. 不添加任何装饰效果（shadow=0, glass=0, gradient=none）
3. 使用直角（rounded=0, arcSize=0）表达精确感
4. 使用 Okabe-Ito 色盲安全配色
5. 所有连线使用 orthogonalEdgeStyle（正交直角折线）
6. 字号 11pt，字体 Helvetica
7. 布局对齐到 10px 网格，元素间距 40-60px

#### Constraint: Remove old prompt content
旧 promptFragment 中关于 arcSize=8 圆角卡片、多色语义图例等指导 SHALL 被删除。Method-overview 图表仍可使用 swimlane 结构层次，但改为直角（arcSize=0）。

#### Constraint: PRESET_DEFAULTS for research
`lib/style-presets.js` 的 `PRESET_DEFAULTS` SHALL 新增 research 条目：`{ shadow: false, gradient: false, rounded: false, glass: false }`。此行为与当前"缺失条目默认全 false"一致，无实际行为变化，但显式声明更清晰。

#### Scenario: Research prompt contains academic keywords
- **WHEN** 构建 research 主题的系统提示
- **THEN** promptFragment SHALL 包含 "strokeWidth" 和 "Helvetica" 和 "orthogonalEdgeStyle" 关键词
