## ADDED Requirements

### Requirement: CodeEditor React.memo 优化
系统 SHALL 使用 React.memo 包装 CodeEditor 组件，防止不必要的重渲染。

#### Scenario: 父组件状态变化
- **WHEN** app/page.js 中与 CodeEditor 无关的状态变化（如 notification、modal 状态）
- **THEN** CodeEditor 组件 SHALL NOT 重新渲染

#### Scenario: 相关 props 变化
- **WHEN** code、jsonError、isGenerating 等相关 props 变化
- **THEN** CodeEditor 组件 SHALL 重新渲染

#### Scenario: 回调函数稳定性
- **WHEN** 传递给 CodeEditor 的 onChange、onApply 等回调
- **THEN** 这些回调 SHALL 使用 useCallback 包装以保持引用稳定

### Requirement: localStorage 写入防抖
系统 SHALL 对频繁的 localStorage 写入操作添加 500ms 防抖。

#### Scenario: 快速连续样式切换
- **WHEN** 用户在 500ms 内切换多次样式预设
- **THEN** 系统 SHALL 仅在最后一次操作后 500ms 写入 localStorage

#### Scenario: 配置保存
- **WHEN** 用户修改配置
- **THEN** 系统 SHALL 在 500ms 防抖后写入 localStorage

#### Scenario: 页面卸载
- **WHEN** 用户关闭页面且有待写入的数据
- **THEN** 系统 SHALL 立即同步写入（使用 beforeunload 事件）

### Requirement: 键盘快捷键
系统 SHALL 支持常用键盘快捷键提升操作效率。

#### Scenario: 发送消息快捷键
- **WHEN** 焦点在输入框且用户按下 Ctrl+Enter
- **THEN** 系统 SHALL 触发消息发送（等同于点击发送按钮）

#### Scenario: 撤销快捷键
- **WHEN** 用户按下 Ctrl+Z 且存在可撤销的历史
- **THEN** 系统 SHALL 执行撤销操作

#### Scenario: 重做快捷键
- **WHEN** 用户按下 Ctrl+Y 或 Ctrl+Shift+Z 且存在可重做的历史
- **THEN** 系统 SHALL 执行重做操作

#### Scenario: 应用代码快捷键
- **WHEN** 焦点在 CodeEditor 且用户按下 Ctrl+Enter
- **THEN** 系统 SHALL 触发"应用到画布"操作

#### Scenario: 快捷键冲突处理
- **WHEN** Monaco Editor 自身快捷键与应用快捷键冲突
- **THEN** 在 Editor 内部 SHALL 优先使用 Editor 的快捷键

### Requirement: loadDiagram 调用防抖
系统 SHALL 对 DrawioCanvas 的 loadDiagram 调用添加 300ms 防抖。

#### Scenario: 快速连续更新
- **WHEN** generatedXml 在 300ms 内多次变化
- **THEN** 系统 SHALL 仅发送最后一次的 XML 到 iframe

#### Scenario: 首次加载
- **WHEN** 组件首次挂载且 isReady 为 true
- **THEN** 系统 SHALL 立即加载 XML（不等待防抖）
