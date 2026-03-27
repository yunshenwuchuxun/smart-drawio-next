## 1. Phase 1: 基础加固 - 错误恢复

- [x] 1.1 在 app/page.js 添加 historyIndex 状态和 continuationAttempts 状态
- [x] 1.2 实现 handleUndo 函数：historyIndex 减 1，加载对应 XML
- [x] 1.3 实现 handleRedo 函数：historyIndex 加 1，加载对应 XML
- [x] 1.4 修改 xmlHistory 压入逻辑：新操作时清除 historyIndex 之后的历史
- [x] 1.5 添加历史栈上限检查：超过 20 条时 FIFO 淘汰
- [x] 1.6 在 CodeEditor 添加 Undo/Redo 按钮 UI

## 2. Phase 1: 基础加固 - XML 修复

- [x] 2.1 创建 lib/xml-repair.js 模块
- [x] 2.2 实现 detectMissingTags 函数：检测缺失的闭合标签
- [x] 2.3 实现 repairXml 函数：按层级顺序补全标签
- [x] 2.4 实现 validateRepairedXml 函数：使用 DOMParser 验证
- [x] 2.5 在 tryParseAndApply 中集成自动修复逻辑
- [x] 2.6 修改 handleContinueGeneration：添加 continuationAttempts 计数和上限检查

## 3. Phase 1: 基础加固 - 安全与测试基础

- [x] 3.1 修改 DrawioCanvas.jsx postMessage targetOrigin 为 'https://embed.diagrams.net'
- [x] 3.2 添加 DRAWIO_ORIGIN 环境变量支持
- [x] 3.3 安装 Vitest 和相关依赖：vitest, @vitest/ui, jsdom
- [x] 3.4 创建 vitest.config.js 配置文件
- [x] 3.5 添加 package.json test 脚本
- [x] 3.6 创建 tests/lib/optimizeArrows.test.js 单元测试

## 4. Phase 2: 核心功能 - Draw.io 双向通信

- [x] 4.1 为 DrawioCanvas 添加 onXmlChange prop
- [x] 4.2 修改 handleMessage 处理 save 事件：调用 onXmlChange
- [x] 4.3 添加 origin 验证逻辑：检查 event.origin
- [x] 4.4 在 app/page.js 实现 handleDrawioXmlChange 回调
- [x] 4.5 实现 handleExportPng 函数：发送 export 消息
- [x] 4.6 实现 handleExportSvg 函数：发送 export 消息
- [x] 4.7 处理 export 事件：创建 Blob 并触发下载
- [x] 4.8 在 CodeEditor 添加导出按钮 UI

## 5. Phase 2: 核心功能 - 性能优化

- [x] 5.1 使用 React.memo 包装 CodeEditor 组件
- [x] 5.2 使用 useCallback 包装传递给 CodeEditor 的回调函数
- [x] 5.3 创建 lib/debounce.js 工具函数
- [x] 5.4 为 localStorage 写入添加防抖（handlePresetToggle, handleThemeChange）
- [x] 5.5 添加 beforeunload 事件处理：立即写入待保存数据
- [x] 5.6 为 loadDiagram 添加 300ms 防抖

## 6. Phase 2: 核心功能 - 键盘快捷键

- [x] 6.1 在 Chat.jsx 添加 Ctrl+Enter 发送快捷键
- [x] 6.2 在 app/page.js 添加全局 keydown 监听器
- [x] 6.3 实现 Ctrl+Z 撤销快捷键处理
- [x] 6.4 实现 Ctrl+Y / Ctrl+Shift+Z 重做快捷键处理
- [x] 6.5 在 CodeEditor 添加 Ctrl+Enter 应用快捷键

## 7. Phase 3: 安全加固 - API Key 加密

- [x] 7.1 安装 tweetnacl 和 tweetnacl-util 依赖
- [x] 7.2 创建 lib/crypto.js 加密工具模块
- [x] 7.3 实现 deriveKey 函数：从主密码派生密钥
- [x] 7.4 实现 encryptApiKey 和 decryptApiKey 函数
- [x] 7.5 修改 ConfigManager 支持加密存储
- [x] 7.6 创建主密码设置/验证 UI 组件
- [x] 7.7 实现密钥缓存机制（sessionStorage）

## 8. Phase 3: 安全加固 - Rate Limiting

- [x] 8.1 创建 lib/rate-limiter.js 模块
- [x] 8.2 实现滑动窗口限流算法：每分钟 20 次请求
- [x] 8.3 创建 middleware 包装函数
- [x] 8.4 应用到 /api/generate 路由
- [x] 8.5 应用到 /api/configs 路由
- [x] 8.6 应用到 /api/models 路由
- [x] 8.7 添加 429 响应和 Retry-After 头

## 9. Phase 3: 安全加固 - SSRF 防护与日志清理

- [x] 9.1 创建 lib/url-validator.js 模块
- [x] 9.2 实现 isAllowedBaseUrl 函数：检查域名白名单
- [x] 9.3 实现 isPrivateIp 函数：检测内网地址
- [x] 9.4 在 /api/models 路由添加 baseUrl 验证
- [x] 9.5 审计所有 console.log 语句，标记敏感数据
- [x] 9.6 创建 lib/logger.js 条件日志工具
- [x] 9.7 替换敏感日志为条件输出或脱敏版本

## 10. Phase 3: 类型安全与 E2E 测试

- [x] 10.1 安装 zod 依赖
- [x] 10.2 创建 lib/schemas.js：定义 Config schema
- [x] 10.3 在 config-manager.js 使用 Zod 验证配置
- [x] 10.4 为 lib/*.js 主要函数添加 JSDoc @param 和 @returns 类型
- [x] 10.5 安装 Playwright 依赖
- [x] 10.6 创建 playwright.config.js 配置
- [x] 10.7 创建 tests/e2e/generation.spec.js 烟雾测试
- [x] 10.8 添加 package.json test:e2e 脚本
