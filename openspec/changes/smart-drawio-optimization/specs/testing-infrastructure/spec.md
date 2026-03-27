## ADDED Requirements

### Requirement: Vitest 测试框架配置
系统 SHALL 配置 Vitest 作为单元测试框架，支持 ESM 和 React 组件测试。

#### Scenario: 运行单元测试
- **WHEN** 执行 `pnpm test` 命令
- **THEN** Vitest SHALL 运行 `tests/` 目录下所有 `*.test.js` 文件

#### Scenario: 测试覆盖率报告
- **WHEN** 执行 `pnpm test:coverage` 命令
- **THEN** 系统 SHALL 生成覆盖率报告到 `coverage/` 目录

### Requirement: optimizeArrows 单元测试
系统 SHALL 为 `lib/optimizeArrows.js` 提供完整的单元测试覆盖。

#### Scenario: 测试 determineEdges 函数
- **WHEN** 给定两个元素的坐标和尺寸
- **THEN** 测试 SHALL 验证返回的 startEdge 和 endEdge 符合几何位置关系

#### Scenario: 测试 8 个象限
- **WHEN** 运行 determineEdges 测试套件
- **THEN** SHALL 覆盖目标元素在源元素的 8 个相对位置（上、下、左、右、四个对角）

#### Scenario: 测试边界条件
- **WHEN** 两个元素坐标相同或重叠
- **THEN** 测试 SHALL 验证不会抛出异常并返回合理默认值

### Requirement: drawing-tricks 单元测试
系统 SHALL 为 `lib/drawing-tricks.js` 的四个技巧函数提供单元测试。

#### Scenario: gridSnap 测试
- **WHEN** 输入包含非对齐坐标的 XML
- **THEN** 测试 SHALL 验证输出 XML 中所有 x/y 坐标对齐到 10px 网格

#### Scenario: smartArrows 测试
- **WHEN** 输入包含连线的 XML
- **THEN** 测试 SHALL 验证 exitX/exitY/entryX/entryY 样式属性正确设置

#### Scenario: XML 解析错误处理
- **WHEN** 输入格式错误的 XML
- **THEN** 测试 SHALL 验证函数返回原始 XML 和 error 对象

### Requirement: Playwright E2E 测试配置
系统 SHALL 配置 Playwright 进行端到端测试。

#### Scenario: E2E 烟雾测试
- **WHEN** 执行 `pnpm test:e2e` 命令
- **THEN** Playwright SHALL 运行 `tests/e2e/` 目录下的测试文件

#### Scenario: 生成流程 E2E 测试
- **WHEN** 运行生成流程测试
- **THEN** 测试 SHALL 验证：输入描述 → 点击生成 → 等待流式响应 → 验证画布渲染
