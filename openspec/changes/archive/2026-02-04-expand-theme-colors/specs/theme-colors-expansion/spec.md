## ADDED Requirements

### Requirement: Semantic color strategy
系统 SHALL 采用混合语义色策略：
- error/warning 颜色 MUST 保持标准色调（红色/黄橙色），仅调整饱和度和亮度适配主题
- success/info 颜色 MAY 融入主题色系

#### Scenario: Error color maintains red tone across themes
- **WHEN** 任意主题被加载
- **THEN** error 颜色 SHALL 保持红色调（色相 0-30° 或 330-360°）

#### Scenario: Warning color maintains warm tone across themes
- **WHEN** 任意主题被加载
- **THEN** warning 颜色 SHALL 保持暖色调（色相 30-60°，黄橙色范围）

### Requirement: Color mapping completeness
每个主题的 colorMapping MUST 包含 9 个基准颜色的映射：
- `#FFFFFF`: 纯白背景
- `#F7F9FC`: research 主题 surface 色
- `#2C3E50`: research 主题 primary/text 色
- `#dae8fc`: research 主题 info 色（蓝色语义）
- `#d5e8d4`: research 主题 success 色（绿色语义）
- `#fff2cc`: research 主题 warning 色（黄色语义）
- `#f8cecc`: research 主题 error 色（红色语义）
- `#3498DB`: research 主题 accent 色
- `#000000`: 纯黑文字

#### Scenario: Complete color mapping available
- **WHEN** 从 research 主题切换到任意其他主题
- **THEN** 所有 9 个基准颜色 SHALL 被正确映射到目标主题颜色

### Requirement: Warm theme definition
系统 SHALL 提供暖色系主题（id: 'warm'），使用橙/红/黄为主色调。

#### Constraint: Warm theme color palette
colorPalette MUST 使用以下精确值：
```
bg: #FFF6EE
surface: #FFFFFF
primary: #FF6A3D
accent: #D72638
text: #3B1F16
mutedText: #8A5A44
success: #3FBF7F
warning: #FFB000
error: #E53935
info: #3D8BFF
```

#### Constraint: Warm theme color mapping
colorMapping MUST 使用以下映射：
```
#FFFFFF → #FFFFFF
#F7F9FC → #FFF6EE
#2C3E50 → #3B1F16
#dae8fc → #FFE0CC
#d5e8d4 → #D7F5E6
#fff2cc → #FFE7A3
#f8cecc → #FFD1D1
#3498DB → #FF6A3D
#000000 → #3B1F16
```

#### Constraint: Warm theme defaults
defaults MUST 为：shadow=true, gradient=false, arcSize=10, strokeWidth=2, fontFamily='Arial'

#### Scenario: Warm theme loaded
- **WHEN** 用户选择暖色系主题
- **THEN** 系统 SHALL 加载 warm 主题配置
- **AND** 生成的图表 SHALL 使用橙/红/黄色系配色

### Requirement: Cool theme definition
系统 SHALL 提供冷色系主题（id: 'cool'），使用绿/青/紫为主色调。

#### Constraint: Cool theme color palette
colorPalette MUST 使用以下精确值：
```
bg: #F2FBFA
surface: #FFFFFF
primary: #00A6A6
accent: #6C5CE7
text: #103A4A
mutedText: #4B6B75
success: #2BBF9E
warning: #F4B400
error: #E53935
info: #2D9CDB
```

#### Constraint: Cool theme color mapping
colorMapping MUST 使用以下映射：
```
#FFFFFF → #FFFFFF
#F7F9FC → #F2FBFA
#2C3E50 → #103A4A
#dae8fc → #D9F0FF
#d5e8d4 → #D1F2EA
#fff2cc → #FFF0B8
#f8cecc → #FFD6D6
#3498DB → #2D9CDB
#000000 → #103A4A
```

#### Constraint: Cool theme defaults
defaults MUST 为：shadow=false, gradient=false, arcSize=0, strokeWidth=2, fontFamily='Arial'

#### Scenario: Cool theme loaded
- **WHEN** 用户选择冷色系主题
- **THEN** 系统 SHALL 加载 cool 主题配置
- **AND** 生成的图表 SHALL 使用绿/青/紫色系配色

### Requirement: Dark theme definition
系统 SHALL 提供深色模式主题（id: 'dark'），使用暗色背景浅色文字。

#### Constraint: Dark theme uses high-brightness semantic colors
深色模式的语义色 MUST 使用高亮度变体以确保在暗色背景上的可见性。

#### Constraint: Dark theme color palette
colorPalette MUST 使用以下精确值：
```
bg: #0B0F14
surface: #151A22
primary: #3D7EFF
accent: #FFB020
text: #F5F7FA
mutedText: #A0AEC0
success: #2EE59D
warning: #FFD166
error: #FF5C5C
info: #4CC9F0
```

#### Constraint: Dark theme color mapping
colorMapping MUST 使用以下映射（注意：浅色映射到深色，深色映射到浅色）：
```
#FFFFFF → #0B0F14
#F7F9FC → #151A22
#2C3E50 → #F5F7FA
#dae8fc → #1F3B66
#d5e8d4 → #133A2A
#fff2cc → #4A3A14
#f8cecc → #4A1E1E
#3498DB → #3D7EFF
#000000 → #F5F7FA
```

#### Constraint: Dark theme defaults
defaults MUST 为：shadow=true, gradient=false, arcSize=10, strokeWidth=2, fontFamily='Arial'

#### Scenario: Dark theme loaded
- **WHEN** 用户选择深色模式主题
- **THEN** 系统 SHALL 加载 dark 主题配置
- **AND** 生成的图表 SHALL 使用暗色背景和浅色元素

### Requirement: Contrast theme definition
系统 SHALL 提供高对比度主题（id: 'contrast'），使用纯黑白配色。

#### Constraint: Contrast theme color palette
colorPalette MUST 使用以下精确值：
```
bg: #FFFFFF
surface: #FFFFFF
primary: #000000
accent: #000000
text: #000000
mutedText: #000000
success: #008000
warning: #FFB000
error: #C00000
info: #0000FF
```

#### Constraint: Contrast theme color mapping
colorMapping MUST 使用以下映射（语义填充色映射为白色以保持高对比度）：
```
#FFFFFF → #FFFFFF
#F7F9FC → #FFFFFF
#2C3E50 → #000000
#dae8fc → #FFFFFF
#d5e8d4 → #FFFFFF
#fff2cc → #FFFFFF
#f8cecc → #FFFFFF
#3498DB → #000000
#000000 → #000000
```

#### Constraint: Contrast theme defaults
defaults MUST 为：shadow=false, gradient=false, arcSize=0, strokeWidth=2, fontFamily='Arial'

#### Scenario: Contrast theme loaded
- **WHEN** 用户选择高对比度主题
- **THEN** 系统 SHALL 加载 contrast 主题配置
- **AND** 生成的图表 SHALL 使用纯黑白配色，适合打印和无障碍访问

### Requirement: Pastel theme definition
系统 SHALL 提供柔和粉彩主题（id: 'pastel'），使用低饱和马卡龙色。

#### Constraint: Pastel theme color palette
colorPalette MUST 使用以下精确值：
```
bg: #FFF7FB
surface: #FFFFFF
primary: #FF8FB1
accent: #8EC5FF
text: #2F2F2F
mutedText: #7A7A7A
success: #8FE3A1
warning: #FFE08A
error: #FF8A8A
info: #A7B5FF
```

#### Constraint: Pastel theme color mapping
colorMapping MUST 使用以下映射：
```
#FFFFFF → #FFFFFF
#F7F9FC → #FFF7FB
#2C3E50 → #2F2F2F
#dae8fc → #E6F0FF
#d5e8d4 → #E6F7EA
#fff2cc → #FFF4D6
#f8cecc → #FFE3E3
#3498DB → #8EC5FF
#000000 → #2F2F2F
```

#### Constraint: Pastel theme defaults
defaults MUST 为：shadow=false, gradient=false, arcSize=10, strokeWidth=2, fontFamily='Arial'

#### Scenario: Pastel theme loaded
- **WHEN** 用户选择柔和粉彩主题
- **THEN** 系统 SHALL 加载 pastel 主题配置
- **AND** 生成的图表 SHALL 使用低饱和度的马卡龙配色

### Requirement: Forest theme definition
系统 SHALL 提供森林绿系主题（id: 'forest'），以绿色为主色调。

#### Constraint: Forest theme color palette
colorPalette MUST 使用以下精确值：
```
bg: #F3FAF4
surface: #FFFFFF
primary: #1B5E20
accent: #7A9B3A
text: #102316
mutedText: #4D6A57
success: #2E7D32
warning: #F4A900
error: #D32F2F
info: #2A8C7A
```

#### Constraint: Forest theme color mapping
colorMapping MUST 使用以下映射：
```
#FFFFFF → #FFFFFF
#F7F9FC → #F3FAF4
#2C3E50 → #102316
#dae8fc → #D9F2E6
#d5e8d4 → #DDF3DF
#fff2cc → #FFF0C2
#f8cecc → #FFD7D7
#3498DB → #2A8C7A
#000000 → #102316
```

#### Constraint: Forest theme defaults
defaults MUST 为：shadow=false, gradient=false, arcSize=0, strokeWidth=2, fontFamily='Arial'

#### Scenario: Forest theme loaded
- **WHEN** 用户选择森林绿系主题
- **THEN** 系统 SHALL 加载 forest 主题配置
- **AND** 生成的图表 SHALL 使用绿色系自然配色

### Requirement: Violet theme definition
系统 SHALL 提供紫罗兰系主题（id: 'violet'），以紫色为主色调。

#### Constraint: Violet theme color palette
colorPalette MUST 使用以下精确值：
```
bg: #F7F2FF
surface: #FFFFFF
primary: #7C3AED
accent: #DB2777
text: #2A124A
mutedText: #6B4E8A
success: #2BBF9E
warning: #F4B400
error: #E53935
info: #5B8CFF
```

#### Constraint: Violet theme color mapping
colorMapping MUST 使用以下映射：
```
#FFFFFF → #FFFFFF
#F7F9FC → #F7F2FF
#2C3E50 → #2A124A
#dae8fc → #E9DDFF
#d5e8d4 → #DFF5EE
#fff2cc → #FFF1B8
#f8cecc → #FFD6D6
#3498DB → #5B8CFF
#000000 → #2A124A
```

#### Constraint: Violet theme defaults
defaults MUST 为：shadow=true, gradient=false, arcSize=10, strokeWidth=2, fontFamily='Arial'

#### Scenario: Violet theme loaded
- **WHEN** 用户选择紫罗兰系主题
- **THEN** 系统 SHALL 加载 violet 主题配置
- **AND** 生成的图表 SHALL 使用紫色系配色

### Requirement: Neutral theme definition
系统 SHALL 提供中性灰阶主题（id: 'neutral'），使用多层次灰色。

#### Constraint: Neutral theme color palette
colorPalette MUST 使用以下精确值：
```
bg: #F3F4F6
surface: #FFFFFF
primary: #4B5563
accent: #111827
text: #111827
mutedText: #6B7280
success: #16A34A
warning: #F59E0B
error: #EF4444
info: #3B82F6
```

#### Constraint: Neutral theme color mapping
colorMapping MUST 使用以下映射：
```
#FFFFFF → #FFFFFF
#F7F9FC → #F3F4F6
#2C3E50 → #111827
#dae8fc → #E5E7EB
#d5e8d4 → #DCFCE7
#fff2cc → #FEF3C7
#f8cecc → #FEE2E2
#3498DB → #3B82F6
#000000 → #111827
```

#### Constraint: Neutral theme defaults
defaults MUST 为：shadow=false, gradient=false, arcSize=0, strokeWidth=2, fontFamily='Arial'

#### Scenario: Neutral theme loaded
- **WHEN** 用户选择中性灰阶主题
- **THEN** 系统 SHALL 加载 neutral 主题配置
- **AND** 生成的图表 SHALL 使用多层次灰色配色

### Requirement: Theme index exports all themes
`lib/themes/index.js` SHALL 导出所有 10 个主题。

导出 MUST 包含：
- themes 对象：包含所有主题的键值对
- getTheme(id) 函数：根据 id 获取主题
- getAllThemes() 函数：获取所有主题数组
- DEFAULT_THEME_ID 常量：保持为 'research'

#### Scenario: All themes accessible
- **WHEN** 调用 getAllThemes()
- **THEN** 返回数组 SHALL 包含 10 个主题对象
- **AND** 每个主题 SHALL 包含完整的 id, name, promptFragment, colorPalette, defaults, colorMapping

### Requirement: Style presets support new themes
`lib/style-presets.js` 的 `getPresetDefaults(themeId)` 函数 SHALL 为所有新主题返回合适的预设默认值。

#### Scenario: Warm theme preset defaults
- **WHEN** 调用 getPresetDefaults('warm')
- **THEN** 返回 { shadow: true, gradient: false, rounded: true, glass: false }

#### Scenario: Cool theme preset defaults
- **WHEN** 调用 getPresetDefaults('cool')
- **THEN** 返回 { shadow: false, gradient: false, rounded: false, glass: false }

#### Scenario: Dark theme preset defaults
- **WHEN** 调用 getPresetDefaults('dark')
- **THEN** 返回 { shadow: true, gradient: false, rounded: true, glass: false }

#### Scenario: Contrast theme preset defaults
- **WHEN** 调用 getPresetDefaults('contrast')
- **THEN** 返回 { shadow: false, gradient: false, rounded: false, glass: false }

#### Scenario: Pastel theme preset defaults
- **WHEN** 调用 getPresetDefaults('pastel')
- **THEN** 返回 { shadow: false, gradient: false, rounded: true, glass: false }

#### Scenario: Forest theme preset defaults
- **WHEN** 调用 getPresetDefaults('forest')
- **THEN** 返回 { shadow: false, gradient: false, rounded: false, glass: false }

#### Scenario: Violet theme preset defaults
- **WHEN** 调用 getPresetDefaults('violet')
- **THEN** 返回 { shadow: true, gradient: false, rounded: true, glass: false }

#### Scenario: Neutral theme preset defaults
- **WHEN** 调用 getPresetDefaults('neutral')
- **THEN** 返回 { shadow: false, gradient: false, rounded: false, glass: false }
