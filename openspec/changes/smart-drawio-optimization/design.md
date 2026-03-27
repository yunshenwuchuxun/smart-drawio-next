## Context

Smart Drawio Next 是一个 Next.js 16 + React 19 应用，通过 LLM API 生成 Draw.io 图表。当前架构存在以下问题：

**错误恢复**：`app/page.js` 中 `xmlHistory` 状态仅在样式/技巧操作时写入，从未被消费实现 Undo/Redo。截断检测使用字符串匹配而非 DOM 验证，续写无重试限制。

**通信架构**：`DrawioCanvas.jsx` 仅实现单向 postMessage（load action），save/export 事件已监听但回调为空。用户在 iframe 中的编辑无法同步回应用。

**安全现状**：postMessage 使用 `'*'` targetOrigin，API Key 明文存储于 localStorage，POST 端点无 Rate Limiting。

**性能瓶颈**：`app/page.js` 包含 54 个 useState，CodeEditor 未 memo 导致每次父组件更新都重新挂载 Monaco Editor。

## Goals / Non-Goals

**Goals:**
- 实现完整的 Undo/Redo 栈（最多 20 条历史）
- XML 截断自动修复算法
- Draw.io 双向通信 + 导出功能
- 搭建测试基础设施（Vitest + Playwright）
- 修复关键安全漏洞
- 优化渲染性能

**Non-Goals:**
- 不迁移到 TypeScript（采用 JSDoc + Zod 渐进式方案）
- 不重构 app/page.js 状态管理架构（仅优化关键路径）
- 不实现离线模式
- 不添加用户认证系统

## Decisions

### Decision 1: Undo/Redo 栈实现方案
**选择**: 基于现有 `xmlHistory` 状态扩展，添加 `historyIndex` 指针
**替代方案**:
- 引入 immer + use-immer：过度设计，仅需简单栈操作
- 使用 zustand 中间件：需要重构整体状态管理
**理由**: 最小改动，复用现有数据结构

### Decision 2: XML 修复算法策略
**选择**: 基于正则匹配检测缺失的闭合标签，按层级顺序补全
**层级**: `</root>` → `</mxGraphModel>` → `</diagram>` → `</mxfile>`
**替代方案**:
- 使用 DOMParser 严格解析：无法处理不完整 XML
- 流式解析器（sax-js）：引入额外依赖
**理由**: 轻量级，覆盖 90%+ 截断场景

### Decision 3: Draw.io 双向通信协议
**选择**: 监听 `save` 事件获取用户编辑后的 XML，通过 `onXmlChange` 回调同步到父组件
**导出**: 发送 `{ action: 'export', format: 'png'|'svg' }` 消息，监听 `export` 事件获取 base64 数据
**替代方案**:
- 轮询 getXml：性能差，增加通信开销
- 定时自动同步：用户体验差，可能覆盖正在编辑的内容
**理由**: 事件驱动，用户主导

### Decision 4: 测试框架选择
**选择**: Vitest（单元测试）+ Playwright（E2E）
**替代方案**:
- Jest：配置复杂，ESM 支持不佳
- Cypress：E2E 功能强大但更重量级
**理由**: Vitest 与 Vite/Next.js 生态兼容性好，启动快

### Decision 5: API Key 加密方案
**选择**: TweetNaCl secretbox 对称加密，密钥派生自用户设置的主密码（可选功能）
**存储格式**: `{ encrypted: base64, nonce: base64 }`
**替代方案**:
- Web Crypto API：API 复杂，浏览器兼容性问题
- 不加密，仅 base64 混淆：安全性不足
**理由**: TweetNaCl 轻量（~7KB），纯 JS 实现，无依赖

### Decision 6: Rate Limiting 实现
**选择**: 基于 IP 的滑动窗口限流，每分钟 20 次请求
**存储**: 内存 Map（单实例部署足够）
**替代方案**:
- Redis 分布式限流：当前规模不需要
- next-rate-limit 包：引入依赖
**理由**: 自实现简单，无额外依赖

## Risks / Trade-offs

### [Risk] XML 修复算法可能产生格式错误的 XML
**Mitigation**: 修复后使用 DOMParser 验证，失败则回退到原始 XML 并提示用户

### [Risk] Undo/Redo 历史可能占用大量内存
**Mitigation**: 限制最大 20 条历史，FIFO 淘汰策略

### [Risk] TweetNaCl 加密需要用户设置主密码
**Mitigation**: 设为可选功能，默认行为不变；首次启用时提示设置

### [Risk] Rate Limiting 内存存储在服务重启后丢失
**Mitigation**: 可接受，重启后计数器重置不影响安全性

### [Risk] postMessage targetOrigin 改为固定值可能影响自托管 draw.io
**Mitigation**: 支持通过环境变量 `DRAWIO_ORIGIN` 配置

### [Risk] 双向同步可能导致编辑冲突
**Mitigation**: save 事件触发时完全覆盖 CodeEditor 内容，不做合并（用户预期行为）

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         app/page.js                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ State:                                                     │  │
│  │  - generatedXml                                            │  │
│  │  - xmlHistory[] (max 20)                                   │  │
│  │  - historyIndex (NEW)                                      │  │
│  │  - continuationAttempts (NEW)                              │  │
│  └───────────────────────────────────────────────────────────┘  │
│         │                    │                    │              │
│         ▼                    ▼                    ▼              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │ CodeEditor  │◀───│   Undo/     │───▶│   DrawioCanvas      │  │
│  │ (memo)      │    │   Redo      │    │   (bidirectional)   │  │
│  │             │    │   Controls  │    │                     │  │
│  └─────────────┘    └─────────────┘    └─────────────────────┘  │
│         ▲                                        │              │
│         │                                        ▼              │
│         │                              ┌─────────────────────┐  │
│         └──────────────────────────────│ onXmlChange(xml)    │  │
│                    save 事件回调        └─────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Migration Plan

### Phase 1 (基础加固) - 无需迁移
- 纯增量变更，不影响现有数据结构

### Phase 2 (双向同步) - 无需迁移
- DrawioCanvas 新增 props，向后兼容

### Phase 3 (安全加固) - 可选迁移
- API Key 加密为可选功能
- 首次启用时提示用户设置主密码
- 未加密的旧配置继续工作
