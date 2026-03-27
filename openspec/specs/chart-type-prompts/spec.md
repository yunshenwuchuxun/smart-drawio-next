## Requirements

### Requirement: CHART_TYPE_NAMES completeness
`CHART_TYPE_NAMES` 对象 MUST 包含 `lib/constants.js` 中定义的所有 23 种图表类型的中文名称映射。

#### Constraint: Exact type mapping
键名 MUST 与 `CHART_TYPES` 中的键完全一致，值为对应的中文显示名称。

#### Scenario: All UI types have name mapping
- **WHEN** 用户选择任意图表类型（非 auto）
- **THEN** `CHART_TYPE_NAMES[chartType]` SHALL 返回非空字符串

### Requirement: CHART_VISUAL_SPECS completeness
`CHART_VISUAL_SPECS` 对象 MUST 为所有 22 种非 auto 图表类型提供详细的 draw.io mxGraph XML 视觉规范。

#### Constraint: Spec format
每个规范 MUST 包含：
1. 主要元素的 mxGraph 形状类型
2. 元素的默认样式属性（fillColor, strokeColor, strokeWidth 等）
3. 布局方向和间距建议
4. 连接线样式

#### Constraint: Color strategy
所有规范 MUST 使用 research 主题的硬编码颜色值：
- 背景/容器: `#F7F9FC`
- 主要元素: `#dae8fc`
- 成功/通过: `#d5e8d4`
- 警告/待定: `#fff2cc`
- 错误/危险: `#f8cecc`
- 描边: `#2C3E50`

主题切换通过现有 `colorMapping` 机制自动转换颜色。

#### Scenario: Selected type receives visual guidance
- **WHEN** 用户选择图表类型 X（非 auto）
- **THEN** AI 提示词 SHALL 包含 `CHART_VISUAL_SPECS[X]` 的内容

### Requirement: Shape implementation strategy
复杂图表类型 SHOULD 优先使用 draw.io 专用形状，但 MUST 提供基础形状作为回退方案。

#### Constraint: Hybrid shape approach
规范中 SHOULD 按优先级列出：
1. 专用 shape 属性（如有可用）
2. 基础图元组合方案（作为回退）

#### Scenario: Fishbone diagram shape
- **WHEN** 生成鱼骨图
- **THEN** 规范 SHALL 建议 `shape=mxgraph.lean_mapping.fishbone_diagram` 或使用线条组合的回退方案

### Requirement: Legacy type preservation
`experimental` 和 `comparison` 类型 MUST 保留在 `CHART_TYPE_NAMES` 和 `CHART_VISUAL_SPECS` 中。

#### Constraint: No UI exposure
这些类型 MUST NOT 添加到 `lib/constants.js` 的 `CHART_TYPES` 中。

#### Scenario: Internal use supported
- **WHEN** 代码内部调用 `USER_PROMPT_TEMPLATE(input, 'experimental')`
- **THEN** 系统 SHALL 正常返回带有实验流程图规范的提示词

### Requirement: Independent specs per type
每种图表类型 MUST 拥有独立的完整视觉规范，即使与其他类型相似。

#### Constraint: No shared references
规范定义 MUST NOT 使用变量引用其他规范，每个规范 SHALL 是自包含的字符串。

#### Scenario: Tree and Mindmap have distinct specs
- **GIVEN** tree 和 mindmap 类型
- **THEN** `CHART_VISUAL_SPECS.tree` 和 `CHART_VISUAL_SPECS.mindmap` SHALL 是两个独立定义的字符串

### Requirement: image-utils.js sync
`lib/image-utils.js` 中的 `getChartTypeName()` 函数 MUST 包含所有 23 种图表类型的名称映射。

#### Scenario: Infographic type name available
- **WHEN** 调用 `getChartTypeName('infographic')`
- **THEN** 返回值 SHALL 为 '信息图'

## Specific Chart Type Specifications

### Requirement: Mindmap specification
思维导图规范 MUST 定义：
- 中心节点：rounded rectangle, fillColor=#dae8fc, 较大尺寸
- 分支节点：rounded rectangle, fillColor=#F7F9FC
- 连接：curved edges 或 orthogonalEdgeStyle
- 布局：放射状或左右分支

### Requirement: Orgchart specification
组织架构图规范 MUST 定义：
- 人员节点：rounded rectangle, fillColor=#dae8fc
- 连接：orthogonalEdgeStyle, 垂直向下
- 布局：严格树状，自上而下

### Requirement: Class diagram specification
UML 类图规范 MUST 定义：
- 类框：3 格结构（类名/属性/方法），使用 swimlane 或 shape=umlClass
- 关系线：继承(△)、关联(→)、聚合(◇)、组合(◆)
- 布局：自上而下或左右

### Requirement: State diagram specification
状态图规范 MUST 定义：
- 状态：rounded rectangle, fillColor=#dae8fc
- 初始状态：实心圆 (ellipse, fillColor=#000000)
- 终止状态：双圆 (ellipse with strokeWidth=3)
- 转换：箭头带标签

### Requirement: Gantt chart specification
甘特图规范 MUST 定义：
- 时间轴：顶部水平线，标注时间刻度
- 任务条：rectangle, fillColor 按状态区分
- 里程碑：rhombus
- 布局：横向时间线，纵向任务列表

### Requirement: Timeline specification
时间线规范 MUST 定义：
- 主轴：水平或垂直线
- 时间点：小圆或标记
- 事件：文本框或卡片
- 布局：沿时间轴排列

### Requirement: Swimlane specification
泳道图规范 MUST 定义：
- 泳道：swimlane 容器, fillColor=#F7F9FC
- 流程元素：与流程图相同
- 布局：垂直或水平泳道，跨泳道连接

### Requirement: Concept map specification
概念图规范 MUST 定义：
- 概念节点：ellipse, fillColor=#dae8fc
- 关系线：带标签的箭头
- 布局：网状或层级

### Requirement: Fishbone specification
鱼骨图规范 MUST 定义：
- 主干：水平粗线指向右侧"鱼头"（效果/问题）
- 主骨：斜线分支，标注主要原因类别
- 子骨：从主骨延伸的小分支
- 布局：鱼骨形，从左到右

### Requirement: SWOT specification
SWOT 分析图规范 MUST 定义：
- 结构：2x2 矩阵
- 象限：S(优势)-绿色, W(劣势)-红色, O(机会)-蓝色, T(威胁)-黄色
- 布局：四象限对齐

### Requirement: Pyramid specification
金字塔图规范 MUST 定义：
- 层级：梯形或三角形分层
- 颜色：从底到顶渐变或分色
- 标签：每层中心标注
- 布局：底宽顶窄

### Requirement: Funnel specification
漏斗图规范 MUST 定义：
- 层级：梯形从宽到窄
- 颜色：按阶段区分
- 数值：可选的数量标注
- 布局：自上而下收窄

### Requirement: Venn specification
韦恩图规范 MUST 定义：
- 圆形：ellipse, 半透明填充 (opacity)
- 重叠区：通过透明度自然形成
- 标签：圆内和交集区域
- 布局：2-3 圆重叠

### Requirement: Matrix specification
矩阵图规范 MUST 定义：
- 网格：表格结构或 swimlane 组合
- 单元格：rectangle, 可填充内容
- 表头：带背景色的标题行/列
- 布局：行列对齐

### Requirement: Infographic specification
信息图规范 MUST 定义：
- 结构：混合布局（标题 + 数据块 + 图标）
- 元素：数字、图标、图表组合
- 颜色：鲜明的主题色搭配
- 布局：视觉流程引导
