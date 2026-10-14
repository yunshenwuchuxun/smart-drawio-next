# Skill 与 MCP 发布

0.1.0 已公开发布：Skill 通过 GitHub 源码和 ZIP 分发，MCP 通过 npm 分发并登记到官方 Registry。网页继续从根目录构建并部署到 Vercel；工具包独立打包，不需要运行网页。完整 CLI 产品和远程 HTTP MCP 属于可选后续功能。

## 验证与打包

在仓库根目录执行：

```bash
pnpm install --frozen-lockfile
pnpm exec vitest run
pnpm test:skill
pnpm verify:mcp
pnpm lint
pnpm build
pnpm pack:tools
```

`verify:mcp` 会构建 npm 包，在仓库外的临时目录安装其真实 tarball，并验证核心导入、stdio 握手、工具发现、校验和样式调用。安装验证不会发布到 npm 或改动客户端配置。

`pack:tools` 在 `artifacts/` 生成 MCP `.tgz`、Skill `.zip` 和 `SHA256SUMS`。解压 Skill 后，`smart-drawio/` 目录包含完整指令、参考资料、模板和独立校验脚本。

## 本地 MCP 接入

构建命令为 `pnpm build:mcp`。客户端以 stdio 启动：

```json
{
  "mcpServers": {
    "smart-drawio": {
      "command": "node",
      "args": ["/absolute/path/smart-drawio-next/packages/mcp/dist/stdio.js"]
    }
  }
}
```

这是采用 `mcpServers` JSON 配置的客户端示例；不同客户端请使用其本地 MCP 配置入口并填入相同 command/args。完整配置、模型环境变量和工具说明见 [MCP README](../packages/mcp/README.md)。

也可在独立目录用 `npm install /absolute/path/to/the-package.tgz` 安装本轮生成的 tarball。连接时将脚本路径改为该目录中的 `node_modules/@yunshenwuchuxun/smart-drawio-mcp/dist/stdio.js`；这种安装方式不需要复制网站源码。

`validate_drawio`、`repair_drawio`、`style_drawio` 和 `list_drawio_options` 不需要模型密钥。`generate_drawio` 使用 MCP 进程环境中的模型配置；Skill 也可利用助手自身模型创建 XML，然后调用本地工具校验和处理。

## 分发位置

1. GitHub：发布源码、示例、Skill 目录与版本下载文件。
2. npm：发布独立 MCP 包，用户安装后在本地运行。
3. 官方 MCP Registry：登记 `server.json` 中的安装元数据。Registry 保存元数据，包需先发布到 npm。
4. Smithery：后续可分发 MCPB 本地包；远程模式则登记已部署的 HTTPS MCP 地址。

现有网页地址是应用入口；本轮未新增远程 MCP 连接地址。

## 版本发布入口

- [GitHub Release：tools-v0.1.0](https://github.com/yunshenwuchuxun/smart-drawio-next/releases/tag/tools-v0.1.0)：Skill ZIP、MCP tarball、示例和校验和。
- [npm：@yunshenwuchuxun/smart-drawio-mcp](https://www.npmjs.com/package/@yunshenwuchuxun/smart-drawio-mcp)：本地 stdio MCP 安装包。
- [官方 MCP Registry 0.1.0](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.yunshenwuchuxun%2Fsmart-drawio/versions/0.1.0)：已登记，状态 `active`，名称 `io.github.yunshenwuchuxun/smart-drawio`。`package.json.mcpName` 与 `server.json.name` 必须一致。

Skill 没有独立 npm 包，也不包含在 MCP npm 包内。`npx skills add` 使用通用安装器从 GitHub 下载 Skill。

首次工具发布使用独立分支和固定标签，保留了当时的网页版本。`main` 用于后续同步项目源码和文档；推送会触发仓库已配置的 CI 和 Vercel Git 集成。`tools-v0.1.0` 标签和已发布安装包保持原内容，README 更新不会覆盖 npm 0.1.0。

公开 GitHub Skill 安装、npm 匿名安装、MCP 握手及工具调用均已验证。发布版本的 [GitHub 托管 CI](https://github.com/yunshenwuchuxun/smart-drawio-next/actions/runs/38578657214) 通过 291 个 JavaScript、11 个 Python 和 8 个浏览器测试，以及 lint、生产构建和 tarball 独立安装检查。

## npm 与 Registry

验证最终 tarball 后发布同一个文件，保持其内容与 GitHub 下载一致：

```bash
npm publish artifacts/yunshenwuchuxun-smart-drawio-mcp-0.1.0.tgz --access public --registry=https://registry.npmjs.org
npm view @yunshenwuchuxun/smart-drawio-mcp@0.1.0 version mcpName

mcp-publisher validate packages/mcp/server.json
mcp-publisher login github --registry=https://registry.modelcontextprotocol.io
mcp-publisher publish packages/mcp/server.json
```

npm 发布需要 scope 权限及账号要求的身份验证。Registry 的 GitHub 身份需拥有相应个人命名空间；组织命名空间需要组织 Owner 权限。`mcp-publisher` 的 `--registry` 用于登录，发布使用该登录目标。

## 来源与许可

本项目原有 README 声明 MIT，分发包包含完整 MIT 文本。上游 [smart-excalidraw-next 的固定提交 README](https://github.com/liujuntao123/smart-excalidraw-next/blob/fd139925b01ab34203510d6afa560aa56fcc3201/README.md#L158-L160) 也明确声明 `MIT License`。该提交未提供独立 LICENSE 文件或具体版权行；来源说明记录这一事实并保留上游作者和项目链接，不推断版权年份。详见 [MCP NOTICE](../packages/mcp/NOTICE)。

发布 npm 时只发布 `packages/mcp`，网站根包继续保持 `private:true`。每次发布统一更新 MCP 包版本、服务版本和 Registry 元数据，再重新打包验证。

参考：[官方 Registry 发布指南](https://modelcontextprotocol.io/registry/quickstart)、[Smithery 发布说明](https://smithery.ai/docs/build/publish)。
