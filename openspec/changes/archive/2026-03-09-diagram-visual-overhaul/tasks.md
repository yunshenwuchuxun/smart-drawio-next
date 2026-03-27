## 1. 箭头定位算法增强

- [x] 1.1 重构 `lib/optimizeArrows.js` 的 `determineEdges()` 函数：用 `Math.atan2(dy, dx)` 角度计算替代四象限距离比较，以 ±30° 阈值划分上/下/左/右四个主方向
- [x] 1.2 重构 `lib/drawing-tricks.js` 的 `smartArrows()` 函数：实现两趟处理——第一趟统计每个形状每面的边计数，第二趟按公式 `(i+1)/(count+1)` 均匀分配锚点（MAX_FAN_OUT=6）
- [x] 1.3 在 `smartArrows()` 中为所有处理的边添加 `sourcePerimeterSpacing=8;targetPerimeterSpacing=8` 样式属性（已有值时不覆盖）
- [x] 1.4 在 `lib/drawing-tricks.js` 中新增 `jumpCrossings` trick：为所有边添加 `jumpStyle=arc;jumpSize=8`，在 tricks 对象中注册（id='jumpCrossings', name='交叉跳跃', scope='global'）
- [x] 1.5 更新 `tests/lib/optimizeArrows.test.js`：新增角度感知路由测试（垂直90°、水平0°、对角45°优选垂直、近水平20°优选水平、重叠元素默认值）
- [x] 1.6 更新 `tests/lib/drawing-tricks.test.js`：新增端口扇出分布测试（单边用0.5、三边用0.25/0.5/0.75、超过MAX_FAN_OUT回退0.5）、perimeterSpacing 测试、jumpCrossings trick 测试

## 2. Research 主题 Nature 风格重塑

- [x] 2.1 修改 `lib/themes/research.js` 的 colorPalette 为 Okabe-Ito 色盲安全配色（bg=#FFFFFF, surface=#F0F4F8, primary=#1A1A2E, accent=#56B4E9, text=#1A1A2E, mutedText=#525252, success=#009E73, warning=#E69F00, error=#D55E00, info=#0072B2）
- [x] 2.2 修改 `lib/themes/research.js` 的 defaults 为学术零装饰风格（shadow=false, gradient=false, arcSize=0, strokeWidth=1, fontFamily='Helvetica, Arial, sans-serif', fontSize=11, fontStyle=0, sketch=0, dashed=0, edgeStyle='orthogonalEdgeStyle', edgeRounded=0）
- [x] 2.3 修改 `lib/themes/research.js` 的 colorMapping 为自身新颜色映射（key 和 value 均为新 Okabe-Ito 颜色）
- [x] 2.4 重写 `lib/themes/research.js` 的 promptFragment：强化 Nature/IEEE/ACM 学术规范指令（细线 strokeWidth=1、零装饰、直角 arcSize=0、Helvetica 字体、orthogonalEdgeStyle、色盲安全配色说明）

## 3. 主题 colorMapping 基准颜色同步

- [x] 3.1 更新 `lib/themes/business.js` 的 colorMapping：将映射源颜色从旧 research 颜色替换为新 Okabe-Ito 基准颜色
- [x] 3.2 更新 `lib/themes/warm.js` 的 colorMapping
- [x] 3.3 更新 `lib/themes/cool.js` 的 colorMapping
- [x] 3.4 更新 `lib/themes/dark.js` 的 colorMapping
- [x] 3.5 更新 `lib/themes/contrast.js` 的 colorMapping
- [x] 3.6 更新 `lib/themes/pastel.js` 的 colorMapping
- [x] 3.7 更新 `lib/themes/forest.js` 的 colorMapping
- [x] 3.8 更新 `lib/themes/violet.js` 的 colorMapping
- [x] 3.9 更新 `lib/themes/neutral.js` 的 colorMapping

## 4. 主题差异化 defaults 扩展

- [x] 4.1 修改 `lib/themes/business.js` 的 defaults：新增 fontSize=13, fontStyle=0, sketch=0, edgeStyle='orthogonalEdgeStyle', edgeRounded=1；更新 fontFamily='Arial, sans-serif'
- [x] 4.2 修改 `lib/themes/warm.js` 的 defaults：新增 fontSize=13, fontStyle=0, sketch=0, edgeRounded=1；更新 fontFamily='Georgia, serif'；edgeStyle 不设置（使用 curved=1）
- [x] 4.3 修改 `lib/themes/cool.js` 的 defaults：新增 fontSize=12, fontStyle=0, sketch=0, edgeStyle='orthogonalEdgeStyle', edgeRounded=0；更新 fontFamily='Inter, system-ui, sans-serif', strokeWidth=1.5
- [x] 4.4 修改 `lib/themes/dark.js` 的 defaults：新增 fontSize=12, fontStyle=0, sketch=0, edgeStyle='orthogonalEdgeStyle', edgeRounded=1；更新 fontFamily='Segoe UI, system-ui, sans-serif', strokeWidth=1.5
- [x] 4.5 修改 `lib/themes/contrast.js` 的 defaults：新增 fontSize=12, fontStyle=0, sketch=0, edgeStyle='orthogonalEdgeStyle', edgeRounded=0；更新 fontFamily='Arial, sans-serif'
- [x] 4.6 修改 `lib/themes/pastel.js` 的 defaults：新增 fontSize=13, fontStyle=0, sketch=0, edgeRounded=1；更新 fontFamily='Quicksand, Nunito, sans-serif', strokeWidth=1.5；edgeStyle 不设置（使用 curved=1）
- [x] 4.7 修改 `lib/themes/forest.js` 的 defaults：新增 fontSize=12, fontStyle=0, sketch=0, edgeStyle='orthogonalEdgeStyle', edgeRounded=0；更新 fontFamily='Lato, sans-serif', strokeWidth=1.5
- [x] 4.8 修改 `lib/themes/violet.js` 的 defaults：新增 fontSize=13, fontStyle=0, sketch=0, edgeStyle='orthogonalEdgeStyle', edgeRounded=1；更新 fontFamily='Poppins, sans-serif'
- [x] 4.9 修改 `lib/themes/neutral.js` 的 defaults：新增 fontSize=12, fontStyle=0, sketch=0, edgeStyle='elbowEdgeStyle', edgeRounded=0；更新 fontFamily='system-ui, sans-serif', strokeWidth=1.5

## 5. Prompt 和 Theme Engine 更新

- [x] 5.1 修改 `lib/prompts.js` 的系统提示构建逻辑：将新增 defaults 属性（fontSize, fontStyle, edgeStyle, edgeRounded）注入 LLM 系统提示，指导模型使用主题特定字体、线宽和连线样式
- [x] 5.2 修改 `lib/theme-engine.js` 的 `applyTheme()` 函数：在颜色映射之外增加 fontFamily、fontSize、strokeWidth、edgeStyle、edgeRounded 属性的变换逻辑
- [x] 5.3 修改 `lib/style-presets.js` 的 `getPresetDefaults()` 和 `PRESET_DEFAULTS`：为 research 主题设置 { shadow: false, gradient: false, rounded: false, glass: false }；确保所有主题条目更新为与新 defaults 一致

## 6. 后处理和注册更新

- [x] 6.1 修改 `lib/theme-postprocess.js` 的 `THEME_POSTPROCESSING_TRICKS`：为 10 个主题配置各自的后处理 trick 组合（research=[orthogonalRouting, smartArrows, jumpCrossings], cool=[orthogonalRouting, smartArrows], contrast=[orthogonalRouting, smartArrows, jumpCrossings], 其余=[smartArrows]）
- [x] 6.2 验证 `lib/tool-registry.js` 正确导出新增的 jumpCrossings trick

## 7. 测试更新与迁移

- [x] 7.1 更新 `tests/lib/theme-engine.test.js`：新增非颜色属性变换测试（fontFamily 替换、fontSize 替换、strokeWidth 替换、edgeStyle 替换、edgeRounded 应用、curved 主题切换）
- [x] 7.2 更新 `tests/lib/theme-postprocess.test.js`：新增多主题后处理配置测试（research 三个 tricks、business 一个 trick、cool 两个 tricks）
- [x] 7.3 更新 `lib/prompts.js` 的 `CHART_VISUAL_SPECS` 相关逻辑或 `lib/constants.js`：将硬编码的旧 research 颜色（#dae8fc, #d5e8d4, #fff2cc, #f8cecc, #2C3E50, #F7F9FC）替换为新 Okabe-Ito 颜色
- [x] 7.4 运行完整测试套件 `pnpm test -- run` 确认所有测试通过
