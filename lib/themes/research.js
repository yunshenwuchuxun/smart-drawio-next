export const researchTheme = {
  id: 'research',
  name: '科研主题',
  promptFragment: `## 学术论文绘图规范（顶会标准）

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
9. **输出格式**：只输出 XML 代码，从 <mxfile> 开始，到 </mxfile> 结束，不要有任何解释或说明文字！`,

  colorPalette: {
    bg: '#F7F9FC',
    surface: '#dae8fc',
    primary: '#2C3E50',
    accent: '#3498DB',
    text: '#2C3E50',
    mutedText: '#525252',
    success: '#d5e8d4',
    warning: '#fff2cc',
    error: '#f8cecc',
    info: '#3498DB',
  },

  defaults: {
    shadow: false,
    gradient: false,
    arcSize: 10,
    strokeWidth: 2,
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: 12,
    fontStyle: 0,
    sketch: 0,
    dashed: 0,
    edgeStyle: 'orthogonalEdgeStyle',
    edgeRounded: 0,
  },

  colorMapping: {
    '#F7F9FC': '#F7F9FC',
    '#dae8fc': '#dae8fc',
    '#2C3E50': '#2C3E50',
    '#3498DB': '#3498DB',
    '#d5e8d4': '#d5e8d4',
    '#fff2cc': '#fff2cc',
    '#f8cecc': '#f8cecc',
    '#000000': '#000000',
    '#FFFFFF': '#FFFFFF',
  },
};
