# Smart Drawio Skill & MCP 0.1.0

Create, validate, repair and style editable Draw.io diagrams from an agent, with the website and local tools sharing one drawing core.

## Skill

`smart-drawio` includes scoped instructions, XML and delivery references, two editable templates and a Python 3 standard-library validator. It uses the agent's own model; an external generation API and MCP are optional.

```sh
npx skills add https://github.com/yunshenwuchuxun/smart-drawio-next/tree/tools-v0.1.0/skills/smart-drawio
```

Invoke `$smart-drawio` with a diagram request and an output path. The agent saves a `.drawio` file; previews require an available Draw.io renderer.

## MCP

`@yunshenwuchuxun/smart-drawio-mcp@0.1.0` is a standalone local stdio server for Node.js 20.9 or later.

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

Its five tools are `generate_drawio`, `validate_drawio`, `repair_drawio`, `style_drawio` and `list_drawio_options`. Only generation requires `SMART_DRAWIO_PROVIDER`, `SMART_DRAWIO_BASE_URL`, `SMART_DRAWIO_API_KEY` and `SMART_DRAWIO_MODEL`. The server returns XML for the client to save.

## Validation and examples

- Protocol and shared-core tests, independent Skill validator tests and isolated tarball installation checks pass.
- The MCP generation path produced a Transformer diagram through a real OpenAI-compatible API request with model `codex/gpt-6.1-sol`, followed by MCP validation and official Draw.io rendering.
- The Skill independently produced a second editable Transformer diagram using the agent's own model, with offline validation, official Draw.io rendering and technical review.
- Both example `.drawio` files and previews are included in the release downloads, together with the packages and `SHA256SUMS`.

This version supports uncompressed XML. It provides local stdio MCP; the existing Vercel URL remains a website. Model-backed generation may take several minutes, and an available renderer is needed for image previews or export.

The release uses a separate tools branch and tag. It does not update the Vercel production website.
