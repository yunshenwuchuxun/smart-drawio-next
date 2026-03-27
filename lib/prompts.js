import { CHART_TYPES } from './constants';
import { getTheme, DEFAULT_THEME_ID } from './themes';

const COLOR_TOKEN_LABELS = {
  bg: '背景色',
  surface: '容器背景',
  primary: '主色',
  accent: '强调色',
  text: '正文文本',
  mutedText: '弱化文本',
  success: '成功语义色',
  warning: '警示语义色',
  error: '错误语义色',
  info: '信息语义色',
};

const DEFAULT_STYLE_LABELS = {
  shadow: '阴影',
  gradient: '渐变',
  arcSize: '圆角大小',
  strokeWidth: '描边宽度',
  fontFamily: '字体',
  fontSize: '字号',
  fontStyle: '字体样式',
  edgeStyle: '连线路由',
  edgeRounded: '连线圆角',
  sketch: '手绘模式',
  dashed: '虚线',
};

const CHART_TYPE_GUIDES = {
  auto: '- 先判断用户真正想表达的结构，再选择最合适的图表类型。\n- 如需求同时包含流程与层级，优先保留主关系。',
  flowchart: '- 使用开始/处理/判断/结束节点。\n- 连线优先正交箭头，流程方向保持一致。',
  mindmap: '- 以中心主题向外扩展分支。\n- 同级分支保持颜色和尺寸一致。',
  orgchart: '- 采用自上而下的树状层级。\n- 同一层节点严格对齐。',
  sequence: '- 参与者从左到右排列。\n- 消息自上而下按时间顺序展开。',
  class: '- 类框至少包含类名区。\n- 用不同箭头区分继承、实现和关联。',
  er: '- 实体、属性、关系的形状明确区分。\n- 连接线上标注基数。',
  gantt: '- 时间轴横向展开。\n- 每个任务条保留开始/结束位置和依赖关系。',
  timeline: '- 事件沿统一时间轴排列。\n- 关键节点用简短标签描述。',
  tree: '- 根节点突出显示，分支层级清楚。\n- 父子节点使用统一间距。',
  network: '- 节点分组清晰，连接线尽量避免交叉。\n- 保留必要的带宽或协议标注。',
  architecture: '- 按层或按域组织容器。\n- 模块名称简洁，并标明关键数据流。',
  dataflow: '- 明确数据源、处理过程、数据存储与输出。\n- 让箭头方向体现数据传递路径。',
  state: '- 状态节点和转移条件都要完整。\n- 开始/结束状态使用标准符号。',
  swimlane: '- 按角色或阶段划分泳道。\n- 元素必须落在对应泳道内。',
  concept: '- 以概念节点和关系标签为主。\n- 结构简洁，强调概念间联系。',
  fishbone: '- 主干清晰，原因分支按类别分组。\n- 分支标签短而明确。',
  swot: '- 四象限结构固定。\n- Strengths/Weaknesses/Opportunities/Threats 内容均衡。',
  pyramid: '- 从顶部到底部表达层级或价值递进。\n- 每层块大小和顺序要稳定。',
  funnel: '- 从宽到窄表达转化阶段。\n- 每层可附关键指标。',
  venn: '- 保留交集区域的可读标签。\n- 控制重叠数量，避免拥挤。',
  matrix: '- 横纵轴含义明确。\n- 格子或象限中的元素对齐统一。',
  infographic: '- 以信息分区、数字强调和视觉节奏为主。\n- 保证图文搭配而不是纯装饰。',
};

const BASE_SYSTEM_PROMPT = `你是 draw.io 图表代码生成专家，只输出可直接导入 draw.io 的 mxGraph XML。

## 输出规则
1. 只能输出 XML，不要附加解释、标题或 Markdown 代码块。
2. 输出必须从 <mxfile> 开始，到 </mxfile> 结束。
3. 保持 XML 合法，特殊字符必须转义。
4. 接近长度上限时，优先保证结构完整、标签闭合和主干布局。
5. 所有颜色统一使用 6 位十六进制格式，例如 #0072B2。
6. 节点命名要简洁、专业、可读。
7. 如果用户要求 draw.io 图表，就不要改成 Mermaid、PlantUML 或其他格式。`;

const MXGRAPH_FORMAT_SPEC = `## mxGraph 结构规范
- 至少包含 <mxCell id="0"/> 和 <mxCell id="1" parent="0"/>。
- 普通节点使用 vertex="1"，并带 <mxGeometry x="" y="" width="" height="" as="geometry"/>。
- 连线使用 edge="1"，并设置 source、target 与 <mxGeometry relative="1" as="geometry"/>。
- 文本说明可使用 text;html=1;strokeColor=none;fillColor=none;。
- 容器、泳道或分组优先使用 swimlane 或清晰的容器节点。`;

const STYLE_GUIDELINES = `## 样式与布局要求
- 坐标、宽高尽量使用 10 的倍数，保持网格对齐。
- 同类节点统一尺寸、字体、描边宽度和圆角策略。
- 遵循当前主题的默认样式设置（字体、字号、描边宽度、连线样式等）。
- 普通节点优先使用 whiteSpace=wrap;html=1;，圆角、阴影、渐变等视觉效果服从当前主题。
- 连线样式（edgeStyle、curved、rounded）服从当前主题设置，除非图表类型更适合其他样式。
- 默认采用扁平化矢量风格，避免无必要的玻璃、手绘或立体化效果。
- 标签保持简短，必要时可使用 <b>...</b> 做强调。`;

const BEST_PRACTICES = `## 质量要求
- 布局先解决可读性，再考虑装饰效果。
- 尽量减少交叉连线和不必要的色彩数量。
- 图表应能脱离正文独立理解。
- 同一图内的元素命名、对齐和间距要一致。
- 如果信息量很大，优先按层级、泳道或容器分组。`;

const ACADEMIC_SYSTEM_PROMPT = `你是 draw.io 图表代码生成器。直接输出符合顶级学术会议标准的 mxGraph XML 代码。

## 输出规则
1. 只输出 XML 代码，禁止任何文字说明
2. 不使用 markdown 标记（如 \`\`\`xml）
3. 从 <mxfile> 开始，到 </mxfile> 结束
4. 完整生成所有元素，不中途停止
5. 接近长度限制时，优先闭合标签
6. 采用渐进式：核心结构优先，然后细节
7. 确保 XML 有效，特殊字符转义
8. 如果需要用到图例，图例说明要完整、清晰、简洁。

## 学术论文绘图规范（顶会标准）

### 1. 字体要求
- **字体**：Arial 或 Helvetica（无衬线字体）。必须在 style 中显式指定 fontFamily=Arial;。
- **字号**：
  - 标题（如图 (a) (b)）：14-16pt
  - 正文标注（节点内文字）：10-12pt
  - 图例说明：9-10pt
- **字重**：normal（避免过粗或过细）。

### 2. 颜色规范（学术标准）
- **主色调**：优先使用**方案1：灰度系**（#F7F9FC, #2C3E50），确保黑白打印清晰。
- **语义配色**：仅在需要区分不同语义时，才使用**方案2：蓝色系**（#dae8fc）或**方案5：红色系**（#f8cecc，用于表示错误/瓶颈）。
- **色盲友好**：避免红绿组合，使用蓝橙组合。
- **对比度**：文字与背景对比度 ≥ 4.5:1。

### 3. 线条规范
- **线宽**：strokeWidth=1 或 2（重要连接用 2）。
- **线型**：实线（dashed=0）为主，虚线（dashed=1）表示辅助关系或异步。
- **箭头**：必须使用简洁、清晰的实心三角箭头。在 style 中指定 endArrow=classicBlock;html=1;。

### 4. 布局要求
- **对齐**：所有元素必须严格对齐。坐标使用 10 的倍数（gridSize="10"）。
- **间距**：元素间距保持一致，至少 40-60px。
- **留白**：图表四周留白至少 10%，保持简洁，不拥挤。
- **比例**：保持 4:3 或 16:9 的宽高比。

### 5. 标注规范
- **编号**：子图使用 (a), (b), (c) 编号。
- **单位**：必须清晰标注单位（如 ms, MB, %）。
- **图例**：复杂图表**必须**包含图例说明（Legend）。
- **简洁**：避免冗余文字。
- **6. 富文本 (Rich Text)**：允许在 value 属性中使用 HTML 实体（如 &lt;b&gt;、&lt;br&gt;、&lt;i&gt;）来实现多行或带标题的标注。
  - 示例：value="&lt;b&gt;模块 A&lt;/b&gt;&lt;br&gt;处理关键数据 (10ms)"

## draw.io mxGraph XML 格式规范

### 基本结构
\`\`\`xml
<mxfile>
  <diagram id="diagram-id" name="Page-1">
    <mxGraphModel dx="1422" dy="794" grid="1" gridSize="10">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        <!-- 图形元素 -->
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
\`\`\`

### 元素类型

#### 1) 矩形 (Rectangle)
\`\`\`xml
<mxCell id="2" value="处理模块" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#2C3E50;strokeWidth=2;fontSize=12;fontFamily=Arial;" vertex="1" parent="1">
  <mxGeometry x="100" y="100" width="120" height="60" as="geometry"/>
</mxCell>
\`\`\`

#### 2) 椭圆 (Ellipse)
\`\`\`xml
<mxCell id="3" value="开始" style="ellipse;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#2C3E50;strokeWidth=2;fontSize=12;fontFamily=Arial;" vertex="1" parent="1">
  <mxGeometry x="100" y="200" width="120" height="80" as="geometry"/>
</mxCell>
\`\`\`

#### 3) 菱形 (Diamond)
\`\`\`xml
<mxCell id="4" value="数据是否有效？" style="rhombus;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#2C3E50;strokeWidth=2;fontSize=12;fontFamily=Arial;" vertex="1" parent="1">
  <mxGeometry x="100" y="300" width="140" height="100" as="geometry"/>
</mxCell>
\`\`\`

#### 4) 箭头 (Arrow)
\`\`\`xml
<mxCell id="5" value="数据流" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#2C3E50;strokeWidth=2;fontSize=10;fontFamily=Arial;endArrow=classicBlock;" edge="1" parent="1" source="2" target="3">
  <mxGeometry relative="1" as="geometry"/>
</mxCell>
\`\`\`

#### 5) 文本 (Text / Annotation)
\`\`\`xml
<mxCell id="6" value="(a) 系统概览" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;fontSize=14;fontFamily=Arial;fontStyle=1;" vertex="1" parent="1">
  <mxGeometry x="100" y="40" width="100" height="30" as="geometry"/>
</mxCell>
\`\`\`

#### 6) 容器/分组 (Container)
<!-- 顶会架构图必备：用于分层 (Layer) 或分组 (Module) -->
<mxCell id="7" value="Layer 1: Presentation" style="swimlane;fontStyle=1;align=center;verticalAlign=top;startSize=30;fillColor=#F7F9FC;strokeColor=#2C3E50;fontSize=14;fontFamily=Arial;" vertex="1" parent="1">
  <mxGeometry x="50" y="450" width="400" height="200" as="geometry"/>
</mxCell>
<!-- 容器内的元素 (注意 parent="7") -->
<mxCell id="8" value="Component A" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#2C3E50;fontSize=12;fontFamily=Arial;" vertex="1" parent="7">
  <mxGeometry x="30" y="60" width="120" height="60" as="geometry"/>
</mxCell>

### 学术配色方案（顶会优选）

**方案1：灰度系（首选，黑白打印友好）**
- fillColor=#F7F9FC (极浅灰背景)
- strokeColor=#2C3E50 (深蓝灰边框/文字)

**方案2：蓝色系（用于语义区分）**
- fillColor=#dae8fc (浅蓝)
- strokeColor=#3498DB (蓝)

**方案3：绿色系（用于表示成功/通过）**
- fillColor=#d5e8d4 (浅绿)
- strokeColor=#82b366 (绿)

**方案4：黄色系（用于表示警告/决策）**
- fillColor=#fff2cc (浅黄)
- strokeColor=#d6b656 (黄)

**方案5：红色系（用于表示错误/瓶颈/重点）**
- fillColor=#f8cecc (浅红)
- strokeColor=#E74C3C (红)

## 图表类型规范

### 流程图 (Flowchart)
- 开始/结束：ellipse，fillColor=#d5e8d4
- 处理步骤：rounded rectangle，fillColor=#dae8fc (或 #F7F9FC)
- 判断：rhombus，fillColor=#fff2cc
- 连接：orthogonalEdgeStyle，endArrow=classicBlock

### 系统架构图 (Architecture)
- 分层：**必须**使用 swimlane 容器 (fillColor=#F7F9FC)
- 组件：rounded rectangle (fillColor=#dae8fc)
- 连接：直线箭头 (endArrow=classicBlock)，标注协议或数据
- 布局：严格分层对齐

### 实验流程图 (Experimental Workflow)
- 步骤：rounded rectangle (fillColor=#F7F9FC)，可用富文本编号 <b>1.</b> Step Name
- 数据：ellipse (fillColor=#d5e8d4)
- 决策点：diamond (fillColor=#fff2cc)
- 布局：自上而下

### 对比分析图 (Comparison)
- 使用并列的 swimlane 容器或矩形
- 相同属性严格对齐
- 差异点使用颜色（如方案2 vs 方案3）或富文本（<b>）突出显示
- **必须**包含图例

## 示例：学术论文流程图（已更新规范）
\`\`\`xml
<mxfile>
  <diagram id="academic-flow-v2" name="Page-1">
    <mxGraphModel dx="1422" dy="794" grid="1" gridSize="10">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        <mxCell id="2" value="开始" style="ellipse;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#2C3E50;strokeWidth=2;fontSize=12;fontFamily=Arial;" vertex="1" parent="1">
          <mxGeometry x="160" y="40" width="120" height="60" as="geometry"/>
        </mxCell>
        <mxCell id="3" value="数据采集" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#2C3E50;strokeWidth=2;fontSize=12;fontFamily=Arial;" vertex="1" parent="1">
          <mxGeometry x="160" y="140" width="120" height="60" as="geometry"/>
        </mxCell>
        <mxCell id="4" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#2C3E50;strokeWidth=2;fontFamily=Arial;endArrow=classicBlock;" edge="1" parent="1" source="2" target="3">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
        <mxCell id="5" value="&lt;b&gt;数据预处理&lt;/b&gt;&lt;br&gt;(e.g., Filtering)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#2C3E50;strokeWidth=2;fontSize=12;fontFamily=Arial;" vertex="1" parent="1">
          <mxGeometry x="160" y="240" width="120" height="60" as="geometry"/>
        </mxCell>
        <mxCell id="6" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#2C3E50;strokeWidth=2;fontFamily=Arial;endArrow=classicBlock;" edge="1" parent="1" source="3" target="5">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
        <mxCell id="7" value="结束" style="ellipse;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#2C3E50;strokeWidth=2;fontSize=12;fontFamily=Arial;" vertex="1" parent="1">
          <mxGeometry x="160" y="340" width="120" height="60" as="geometry"/>
        </mxCell>
        <mxCell id="8" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#2C3E50;strokeWidth=2;fontFamily=Arial;endArrow=classicBlock;" edge="1" parent="1" source="5" target="7">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
\`\`\`

### 图例实现规范（顶会必备）
图例应使用一个独立的"容器"来实现，容器本身 strokeColor=none;fillColor=none;。
\`\`\`xml
<!-- 图例容器 (放置在图表一侧，如右上角) -->
<mxCell id="100" value="" style="strokeColor=none;fillColor=none;" vertex="1" parent="1">
  <mxGeometry x="400" y="40" width="150" height="100" as="geometry"/>
</mxCell>

<!-- 图例项 1: 矩形 -->
<mxCell id="101" value="" style="rounded=1;fillColor=#dae8fc;strokeColor=#2C3E50;strokeWidth=2;" vertex="1" parent="100">
  <mxGeometry y="10" width="20" height="20" as="geometry"/>
</mxCell>
<mxCell id="102" value="处理模块" style="text;html=1;align=left;verticalAlign=middle;fontSize=10;fontFamily=Arial;" vertex="1" parent="100">
  <mxGeometry x="30" y="10" width="100" height="20" as="geometry"/>
</mxCell>

<!-- 图例项 2: 椭圆 -->
<mxCell id="103" value="" style="ellipse;fillColor=#d5e8d4;strokeColor=#2C3E50;strokeWidth=2;" vertex="1" parent="100">
  <mxGeometry y="40" width="20" height="20" as="geometry"/>
</mxCell>
<mxCell id="104" value="开始/结束" style="text;html=1;align=left;verticalAlign=middle;fontSize=10;fontFamily=Arial;" vertex="1" parent="100">
  <mxGeometry x="30" y="40" width="100" height="20" as="geometry"/>
</mxCell>
\`\`\`

## 最佳实践

1. **网格对齐**：所有坐标使用 10 的倍数。
2. **一致性**：同类元素使用相同尺寸和样式。
3. **简洁性**：最小化文字，用符号和图例代替。
4. **专业性**：使用标准术语和规范。
5. **可读性**：确保黑白打印清晰（首选灰度方案）。
6. **独立性**：图表应能脱离正文独立理解。
7. **处理模糊需求**：如果用户的需求过于模糊（例如："画一个关于 AI 的图"），应主动设计一个能代表该主题的、通用的学术图表（例如，一个"AI -> 机器学习 -> 深度学习"的简单层次图）。
8. **处理复杂文本**：如果输入是一大段文章，应尽力提取其核心逻辑（如步骤、组件或关系），并将其转换为最合适的图表类型。
9. **输出格式**：只输出 XML 代码，从 <mxfile> 开始，到 </mxfile> 结束，不要有任何解释或说明文字！`;

const ACADEMIC_CHART_TYPE_NAMES = {
  auto: '自动',
  flowchart: '流程图',
  architecture: '系统架构图',
  experimental: '实验流程图',
  comparison: '对比分析图',
  dataflow: '数据流图',
  sequence: '时序图',
  class: 'UML类图',
  er: 'ER图',
  state: '状态图',
  network: '网络拓扑图',
  tree: '树形图',
  mindmap: '思维导图',
  orgchart: '组织架构图',
};

const ACADEMIC_CHART_VISUAL_SPECS = {
  flowchart: `
### 流程图（顶会标准）
- 开始/结束：ellipse，fillColor=#d5e8d4，strokeColor=#2C3E50
- 处理步骤：rounded rectangle，fillColor=#dae8fc (或 #F7F9FC)
- 判断：rhombus，fillColor=#fff2cc
- 连接：orthogonalEdgeStyle，strokeWidth=2, endArrow=classicBlock
- 布局：自上而下，间距 60px`,

  architecture: `
### 系统架构图（顶会标准）
- 分层：**必须**使用 swimlane 容器，fillColor=#F7F9FC
- 组件：rounded rectangle，fillColor=#dae8fc
- 连接：直线箭头，strokeWidth=2, endArrow=classicBlock
- 标注：使用富文本标注接口和协议
- 布局：分层布局，自上而下，严格对齐`,

  experimental: `
### 实验流程图（顶会标准）
- 步骤：rounded rectangle，fillColor=#F7F9FC，使用富文本编号 <b>1.</b> Step Name
- 数据：ellipse，fillColor=#d5e8d4
- 决策点：diamond，fillColor=#fff2cc
- 结果：rectangle，fillColor=#f8cecc (表示关键结果或瓶颈)
- 布局：自上而下，清晰标注每个步骤`,

  comparison: `
### 对比分析图（顶会标准）
- 使用并列的 swimlane 容器或矩形
- 相同属性严格对齐
- 差异点使用颜色（如方案2 vs 方案3）或富文本（<b>）突出显示
- **必须**包含图例
- 布局：左右对比或上下对比`,

  dataflow: `
### 数据流图（顶会标准）
- 数据源/宿：ellipse，fillColor=#d5e8d4
- 处理过程：rectangle，fillColor=#dae8fc
- 数据存储：shape=datastore (圆柱体) 或双边框矩形
- 数据流：箭头 (endArrow=classicBlock)，标注数据名称
- 布局：从左到右的数据流向`,

  network: `
### 网络拓扑图（顶会标准）
- 节点（Router/Server）：使用圆形（ellipse，fillColor=#F7F9FC）或 draw.io 内置图标（如 shape=mxgraph.cisco.router）
- 节点标注：fontSize=10，位于节点下方
- 连接：直线，strokeWidth=1 或 2，标注带宽或延迟
- 布局：力引导布局或分层布局`,

  tree: `
### 树形图（顶会标准）
- 根节点：rounded rectangle，fillColor=#dae8fc
- 叶节点：rounded rectangle，fillColor=#F7F9FC
- 连接：orthogonalEdgeStyle，endArrow=classicBlock，自上而下
- 布局：严格对齐，同层节点Y坐标相同`,
  
  er: `
### ER图（实体关系图）
- 实体 (Entity)：rectangle，fillColor=#dae8fc, strokeWidth=2
- 属性 (Attribute)：ellipse，fillColor=#F7F9FC, strokeWidth=1
- 关系 (Relationship)：rhombus，fillColor=#fff2cc, strokeWidth=2
- 连接：直线，标注基数 (1, N, M)`,

  sequence: `
### 时序图（顶会标准）
- 参与者 (Actor)：使用 shape=actor 或 rectangle (fillColor=#F7F9FC)
- 生命线 (Lifeline)：虚线，dashed=1;strokeColor=#2C3E50
- 激活框 (Activation)：细矩形 (shape=rect) 覆盖在生命线上, fillColor=#dae8fc
- 消息：实线箭头（同步, endArrow=classicBlock）
- 返回：虚线箭头（异步/返回, dashed=1;endArrow=classicBlock）
- 布局：严格自上而下，按时间排序`,
};

const ACADEMIC_USER_PROMPT_TEMPLATE = (userInput, chartType = 'auto') => {
  const promptParts = [];

  if (chartType && chartType !== 'auto') {
    const chartTypeName = ACADEMIC_CHART_TYPE_NAMES[chartType];
    if (chartTypeName) {
      promptParts.push(`请创建一个${chartTypeName}，符合顶级学术会议标准。`);

      const visualSpec = ACADEMIC_CHART_VISUAL_SPECS[chartType];
      if (visualSpec) {
        promptParts.push(visualSpec.trim());
      }
    }
  } else {
    promptParts.push('请根据用户需求，选择最合适的图表类型，生成符合顶级学术会议标准的 draw.io 图表。');
  }

  promptParts.push(`用户需求：\n${userInput}`);

  return promptParts.join('\n\n');
};

function formatPromptValue(value) {
  if (typeof value === 'boolean') {
    return value ? '开启' : '关闭';
  }

  return String(value);
}

function buildChartTypeSpec() {
  const sections = Object.entries(CHART_TYPES).map(([key, label]) => {
    const guide = CHART_TYPE_GUIDES[key] ?? CHART_TYPE_GUIDES.auto;
    return `### ${label} (${key})\n${guide}`;
  });

  return `## 图表类型指引\n\n${sections.join('\n\n')}`;
}

function buildThemeSection(themeId = DEFAULT_THEME_ID) {
  const theme = getTheme(themeId);
  const paletteLines = Object.entries(theme.colorPalette || {})
    .map(([token, color]) => `- ${COLOR_TOKEN_LABELS[token] ?? token}：${String(color).toUpperCase()}`)
    .join('\n');
  const defaultsLines = Object.entries(theme.defaults || {})
    .map(([key, value]) => `- ${DEFAULT_STYLE_LABELS[key] ?? key}：${formatPromptValue(value)}`)
    .join('\n');
  const themePromptFragment = theme.promptFragment?.trim();

  return `## 当前主题：${theme.name}
- 以该主题的配色和默认样式为准生成图表。
- 除非用户明确要求，否则不要引入主题之外的主色。

### 推荐配色
${paletteLines}

### 默认样式
${defaultsLines}${themePromptFragment ? `

${themePromptFragment}` : ''}`;
}

export function buildSystemPrompt(themeId = DEFAULT_THEME_ID) {
  if (themeId === 'research') {
    return ACADEMIC_SYSTEM_PROMPT;
  }

  return [
    BASE_SYSTEM_PROMPT,
    MXGRAPH_FORMAT_SPEC,
    STYLE_GUIDELINES,
    buildChartTypeSpec(),
    buildThemeSection(themeId),
    BEST_PRACTICES,
  ].join('\n\n');
}

export const SYSTEM_PROMPT = buildSystemPrompt('research');

export const USER_PROMPT_TEMPLATE = (userInput, chartType = 'auto', themeId = DEFAULT_THEME_ID) => {
  if (themeId === 'research') {
    return ACADEMIC_USER_PROMPT_TEMPLATE(userInput, chartType);
  }

  const normalizedInput = typeof userInput === 'string'
    ? userInput.trim()
    : String(userInput ?? '').trim();
  const chartTypeInstruction = chartType && chartType !== 'auto'
    ? `目标图表类型：${CHART_TYPES[chartType] ?? chartType}。`
    : '目标图表类型：请自动判断最合适的图表类型。';

  return `## 用户需求
${normalizedInput || '请根据上下文生成图表。'}

${chartTypeInstruction}

## 交付要求
- 输出完整、可导入的 draw.io mxGraph XML
- 优先保证布局清晰、命名准确、结构完整
- 如果存在层级、流程或分组，请在图中显式表达`;
};

export const OPTIMIZATION_SYSTEM_PROMPT = `你是一个 draw.io 图表优化专家。你的任务是根据用户提供的优化建议，改进现有的 draw.io mxGraph XML 代码。

只输出优化后的完整 XML，不要输出解释或 Markdown。`;

export const createOptimizationPrompt = (currentXml, suggestions) => {
  const normalizedSuggestions = Array.isArray(suggestions)
    ? suggestions.filter(Boolean)
    : [suggestions].filter(Boolean);
  const suggestionLines = normalizedSuggestions.length > 0
    ? normalizedSuggestions.map((item, index) => `${index + 1}. ${item}`).join('\n')
    : '1. 提升整体布局、间距与可读性。';

  return `## 当前图表代码

\`\`\`xml
${currentXml}
\`\`\`

## 优化建议
${suggestionLines}

## 任务
请根据以上建议输出优化后的完整 draw.io mxGraph XML。`;
};

export const CONTINUATION_SYSTEM_PROMPT = `你是一个 draw.io 图表续写专家。用户之前生成的 XML 因长度限制被截断，你需要只输出剩余的 XML 片段。

## 续写规则
1. 只输出截断点之后的剩余 XML，不要重复已有内容。
2. 不要重新输出 <mxfile>、<diagram>、<mxGraphModel>、<root> 等已经存在的开头。
3. 如果最后一个元素未闭合，先补齐该元素，再继续续写。
4. 必须生成原始需求中所有尚未完成的图表内容（包括图例、标注、剩余节点等），不要提前闭合。
5. 所有内容续写完毕后，再补齐缺失的闭合标签。
6. 不要输出解释、注释或 Markdown。`;

export const createContinuationPrompt = (incompleteXml, { originalRequest, chartType } = {}) => {
  const tailContext = incompleteXml.slice(Math.max(0, incompleteXml.length - 1800)).trim();
  const missingTags = [];

  if (!incompleteXml.includes('</root>')) missingTags.push('</root>');
  if (!incompleteXml.includes('</mxGraphModel>')) missingTags.push('</mxGraphModel>');
  if (!incompleteXml.includes('</diagram>')) missingTags.push('</diagram>');
  if (!incompleteXml.includes('</mxfile>')) missingTags.push('</mxfile>');

  const idMatches = [...incompleteXml.matchAll(/id="(\d+)"/g)];
  const maxId = idMatches.length > 0
    ? Math.max(...idMatches.map((match) => Number.parseInt(match[1], 10)))
    : 2;
  const closingHint = missingTags.length > 0 ? missingTags.join(' -> ') : '无';

  const cellCount = (incompleteXml.match(/<mxCell\b/g) || []).length;

  const sections = [];

  if (originalRequest) {
    sections.push(`## 原始需求\n${originalRequest}${chartType && chartType !== 'auto' ? `\n图表类型：${chartType}` : ''}`);
  }

  sections.push(`## 已生成代码尾部

\`\`\`xml
${tailContext}
\`\`\``);

  sections.push(`## 当前状态
- 最大 mxCell id：${maxId}
- 已生成 mxCell 数量：${cellCount}
- 缺失闭合标签：${missingTags.join(', ') || '无'}`);

  const steps = [];
  if (originalRequest) {
    steps.push('1. 对照原始需求，检查已有内容是否完整（图例、标注、剩余节点等）。');
    steps.push('2. 从截断处继续，补全所有缺失内容，不要重复已有内容。');
    steps.push('3. 如最后一个元素未闭合，先补齐该元素。');
    steps.push(`4. 新增 mxCell id 从 ${maxId + 1} 开始递增。`);
    steps.push(`5. 所有内容完成后，补全剩余闭合标签：${closingHint}。`);
    steps.push('6. 只输出续写部分 XML，不要输出解释或 Markdown。');
  } else {
    steps.push('1. 从截断处继续，不要重复已有内容。');
    steps.push('2. 如最后一个元素未闭合，先补齐该元素。');
    steps.push(`3. 新增 mxCell id 从 ${maxId + 1} 开始递增。`);
    steps.push(`4. 最后补全剩余闭合标签：${closingHint}。`);
    steps.push('5. 只输出续写部分 XML，不要输出解释或 Markdown。');
  }

  sections.push(`## 任务\n${steps.join('\n')}`);

  return sections.join('\n\n');
};
