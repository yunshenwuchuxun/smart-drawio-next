## 1. 补全 CHART_TYPE_NAMES

- [x] 1.1 在 `lib/prompts.js` 中添加 `gantt: '甘特图'`
- [x] 1.2 在 `lib/prompts.js` 中添加 `timeline: '时间线'`
- [x] 1.3 在 `lib/prompts.js` 中添加 `swimlane: '泳道图'`
- [x] 1.4 在 `lib/prompts.js` 中添加 `concept: '概念图'`
- [x] 1.5 在 `lib/prompts.js` 中添加 `fishbone: '鱼骨图'`
- [x] 1.6 在 `lib/prompts.js` 中添加 `swot: 'SWOT分析图'`
- [x] 1.7 在 `lib/prompts.js` 中添加 `pyramid: '金字塔图'`
- [x] 1.8 在 `lib/prompts.js` 中添加 `funnel: '漏斗图'`
- [x] 1.9 在 `lib/prompts.js` 中添加 `venn: '韦恩图'`
- [x] 1.10 在 `lib/prompts.js` 中添加 `matrix: '矩阵图'`
- [x] 1.11 在 `lib/prompts.js` 中添加 `infographic: '信息图'`

## 2. 补全 CHART_VISUAL_SPECS - 层级结构类

- [x] 2.1 添加 `mindmap` 规范 - 思维导图（中心节点 + 放射分支）
- [x] 2.2 添加 `orgchart` 规范 - 组织架构图（树状自上而下）
- [x] 2.3 添加 `class` 规范 - UML类图（三格类框 + 关系线）
- [x] 2.4 添加 `state` 规范 - 状态图（状态圆 + 转换箭头）

## 3. 补全 CHART_VISUAL_SPECS - 时间序列类

- [x] 3.1 添加 `gantt` 规范 - 甘特图（时间轴 + 任务条）
- [x] 3.2 添加 `timeline` 规范 - 时间线（主轴 + 事件标记）

## 4. 补全 CHART_VISUAL_SPECS - 分析图类

- [x] 4.1 添加 `swimlane` 规范 - 泳道图（平行泳道 + 流程）
- [x] 4.2 添加 `concept` 规范 - 概念图（概念节点 + 关系）
- [x] 4.3 添加 `fishbone` 规范 - 鱼骨图（主干 + 分支骨）
- [x] 4.4 添加 `swot` 规范 - SWOT分析图（2x2 矩阵）

## 5. 补全 CHART_VISUAL_SPECS - 数据可视化类

- [x] 5.1 添加 `pyramid` 规范 - 金字塔图（层级三角）
- [x] 5.2 添加 `funnel` 规范 - 漏斗图（收窄层级）
- [x] 5.3 添加 `venn` 规范 - 韦恩图（重叠圆形）
- [x] 5.4 添加 `matrix` 规范 - 矩阵图（网格结构）
- [x] 5.5 添加 `infographic` 规范 - 信息图（混合元素）

## 6. 同步其他文件

- [x] 6.1 在 `lib/image-utils.js` 的 `getChartTypeName()` 中添加 `infographic: '信息图'`

## 7. 验证

- [x] 7.1 确认 `CHART_TYPE_NAMES` 包含全部 23 种类型
- [x] 7.2 确认 `CHART_VISUAL_SPECS` 包含全部 22 种非 auto 类型
- [x] 7.3 运行 `pnpm build` 确认无编译错误
