# XML 格式与已有图修改

采用 UTF-8 未压缩 `.drawio`：外层 `mxfile`，每个 `diagram` 含一个 `mxGraphModel`，其下只有一个 `root`。为页面设置稳定的 `id` 和 `name`；页面内至少有无 parent 的 cell `0`，以及 `parent="0"` 的 cell `1`。

```xml
<mxfile>
  <diagram id="main" name="主图">
    <mxGraphModel grid="1" gridSize="10">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        <mxCell id="input" value="输入" vertex="1" parent="1"
          style="rounded=1;whiteSpace=wrap;html=1;fillColor=#F7F9FC;strokeColor=#2C3E50;fontFamily=Arial;fontSize=12;">
          <mxGeometry x="40" y="80" width="140" height="60" as="geometry"/>
        </mxCell>
        <mxCell id="output" value="输出" vertex="1" parent="1"
          style="rounded=1;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#2C3E50;fontFamily=Arial;fontSize=12;">
          <mxGeometry x="260" y="80" width="140" height="60" as="geometry"/>
        </mxCell>
        <mxCell id="flow" edge="1" parent="1" source="input" target="output"
          style="edgeStyle=orthogonalEdgeStyle;html=1;endArrow=classic;strokeColor=#2C3E50;">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

修改已有图时：

- 每页独立维护 ID：同一页不能重名，不同页可复用；parent/source/target 只能引用本页已有 cell。可以先声明边，再声明端点。
- 分组节点在 `root` 内声明，子节点用分组 ID 作 parent；子节点坐标相对父容器，不要直接套用全页坐标重排嵌套图。
- `vertex="1"` 或 `edge="1"` 的 cell 需要 `mxGeometry as="geometry"`。边可用 source/target，也可用几何 sourcePoint/targetPoint 表达悬空端点；自环是有效关系，parent 循环不是。
- 普通属性的 `&`、`<`、`>`、引号按 XML 规则转义。`html=1` 富文本写成 `value="&lt;b&gt;标题&lt;/b&gt;&lt;br&gt;内容"`；不要插入自定义实体或 DOCTYPE。
- 常见 `object` / `UserObject` 包装 cell 可以把 ID 放在外层对象上；外层与内部同时提供不同 ID 时先消除歧义。
- 样式修改应保留 geometry；布局修改应列出变动范围。新增节点使用不会与原图冲突的稳定 ID。

离线脚本接受完整 `mxfile` 或裸 `mxGraphModel`。交付时把裸模型放进带稳定页面 ID 的 `mxfile`。脚本支持上述基础结构、常见对象包装及多页引用校验；压缩 `diagram` 文本、扩展格式和视觉布局不在其验证范围内。该检查通过不能证明内容准确、节点不重叠或字体实际可用。
