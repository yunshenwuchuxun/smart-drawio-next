## ADDED Requirements

### Requirement: API Key 加密存储
系统 SHALL 支持使用 TweetNaCl secretbox 加密 API Key 后存储到 localStorage。

#### Scenario: 启用加密
- **WHEN** 用户首次启用 API Key 加密功能
- **THEN** 系统 SHALL 提示用户设置主密码，并使用该密码派生加密密钥

#### Scenario: 保存加密配置
- **WHEN** 保存包含 API Key 的配置
- **THEN** 系统 SHALL 将 apiKey 字段替换为 `{ encrypted: base64, nonce: base64 }` 格式

#### Scenario: 读取加密配置
- **WHEN** 加载包含加密 API Key 的配置
- **THEN** 系统 SHALL 使用缓存的密钥解密 API Key 后使用

#### Scenario: 主密码验证
- **WHEN** 页面刷新后首次访问加密配置
- **THEN** 系统 SHALL 提示用户输入主密码进行验证

#### Scenario: 向后兼容
- **WHEN** 加载包含明文 API Key 的旧配置
- **THEN** 系统 SHALL 正常读取，不强制加密

### Requirement: POST 端点 Rate Limiting
系统 SHALL 对 `/api/generate`、`/api/configs`、`/api/models` 端点实施请求频率限制。

#### Scenario: 正常请求
- **WHEN** 同一 IP 在 1 分钟内发起少于 20 次请求
- **THEN** 系统 SHALL 正常处理请求

#### Scenario: 超出频率限制
- **WHEN** 同一 IP 在 1 分钟内发起超过 20 次请求
- **THEN** 系统 SHALL 返回 HTTP 429 状态码和 `Retry-After` 响应头

#### Scenario: 滑动窗口重置
- **WHEN** 距离该 IP 首次请求超过 1 分钟
- **THEN** 系统 SHALL 重置该 IP 的请求计数器

### Requirement: baseUrl 白名单校验
系统 SHALL 在 `/api/models` 端点验证 baseUrl 参数防止 SSRF 攻击。

#### Scenario: 允许的 baseUrl
- **WHEN** baseUrl 为以下域名之一：`api.openai.com`、`api.anthropic.com`、用户配置的自定义域名
- **THEN** 系统 SHALL 允许请求

#### Scenario: 禁止的 baseUrl
- **WHEN** baseUrl 为内网地址（如 `127.0.0.1`、`localhost`、`10.x.x.x`、`192.168.x.x`）
- **THEN** 系统 SHALL 返回 HTTP 400 错误并提示 "Invalid baseUrl"

#### Scenario: 禁止的协议
- **WHEN** baseUrl 使用非 HTTPS 协议（开发环境除外）
- **THEN** 系统 SHALL 返回 HTTP 400 错误

### Requirement: 移除敏感日志
系统 SHALL 在生产环境移除所有包含敏感数据的 console.log 语句。

#### Scenario: 生产环境日志
- **WHEN** NODE_ENV 为 production
- **THEN** 系统 SHALL 不在控制台输出 API Key、base64 图片数据、完整请求体等敏感信息

#### Scenario: 开发环境日志
- **WHEN** NODE_ENV 为 development
- **THEN** 系统 MAY 输出调试日志（但 API Key SHALL 始终脱敏显示为 `sk-***...***`）
