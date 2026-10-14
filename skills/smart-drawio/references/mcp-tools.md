# 可选 MCP 工具

Smart Drawio MCP 可用时，按照当前工具 schema 调用，不依赖特定客户端暴露的命名空间前缀。优先用助手自身模型生成 XML；MCP 的外部模型生成不是必需步骤。

| 工具 | 什么时候用 |
|---|---|
| `list_drawio_options` | 查询本次安装实际提供的图类型、主题、预设和操作；不要猜主题或预设 ID |
| `validate_drawio` | 检查待交付 XML；诊断失败时修改草稿，保留已有文件 |
| `repair_drawio` | 用户要求或已经授权恢复截断 XML；先保存原稿，检查结果及内容丢弃提示 |
| `style_drawio` | 用户希望统一主题、字体、连线或应用预设；处理后重新校验，并核对 geometry 是否按预期保留 |
| `generate_drawio` | 调用方已经配置外部模型且需要该生成路径；否则直接由助手生成 XML，再调用校验/样式工具 |

首版本地 MCP 返回 XML 与结构化诊断，由助手负责写 `.drawio` 文件；工具成功响应不等于图已写到磁盘、已打开浏览器或已通过视觉检查。只有当前 MCP 明确提供这些能力时才调用它们。

当前接口：`validate_drawio` / `repair_drawio` 接收 `{xml}`；`style_drawio` 接收 `xml` 及可选的 `theme`、`sourceTheme`、`stylePack`、`presets`（预设 ID 到布尔值的映射）、`textTool`、`trick`。`generate_drawio` 接收 `prompt` 及可选 `chartType`、`theme`。不要向工具传入密钥、整套模型配置或未声明的字段。

结果的 `structuredContent.ok` 表示操作是否成功，`diagnostics` 提供错误或提示；成功结果可能包含 `xml`、`stats` 或 `options`。`list_drawio_options` 的 `options` 包含图类型、主题、风格套装、预设、文本工具与绘图技巧列表。仍以当前安装的工具 schema 为准。

工具返回错误或取消时停止使用该结果替换原图。离线 Python 校验脚本是基础结构检查替代方案，既不提供 MCP 样式转换，也不承诺与服务端的诊断完全一致。
