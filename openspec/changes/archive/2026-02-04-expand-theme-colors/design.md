## Context

当前主题系统位于 `lib/themes/` 目录，包含：
- `index.js`: 导出主题对象和工具函数（getTheme, getAllThemes）
- `research.js`: 科研主题定义（默认主题）
- `business.js`: 商业主题定义

每个主题遵循统一结构：
- `id`: 唯一标识符（kebab-case）
- `name`: 中文显示名称
- `promptFragment`: 注入 LLM 的绘图规范
- `colorPalette`: 语义配色方案（bg, surface, primary, accent, text, mutedText, success, warning, error, info）
- `defaults`: 默认样式属性（shadow, gradient, arcSize, strokeWidth, fontFamily）
- `colorMapping`: 从 research 主题颜色到目标主题颜色的映射表

## Goals / Non-Goals

**Goals:**
- 新增 8 个配色风格主题，覆盖暖色系、冷色系、深色模式、高对比度、柔和粉彩、森林绿系、紫罗兰系、中性灰阶
- 保持与现有主题结构完全一致
- 每个主题的 colorMapping 基于 research 主题的 7 个基准颜色进行映射
- 为新主题定义合适的样式预设默认值

**Non-Goals:**
- 不修改现有 research 和 business 主题
- 不改变主题系统的架构
- 不新增 UI 组件（主题选择器已支持动态获取所有主题）

## Decisions

### Decision 1: 主题文件命名约定
每个新主题独立一个文件，文件名与主题 id 一致：
- `lib/themes/warm.js` → id: 'warm'
- `lib/themes/cool.js` → id: 'cool'
- 以此类推

**Rationale**: 保持与现有 research.js/business.js 的命名一致性，便于维护。

### Decision 2: colorMapping 基准颜色
所有新主题的 colorMapping 基于 research 主题的 9 个基准颜色：
```
#FFFFFF (纯白背景)
#F7F9FC (surface)
#2C3E50 (primary/stroke)
#dae8fc (info/蓝色语义)
#d5e8d4 (success/绿色语义)
#fff2cc (warning/黄色语义)
#f8cecc (error/红色语义)
#3498DB (accent)
#000000 (纯黑文字)
```

**Rationale**: 确保从 research 主题切换到任意主题时颜色映射正确，包括纯白和纯黑的边界情况。

### Decision 3: 样式预设默认值策略
| 主题 | shadow | gradient | rounded | glass |
|-----|--------|----------|---------|-------|
| warm | true | false | true | false |
| cool | false | false | false | false |
| dark | true | false | true | false |
| contrast | false | false | false | false |
| pastel | false | false | true | false |
| forest | false | false | false | false |
| violet | true | false | true | false |
| neutral | false | false | false | false |

**Rationale**:
- 活泼风格（warm, violet）启用阴影和圆角增加层次
- 专业/学术风格（cool, contrast, forest, neutral）保持简洁
- 深色模式启用阴影增强视觉层次
- 柔和粉彩使用圆角契合轻松风格

### Decision 4: 深色模式配色策略
深色模式使用暗色背景（#0B0F14）和浅色文字（#F5F7FA），语义色使用**高亮度变体**以确保在暗色背景上的可见性。

**Rationale**: 在深色背景上使用低亮度颜色会导致对比度不足，必须使用高亮度语义色。

### Decision 5: 高对比度主题配色策略
高对比度主题使用纯黑白为主（#FFFFFF 背景, #000000 边框），语义色保持高饱和度。

**Rationale**: 满足无障碍访问需求，确保黑白打印清晰。

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| 主题过多导致选择困难 | UI 已使用下拉框，可考虑未来分组展示 |
| 深色模式与现有 UI 不匹配 | 仅影响生成的图表，不影响应用 UI |
| colorMapping 映射不完整 | 基于 9 个基准色确保覆盖所有常用颜色 |

## Decisions (Confirmed)

### Decision 6: 语义色策略
采用**混合策略**：
- error/warning 颜色保持标准色调（红色/黄橙色），仅调整饱和度和亮度适配主题
- success/info 颜色可融入主题色系

**Rationale**: 保证安全相关的颜色（error/warning）在所有主题中保持辨识度，同时允许非关键语义色融入主题美学。

### Decision 7: 无障碍要求
不强制 WCAG 对比度验证，信任设计选择。

**Rationale**: 用户确认视觉效果优先于严格的无障碍合规。
