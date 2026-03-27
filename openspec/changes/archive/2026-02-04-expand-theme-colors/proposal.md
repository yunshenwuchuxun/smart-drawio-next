## Why

当前主题系统仅提供 2 种配色方案（科研主题 + 商业主题），无法满足用户在不同场景下的视觉需求。用户需要更丰富的配色选择，包括暖色系、冷色系、深色模式、高对比度等风格，以适应营销创意、技术文档、教育笔记、无障碍访问等多样化使用场景。

## What Changes

- **新增 8 个配色风格主题**：在 `lib/themes/` 目录下新增 warm、cool、dark、contrast、pastel、forest、violet、neutral 共 8 个主题定义文件
- **扩展主题导出**：修改 `lib/themes/index.js` 导入并导出所有 10 个主题
- **扩展预设默认值**：修改 `lib/style-presets.js` 中的 `getPresetDefaults()` 函数，为新主题定义合适的样式预设默认值

## Capabilities

### New Capabilities

- `theme-colors-expansion`: 扩展主题配色方案，新增 8 个配色风格主题（warm 暖色系、cool 冷色系、dark 深色模式、contrast 高对比度、pastel 柔和粉彩、forest 森林绿系、violet 紫罗兰系、neutral 中性灰阶），每个主题包含完整的 id、name、promptFragment、colorPalette、defaults、colorMapping 定义

### Modified Capabilities

（无现有 spec 需要修改）

## Impact

- **lib/themes/index.js**: 导入并导出新增的 8 个主题
- **lib/themes/warm.js**: 新增暖色系主题定义
- **lib/themes/cool.js**: 新增冷色系主题定义
- **lib/themes/dark.js**: 新增深色模式主题定义
- **lib/themes/contrast.js**: 新增高对比度主题定义
- **lib/themes/pastel.js**: 新增柔和粉彩主题定义
- **lib/themes/forest.js**: 新增森林绿系主题定义
- **lib/themes/violet.js**: 新增紫罗兰系主题定义
- **lib/themes/neutral.js**: 新增中性灰阶主题定义
- **lib/style-presets.js**: 扩展 `getPresetDefaults()` 函数支持新主题
- **UI 主题选择器**: 自动显示所有主题（无需修改，因为使用 `getAllThemes()` 动态获取）
