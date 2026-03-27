## ADDED Requirements

### Requirement: Undo/Redo 栈管理
系统 SHALL 维护一个最大容量为 20 的 XML 历史栈，支持撤销和重做操作。

#### Scenario: 执行撤销操作
- **WHEN** 用户点击 Undo 按钮或按下 Ctrl+Z
- **THEN** 系统 SHALL 将 historyIndex 减 1 并加载对应的 XML 到 CodeEditor 和 DrawioCanvas

#### Scenario: 执行重做操作
- **WHEN** 用户点击 Redo 按钮或按下 Ctrl+Y
- **THEN** 系统 SHALL 将 historyIndex 加 1 并加载对应的 XML 到 CodeEditor 和 DrawioCanvas

#### Scenario: 历史栈溢出
- **WHEN** xmlHistory 数组长度超过 20
- **THEN** 系统 SHALL 移除最早的记录（FIFO 策略）

#### Scenario: 撤销边界
- **WHEN** historyIndex 为 0 时用户尝试撤销
- **THEN** Undo 按钮 SHALL 被禁用，操作无效果

#### Scenario: 重做边界
- **WHEN** historyIndex 等于 xmlHistory.length - 1 时用户尝试重做
- **THEN** Redo 按钮 SHALL 被禁用，操作无效果

### Requirement: 新操作清除重做历史
系统 SHALL 在用户执行新操作（生成、应用样式、应用技巧）时清除 historyIndex 之后的所有历史记录。

#### Scenario: 撤销后执行新操作
- **WHEN** 用户撤销到某个历史状态后执行新的样式变更
- **THEN** 系统 SHALL 删除 historyIndex 之后的所有记录，并将新 XML 追加到历史栈末尾

### Requirement: 历史记录时机
系统 SHALL 在以下操作前自动记录当前 XML 到历史栈：样式预设切换、绘图技巧应用、重置样式。

#### Scenario: 应用样式预设
- **WHEN** 用户切换阴影/渐变/圆角/玻璃效果
- **THEN** 系统 SHALL 先将当前 XML 压入 xmlHistory，然后应用新样式

#### Scenario: 应用绘图技巧
- **WHEN** 用户点击网格对齐/智能箭头/标签背景/统一间距
- **THEN** 系统 SHALL 先将当前 XML 压入 xmlHistory，然后应用技巧
