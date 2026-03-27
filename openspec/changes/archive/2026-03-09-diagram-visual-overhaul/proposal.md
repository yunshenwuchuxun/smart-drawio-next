## Why

生成的 Draw.io 图表存在三个视觉质量问题：(1) 箭头定位混乱——`lib/optimizeArrows.js` 的 `determineEdges()` 算法缺乏角度感知且多条边连接同一面时全部堆叠在锚点 0.5；(2) 科研主题（research）视觉不突出——defaults（shadow=false, arcSize=8, strokeWidth=2, fontFamily=Arial）接近 neutral 主题，缺乏 Nature/Science 论文插图的学术签名；(3) 10 个主题间差异不明显——所有主题共享 Arial 字体和 strokeWidth=2，仅靠颜色和 shadow/arcSize 开关区分，视觉效果趋同。

## What Changes

- **箭头算法增强**：在 `lib/optimizeArrows.js` 的 `determineEdges()` 中引入 `Math.atan2` 角度感知路由替代二元距离比较；在 `lib/drawing-tricks.js` 的 `smartArrows()` 中实现端口扇出分布（多条边连接同一面时均匀分布锚点）、添加 `sourcePerimeterSpacing` / `targetPerimeterSpacing` 属性；新增 `jumpCrossings` trick 为交叉连线添加 `jumpStyle=arc` 跳跃标记
- **科研主题 Nature 风格重塑**：修改 `lib/themes/research.js` 的 colorPalette 为 Okabe-Ito 色盲安全配色（蓝 #0072B2 + 橙 #E69F00）、defaults 改为零装饰学术风格（strokeWidth=1, arcSize=0, fontFamily=Helvetica, fontSize=11）；更新 promptFragment 强化 Nature/IEEE/ACM 论文插图规范指令
- **主题差异化系统扩展**：扩展所有 10 个主题（`lib/themes/*.js`）的 defaults 结构，新增 fontSize、fontStyle、sketch、edgeStyle、edgeRounded 属性；每个主题配置独特的字体、线宽、连线样式和效果组合；更新 `lib/prompts.js` 将新属性注入 LLM 系统提示；更新 `lib/theme-engine.js` 的 `applyTheme()` 应用非颜色属性变换；扩展 `lib/theme-postprocess.js` 为不同主题配置各自的后处理 tricks

## Capabilities

### New Capabilities
- `arrow-precision`: 箭头定位精度增强——角度感知路由算法、端口扇出分布、perimeterSpacing 间距、jumpCrossings 交叉跳跃 trick
- `theme-differentiation`: 主题差异化系统——扩展 theme defaults 结构（fontSize/fontStyle/sketch/edgeStyle/edgeRounded），在 prompts 和 theme-engine 中应用新属性，为各主题配置独特后处理 tricks

### Modified Capabilities
- `theme-colors-expansion`: research 主题的 colorPalette 改为 Okabe-Ito 色盲安全配色（基准颜色变更将影响所有主题的 colorMapping），defaults 从 `{ shadow: false, arcSize: 8, strokeWidth: 2, fontFamily: 'Arial' }` 改为 `{ shadow: false, arcSize: 0, strokeWidth: 1, fontFamily: 'Helvetica', fontSize: 11 }` 等零装饰学术值；所有 10 个主题的 defaults 新增 fontSize/fontStyle/sketch/edgeStyle/edgeRounded 属性（**BREAKING**: defaults 结构扩展）

## Impact

- **核心文件修改**：`lib/optimizeArrows.js`、`lib/drawing-tricks.js`、`lib/themes/research.js` 及其他 9 个主题文件、`lib/themes/index.js`、`lib/prompts.js`、`lib/theme-engine.js`、`lib/theme-postprocess.js`、`lib/style-presets.js`
- **测试更新**：`tests/lib/optimizeArrows.test.js`、`tests/lib/drawing-tricks.test.js`、`tests/lib/theme-engine.test.js`、`tests/lib/theme-postprocess.test.js`
- **research 基准颜色变更影响**：research 主题 colorPalette 变更后，所有其他主题的 `colorMapping` 需同步更新映射源颜色
- **无新依赖**：所有改进使用纯 JavaScript + DOMParser/XMLSerializer，不引入外部库
