# Smart Drawio MCP

A local MCP server for generating, validating, repairing and styling editable draw.io XML. It shares the diagram core with Smart Drawio Next. It uses stdio and does not require the Next.js website, a browser, or draw.io Desktop.

## Install from npm

Use Node.js 20.9 or later. Configure a client that supports local stdio MCP servers:

```json
{
  "mcpServers": {
    "smart-drawio": {
      "command": "npx",
      "args": ["-y", "@yunshenwuchuxun/smart-drawio-mcp@0.1.0"]
    }
  }
}
```

The client starts the MCP process. Validation, repair, styling and option discovery work immediately. Configure the four model environment variables below to enable generation.

The [Smart Drawio Skill](https://github.com/yunshenwuchuxun/smart-drawio-next/tree/tools-v0.1.0/skills/smart-drawio) can also use the agent's own model to create XML and then optionally call these tools.

## Run from this repository

Use Node.js 20.9 or later. Build from the repository root:

```sh
pnpm install --frozen-lockfile
pnpm build:mcp
```

Configure a client that supports local stdio MCP servers:

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

Replace the absolute path with your checkout path. The client launches the process; running the executable directly waits for JSON-RPC on stdin. stdout contains only MCP messages.

The npm executable is `smart-drawio-mcp`. Running it directly waits for JSON-RPC on stdin; it is intended to be started by an MCP client.

## Optional model configuration

Validation, repair, styling and the options catalog work without model credentials. Only `generate_drawio` requires the following four environment variables, set on the MCP process:

| Variable | Meaning |
| --- | --- |
| `SMART_DRAWIO_PROVIDER` | `openai` or `anthropic` |
| `SMART_DRAWIO_BASE_URL` | Compatible HTTP(S) base URL, e.g. `https://api.openai.com/v1` or a local model endpoint |
| `SMART_DRAWIO_API_KEY` | Provider API key; for a local endpoint that ignores authentication, use a non-empty placeholder |
| `SMART_DRAWIO_MODEL` | Model ID supported by that provider |

Use your client's environment or secret settings. Credentials are absent from tool arguments and results. Localhost and custom HTTP(S) providers are supported. A base URL must not contain embedded credentials, query parameters or fragments.

Example using placeholder settings in the client configuration:

```json
{
  "mcpServers": {
    "smart-drawio": {
      "command": "node",
      "args": ["/absolute/path/smart-drawio-next/packages/mcp/dist/stdio.js"],
      "env": {
        "SMART_DRAWIO_PROVIDER": "openai",
        "SMART_DRAWIO_BASE_URL": "http://localhost:11434/v1",
        "SMART_DRAWIO_API_KEY": "local-placeholder",
        "SMART_DRAWIO_MODEL": "your-local-model-id"
      }
    }
  }
}
```

Restart the MCP process after changing its model settings. Generation has a 240-second total deadline and a 60-second inactivity deadline. Client cancellation aborts the provider request.

## Tools

| Tool | Inputs | Behavior |
| --- | --- | --- |
| `list_drawio_options` | `{}` | Discover IDs and descriptions for chart types, themes, style packs, presets, text tools and tricks |
| `validate_drawio` | `xml` | Validate XML syntax, IDs, parents and edge references |
| `repair_drawio` | `xml` | Repair supported missing closing tags and validate the repaired result |
| `style_drawio` | `xml`; optional `theme`, `sourceTheme`, `stylePack`, `presets`, `textTool`, `trick` | Return a transformed XML document; `presets` is an ID-to-boolean map |
| `generate_drawio` | `prompt`; optional `chartType="auto"`, `theme="research"` | Generate with the configured provider and return complete, validated XML |

Every result includes `structuredContent` with `ok`, `diagnostics`, and optional `xml`, `stats` or `options`. Text content includes diagnostics and the XML when available. Tool failures set `isError: true`; invalid tool arguments are rejected by the MCP SDK. Cancelled calls follow MCP cancellation semantics.

Example style request after discovering the IDs:

```json
{
  "xml": "<mxfile>...</mxfile>",
  "stylePack": "researchClean",
  "presets": { "shadow": false }
}
```

## Supported scope

This version handles uncompressed `.drawio` XML, with an MCP input limit of 2,097,152 characters per XML document. Prompts are limited to 262,144 characters. Compressed diagrams and legacy JSON drawing formats must be converted to uncompressed XML first.

The server returns diagram data in memory. The client decides whether and where to save `.drawio` files. It does not read the current browser canvas, select nodes, export PNG/PDF screenshots, manage realtime editor sessions or offer a remote HTTP MCP endpoint.

Import the returned XML into draw.io, or use the Smart Drawio Next website for visual editing. Generation calls the configured external provider; validation, repair and style transformations stay local.

## Factory API

```js
import { createSmartDrawioServer } from '@yunshenwuchuxun/smart-drawio-mcp';
import { serveStdio } from '@modelcontextprotocol/server/stdio';

serveStdio(() => createSmartDrawioServer());
```

`createSmartDrawioServer({ env, core })` allows a supplied environment and core implementation for embedding or testing. The package also exports the shared diagram core under `@yunshenwuchuxun/smart-drawio-mcp/core`.
