## Why

Smart Drawio Next 项目存在多个系统性问题：错误恢复机制缺失（xmlHistory 只写不读、无 Undo/Redo）、Draw.io 通信单向（用户编辑丢失）、零测试覆盖、安全漏洞（API Key 明文存储、postMessage 使用通配符）、性能问题（Monaco Editor 未 memo 导致频繁重渲染）。这些问题影响用户体验、数据安全和代码可维护性，需要系统性修复。

## What Changes

### Phase 1: 基础加固
- 实现 Undo/Redo 栈机制，消费现有 xmlHistory 状态
- 添加 XML 自动修复算法（闭合截断标签）
- 续写功能增加最大重试次数限制（3次）
- **BREAKING**: postMessage targetOrigin 从 `'*'` 改为 `'https://embed.diagrams.net'`
- 搭建 Vitest 测试框架
- 为 `lib/optimizeArrows.js` 添加单元测试

### Phase 2: 核心功能增强
- Draw.io save 事件回调同步到 CodeEditor（双向通信）
- 实现 PNG/SVG 导出功能
- Monaco Editor 组件 React.memo 优化
- localStorage 写入 debounce（500ms）
- 添加键盘快捷键（Ctrl+Enter 发送、Ctrl+Z/Y Undo/Redo）

### Phase 3: 安全与类型
- API Key localStorage 加密存储
- POST 端点添加 Rate Limiting 中间件
- `/api/models` baseUrl 白名单校验（防 SSRF）
- 补全 `lib/*.js` JSDoc 类型注解
- 引入 Zod 运行时 schema 校验（Config 对象）
- 添加 Playwright E2E 烟雾测试

## Capabilities

### New Capabilities
- `undo-redo`: 实现基于 xmlHistory 的 Undo/Redo 栈，支持样式变更和技巧应用的撤销重做
- `xml-repair`: XML 截断自动修复算法，检测并补全缺失的闭合标签
- `drawio-bidirectional`: Draw.io iframe 双向通信，save 事件同步回 CodeEditor + PNG/SVG 导出
- `testing-infrastructure`: Vitest 测试框架 + 核心模块单元测试 + Playwright E2E
- `security-hardening`: postMessage origin 校验、API Key 加密、Rate Limiting、SSRF 防护
- `performance-optimization`: React.memo 优化、localStorage debounce、状态更新批处理

### Modified Capabilities
<!-- 无现有 specs 需要修改 -->

## Impact

### 代码变更
- `app/page.js`: Undo/Redo 状态管理、续写重试计数、快捷键处理
- `components/DrawioCanvas.jsx`: postMessage 双向通信、导出功能
- `components/CodeEditor.jsx`: React.memo 包装、onXmlChange 回调
- `lib/config-manager.js`: API Key 加密/解密
- `lib/xml-repair.js`: 新文件，XML 修复算法
- `app/api/`: Rate Limiting 中间件、baseUrl 校验

### 新增依赖
- `vitest`, `@vitest/ui`: 测试框架
- `playwright`, `@playwright/test`: E2E 测试
- `tweetnacl`, `tweetnacl-util`: 客户端加密
- `zod`: 运行时 schema 校验

### 配置文件
- `vitest.config.js`: 测试配置
- `playwright.config.js`: E2E 配置
