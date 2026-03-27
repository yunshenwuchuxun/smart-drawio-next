## ADDED Requirements

### Requirement: XML 截断检测
系统 SHALL 使用层级化检测算法识别 XML 截断，检查 mxfile、diagram、mxGraphModel、root 四个层级的闭合标签。

#### Scenario: 检测单层截断
- **WHEN** 生成的 XML 包含 `<mxfile>` 但缺少 `</mxfile>`
- **THEN** 系统 SHALL 将 isTruncated 设为 true 并在错误消息中列出缺失的标签

#### Scenario: 检测多层截断
- **WHEN** 生成的 XML 缺少多个闭合标签（如 `</root>` 和 `</mxGraphModel>`）
- **THEN** 系统 SHALL 列出所有缺失的标签

### Requirement: XML 自动修复
系统 SHALL 提供自动修复截断 XML 的功能，按正确的层级顺序补全缺失的闭合标签。

#### Scenario: 修复单个缺失标签
- **WHEN** XML 仅缺少 `</mxfile>` 标签
- **THEN** 系统 SHALL 在 XML 末尾追加 `</mxfile>`

#### Scenario: 修复多个缺失标签
- **WHEN** XML 缺少 `</root>`、`</mxGraphModel>`、`</diagram>`、`</mxfile>`
- **THEN** 系统 SHALL 按顺序追加：`</root></mxGraphModel></diagram></mxfile>`

#### Scenario: 修复后验证
- **WHEN** 自动修复完成
- **THEN** 系统 SHALL 使用 DOMParser 验证修复后的 XML 有效性

#### Scenario: 修复验证失败
- **WHEN** 修复后的 XML 无法通过 DOMParser 验证
- **THEN** 系统 SHALL 回退到原始 XML 并提示用户手动修复

### Requirement: 续写重试限制
系统 SHALL 限制续写操作的最大重试次数为 3 次。

#### Scenario: 续写成功
- **WHEN** 续写后 XML 完整（所有标签闭合）
- **THEN** 系统 SHALL 重置 continuationAttempts 为 0

#### Scenario: 续写仍截断
- **WHEN** 续写后 XML 仍然截断且 continuationAttempts < 3
- **THEN** 系统 SHALL 将 continuationAttempts 加 1 并允许用户继续点击"继续生成"

#### Scenario: 达到重试上限
- **WHEN** continuationAttempts 达到 3 且 XML 仍然截断
- **THEN** 系统 SHALL 禁用"继续生成"按钮并提示用户尝试自动修复或手动编辑
