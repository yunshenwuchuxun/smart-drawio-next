## ADDED Requirements

### Requirement: Save 事件同步
系统 SHALL 监听 Draw.io iframe 的 save 事件，并将用户编辑后的 XML 同步回 CodeEditor。

#### Scenario: 用户在 Draw.io 中保存
- **WHEN** 用户在 Draw.io 中点击保存或触发 autosave
- **THEN** 系统 SHALL 更新 generatedCode 和 generatedXml 状态为 save 事件返回的 XML

#### Scenario: 同步触发历史记录
- **WHEN** save 事件返回的 XML 与当前 generatedXml 不同
- **THEN** 系统 SHALL 将旧 XML 压入 xmlHistory 后再更新状态

### Requirement: PNG 导出功能
系统 SHALL 支持将当前 Draw.io 图表导出为 PNG 格式。

#### Scenario: 导出 PNG
- **WHEN** 用户点击"导出 PNG"按钮
- **THEN** 系统 SHALL 向 iframe 发送 `{ action: 'export', format: 'png' }` 消息

#### Scenario: 接收 PNG 数据
- **WHEN** iframe 返回 export 事件包含 PNG base64 数据
- **THEN** 系统 SHALL 创建 Blob 并触发浏览器下载，文件名为 `diagram-{timestamp}.png`

### Requirement: SVG 导出功能
系统 SHALL 支持将当前 Draw.io 图表导出为 SVG 格式。

#### Scenario: 导出 SVG
- **WHEN** 用户点击"导出 SVG"按钮
- **THEN** 系统 SHALL 向 iframe 发送 `{ action: 'export', format: 'svg' }` 消息

#### Scenario: 接收 SVG 数据
- **WHEN** iframe 返回 export 事件包含 SVG 数据
- **THEN** 系统 SHALL 创建 Blob 并触发浏览器下载，文件名为 `diagram-{timestamp}.svg`

### Requirement: postMessage 安全加固
系统 SHALL 使用明确的 targetOrigin 替代通配符，并验证消息来源。

#### Scenario: 发送消息
- **WHEN** 系统向 Draw.io iframe 发送 postMessage
- **THEN** targetOrigin SHALL 为 `https://embed.diagrams.net` 或环境变量 `DRAWIO_ORIGIN` 的值

#### Scenario: 接收消息验证
- **WHEN** 系统收到 postMessage 事件
- **THEN** 系统 SHALL 验证 event.origin 匹配允许的来源后才处理消息

#### Scenario: 来源不匹配
- **WHEN** 收到的消息 origin 不在允许列表中
- **THEN** 系统 SHALL 忽略该消息并在开发模式下打印警告
