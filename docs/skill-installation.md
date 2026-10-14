# Smart Drawio Skill 安装说明

Skill 本体位于 `skills/smart-drawio/`，可以独立复制，不需要仓库的 `app/`、`lib/`、`packages/` 或 `node_modules/`。运行 `pnpm pack:tools` 可生成独立安装 ZIP；解压后使用其中的 `smart-drawio/` 目录。

## 安装与使用

公开版本可用 Skills CLI 安装：

```bash
npx skills add https://github.com/yunshenwuchuxun/smart-drawio-next/tree/tools-v0.1.0/skills/smart-drawio
```

也可从 [GitHub Release](https://github.com/yunshenwuchuxun/smart-drawio-next/releases/tag/tools-v0.1.0) 下载 `smart-drawio-skill-0.1.0.zip`，解压后按下面步骤复制安装。选择目标 Agent 的安装范围；本项目不自动更改全局配置。

1. 把整个 `skills/smart-drawio` 目录放入目标 Agent 客户端支持的技能目录；保留 `SKILL.md`、`agents/`、`references/`、`assets/` 和 `scripts/` 的相对位置。
2. 在客户端调用 `$smart-drawio`，例如：“为我的方法创建包含输入、编码器与输出的可编辑科研结构图，保存为 architecture.drawio。”
3. 没有 MCP 时，Agent 可以用自身模型生成 XML；离线校验脚本需要 Python 3，无第三方 Python 依赖。MCP 已配置时可使用其校验、修复和样式工具。Skill 不自动配置或安装 MCP，也不需要为助手自身的生成路径另配外部模型。

离线校验示例（目录路径按实际安装位置修改）：

```bash
python3 /path/to/smart-drawio/scripts/validate_drawio.py /path/to/diagram.drawio
```

脚本只读，不写图、不修复图。输出 JSON，退出码 `0` 通过、`1` 失败、`2` 不支持或无法读取；接受 UTF-8 未压缩 `mxfile` / `mxGraphModel`，最大 2 MiB。压缩页、PNG/SVG 内嵌 XML、图表渲染及高级样式检查不在此脚本范围内。

## 发布前验证

```bash
python3 -m unittest discover -s tests/skills -p 'test_*.py' -v
python3 /path/to/skill-creator/scripts/quick_validate.py skills/smart-drawio
```

独立安装测试会复制整个技能到临时目录，并以 Python `-I` 隔离模式执行随包脚本，确认其不依赖源码路径或第三方包。官方 `quick_validate.py` 自身需要 PyYAML；这只影响创作者的发布检查，不是终端用户运行本 Skill 的依赖。

发布包仅包含技能文件、实际模板与 MIT 许可证，排除 `__pycache__`、`.pyc` 及测试产物。项目来源和许可声明见 [发布说明](publishing.md)。
