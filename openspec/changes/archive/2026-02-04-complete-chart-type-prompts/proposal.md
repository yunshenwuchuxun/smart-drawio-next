## Why

当前 UI 下拉菜单 (`lib/constants.js`) 中定义了 23 种图表类型，但 `lib/prompts.js` 中仅有 14 种类型名称映射和 9 种视觉规范。当用户选择缺失的图表类型时，AI 无法收到特定的绘图指导，导致生成结果不符合该图表类型的专业标准。

## What Changes

- 在 `lib/prompts.js` 中补全 `CHART_TYPE_NAMES` 对象，使其覆盖所有 23 种图表类型
- 在 `lib/prompts.js` 中补全 `CHART_VISUAL_SPECS` 对象，为所有非 auto 的 22 种图表类型提供详细的 draw.io mxGraph XML 视觉规范
- 在 `lib/image-utils.js` 中补全 `getChartTypeName()` 函数，添加缺失的 `infographic` 类型
- 移除 `lib/prompts.js` 中 UI 不再使用的 `experimental` 和 `comparison` 类型（或保留作为内部使用）

## Capabilities

### New Capabilities

- `chart-type-prompts`: 为所有 23 种图表类型提供完整的 AI 提示词支持，包括类型名称映射和 draw.io mxGraph XML 视觉规范

### Modified Capabilities

无

## Impact

- **代码**: `lib/prompts.js`（主要修改）, `lib/image-utils.js`（小修改）
- **功能**: 所有图表类型选择后，AI 将收到正确的绘图指导
- **兼容性**: 向后兼容，不影响现有功能
