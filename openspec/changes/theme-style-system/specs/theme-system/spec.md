## ADDED Requirements

### Requirement: Theme definition structure
系统 SHALL 内置两种主题定义：`research`（科研主题）和 `business`（商业主题）。

每个主题 MUST 包含：
- `id`: 唯一标识符（kebab-case）
- `name`: 显示名称（中文）
- `promptFragment`: 注入到 LLM system prompt 的样式规范片段
- `colorPalette`: 使用语义 Token 的配色方案对象
- `defaults`: 默认样式属性（shadow, gradient, arcSize, strokeWidth, fontFamily）

#### Constraint: Semantic color tokens
每个主题的 `colorPalette` MUST 使用以下语义 Token 结构：

```javascript
colorPalette: {
  // 核心语义 Token
  bg: '#FFFFFF',           // 背景色
  surface: '#F7F9FC',      // 表面/容器填充色
  primary: '#2C3E50',      // 主色调（边框/强调）
  accent: '#3498DB',       // 强调色
  text: '#2C3E50',         // 主文本色
  mutedText: '#7F8C8D',    // 次级文本色

  // 语义状态色
  success: '#d5e8d4',      // 成功/完成
  warning: '#fff2cc',      // 警告/注意
  error: '#f8cecc',        // 错误/失败
  info: '#dae8fc',         // 信息/中性
}
```

#### Constraint: Prompt color format
主题的 `promptFragment` MUST 明确指示 LLM 只输出 6 位 Hex 格式颜色（#RRGGBB），禁止 rgb()/hsl()/命名色。

#### Scenario: Research theme loaded
- **WHEN** 系统初始化
- **THEN** `research` 主题可用，包含灰度系配色和禁用阴影/渐变的默认值

#### Scenario: Business theme loaded
- **WHEN** 系统初始化
- **THEN** `business` 主题可用，包含蓝色系渐变配色和启用阴影的默认值

### Requirement: Theme selection UI
用户 SHALL 能够在图表生成前通过下拉选择器选择主题。

主题选择器 MUST 显示在 Chat 组件的图表类型选择器附近。

#### Scenario: User selects theme before generation
- **WHEN** 用户在主题选择器中选择 "商业主题"
- **AND** 用户输入描述并点击生成
- **THEN** 生成的图表 SHALL 符合商业主题的视觉规范

### Requirement: Theme persistence
系统 SHALL 将用户的主题选择持久化到 localStorage。

存储键为 `smart-excalidraw-theme`，值为主题 id。

#### Scenario: Theme selection persisted across sessions
- **WHEN** 用户选择 "商业主题" 并刷新页面
- **THEN** 主题选择器 SHALL 显示 "商业主题" 为当前选择

### Requirement: Dynamic prompt assembly
系统 SHALL 根据选定主题动态组装 LLM system prompt。

`lib/prompts.js` 中的 `buildSystemPrompt(theme)` 函数 MUST：
- 接受主题对象作为参数
- 返回包含主题 `promptFragment` 的完整 system prompt

#### Scenario: Prompt includes theme fragment
- **WHEN** 用户选择 "科研主题" 并生成图表
- **THEN** 发送给 LLM 的 system prompt MUST 包含科研主题的绘图规范片段
