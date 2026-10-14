# Smart Drawio Next

[中文文档](./README.zh.md)

> Generate editable Draw.io diagrams from natural language or reference images in seconds, optimized for research, documentation, and presentations.

## Live Demo

- Demo: <https://smart-drawio-next.vercel.app/>
- Note: the hosted version requires your own API key

## Gallery

| Home | Transformer |
|------|-------------|
| ![Home](./public/images/page.png) | ![Transformer](./public/images/transformer.png) |

| Swin-Transformer | CLIP |
|------------------|------|
| ![Swin-Transformer](./public/images/swin.png) | ![CLIP](./public/images/clip.png) |

### ProSST

![ProSST](./public/images/prosst.png)

## Overview

[smart-drawio-next](https://github.com/yunshenwuchuxun/smart-drawio-next) is a diagram generation tool built with Next.js 16, embedded Draw.io, and streaming LLM APIs. It helps you:

- Generate structured diagrams from natural language prompts
- Upload reference images and convert them into editable diagram content
- Fine-tune XML / JSON in Monaco Editor
- Sync output directly into an embedded Draw.io canvas
- Use post-processing tools to improve layout, connectors, styles, and annotations

The project includes multi-model configuration, workspace recovery, generation history, and notifications. It can be deployed as a personal tool or an internal team service.

## Core Features

- **Streaming generation** with support for continuing truncated outputs
- **Multimodal input** with both text and image-based workflows
- **Code + canvas workflow** for editing XML and previewing the result side by side
- **Post-processing toolchain** for structure, text, connector, and style refinement
- **Multi-provider config management** for OpenAI / Anthropic-compatible APIs
- **Local history** with replay support for recent generations

## Agent Skill and MCP

The Skill creates editable diagrams using the agent's own model. Install the versioned Skill with:

```sh
npx skills add https://github.com/yunshenwuchuxun/smart-drawio-next/tree/tools-v0.1.0/skills/smart-drawio
```

Invoke `$smart-drawio` to create or modify research diagrams, architecture diagrams and flowcharts. Its Python 3 validator works offline without third-party dependencies; MCP is optional.

The local MCP server exposes `generate_drawio`, `validate_drawio`, `repair_drawio`, `style_drawio` and `list_drawio_options`. Use `npx -y @yunshenwuchuxun/smart-drawio-mcp@0.1.0` as the client's stdio command. Generation uses your configured OpenAI/Anthropic-compatible provider; the other tools need no model credentials.

See [MCP setup](packages/mcp/README.md), [Skill installation](docs/skill-installation.md), and [version downloads](https://github.com/yunshenwuchuxun/smart-drawio-next/releases/tag/tools-v0.1.0). The Next.js application remains independently deployable to Vercel.

## Supported Diagram Types

The app supports 20+ diagram types. You can choose one explicitly or let the model decide:

- Flowchart
- Mind Map
- Org Chart
- Sequence Diagram
- UML Class Diagram
- ER Diagram
- Gantt Chart
- Timeline
- Tree
- Network Topology
- Architecture Diagram
- Data Flow Diagram
- State Diagram
- Swimlane Diagram
- Concept Map
- Fishbone Diagram
- SWOT Analysis
- Pyramid Diagram
- Funnel Diagram
- Venn Diagram
- Matrix Diagram
- Infographic

## Built-in Themes

10 built-in color themes are available:

- Research
- Business
- Warm
- Cool
- Dark
- Contrast
- Pastel
- Forest
- Violet
- Neutral

## Tools System

After generation, you can continue refining the diagram in the sidebar tools panel. All operations are XML-based transforms.

### Drawing Tricks

Used for bulk layout and connector refinement:

- **Grid Snap**
- **Orthogonal Routing**
- **Curved Routing**
- **Label Background**
- **Consistent Spacing**
- **Jump Crossings**
- **Rounded Edges**
- **Normalize Arrows**
- **Remove Waypoints**

### Style Presets

Used for stackable visual effects:

- Shadow
- Gradient
- Rounded
- Glass
- Sketch
- Comic
- Dashed
- Transparent
- Bold Stroke
- No Stroke
- Absolute Arc
- Cross-Hatch
- Dot Fill
- Zigzag Fill
- Semi-Opaque
- Fade Stroke
- Fixed Dash
- Open Arrow

### Style Packs

Used for one-click full visual styles:

- **Research Clean**
- **Presentation Cards**
- **Business Clean**
- **Flat Minimal**
- **Wireframe**
- **Comic Whiteboard**
- **Watercolor Sketch**
- **Minimal Outline**
- **Sticky Notes**
- **Blueprint Tech**

### Text Tools

Used for batch text formatting:

- Wrap Labels
- Center Text
- Text Panels
- Bold Text
- Compact Text
- Text Padding

## Tools System Examples

| Baseline: no style | Preset: comic + cross-hatch |
|--------------------|-----------------------------|
| ![Baseline no style](./public/images/tools-baseline-no-style.png) | ![Comic and cross-hatch preset](./public/images/tools-presets-comic-crosshatch.png) |

| Style pack: blueprint tech | Style pack: business clean |
|----------------------------|----------------------------|
| ![Blueprint tech style pack](./public/images/tools-style-pack-blueprint-tech.png) | ![Business clean style pack](./public/images/tools-style-pack-business-clean.png) |

## UI Structure

1. **Input Area (Chat + ImageUpload)**
   - Enter prompts
   - Upload reference images
   - Stop or continue generation

2. **Code Editor**
   - View and edit XML / JSON
   - Run clear, optimize, advanced optimize, and apply actions

3. **Canvas**
   - Render the generated result
   - Continue editing visually in Draw.io

4. **Support Modals**
   - `ConfigManager`
   - `HistoryModal`
   - `OptimizationPanel`
   - Other supporting panels

## Developing the Tools

The website and tools share the drawing core. To build and verify the packages from a source checkout:

```bash
pnpm build:mcp
pnpm test:tools
pnpm test:skill
pnpm verify:mcp
pnpm pack:tools
```

See [packaging and publication](./docs/publishing.md) for release checks. Publish only `packages/mcp`; the website's root package remains private.

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19
- **Canvas**: Draw.io embed
- **Editor**: `@monaco-editor/react`
- **Styling**: Tailwind CSS v4
- **LLM Integration**: OpenAI / Anthropic-compatible APIs with SSE streaming
- **Persistence**: localStorage

## Getting Started

### Requirements

- Node.js >= 20.9 (Node.js 24 LTS recommended)
- pnpm >= 8
- An available OpenAI / Anthropic-compatible API key

### Install and Run

```bash
git clone https://github.com/yunshenwuchuxun/smart-drawio-next.git
cd smart-drawio-next
pnpm install
pnpm dev
```

Then open: <http://localhost:3000>

### Common Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm test -- run` | Run unit tests |

## Docker Deployment

### Requirements

- Docker >= 20.10
- Docker Compose V2

### Quick Start

```bash
docker compose up -d --build
```

Then open: <http://localhost:3000>

The image uses a multi-stage build and Next.js standalone output for deployment-friendly packaging.

### LLM Configuration

Configure the provider, base URL, API key and model in the browser settings.
The current release uses the user's configuration for each generation request.
`ACCESS_PASSWORD` and `SERVER_LLM_*` are not implemented server-side configuration options.

### Proxy and Local Model Setup

If Docker needs a proxy or access to a model running on the host machine:

```bash
cp docker-compose.override.example.yml docker-compose.override.yml
```

Edit it for your environment, then restart:

```bash
docker compose up -d --build
```

Typical use cases:

- Routing traffic through a host proxy
- Accessing host-local Ollama or LM Studio
- Mounting a custom CA certificate for enterprise proxies

### Common Docker Commands

```bash
docker compose logs -f app
docker compose down
docker compose up -d --build
docker compose ps
```

## LLM Configuration

### Client-Side Config Mode

By default, users configure these in the UI:

- Provider
- Base URL
- API Key
- Model

All values are stored in browser localStorage only.

### Workspace Recovery and Request Limits

The applied diagram, unapplied code draft, text input, theme and presets are saved locally after changes and restored on reload. The header reports whether the draft was saved. Workspace snapshots exclude provider credentials and uploaded image data; images must be uploaded again after a reload.

Generation accepts requests up to 4 MiB and images up to 2 MiB to leave room for base64 encoding on Vercel. Model requests have a 240-second total deadline and a 60-second idle deadline. Stopping generation cancels pending retries and continuation requests as well as the upstream model request.

XML validation runs in browsers and Node.js. Each uncompressed page is checked independently for malformed XML, duplicate IDs, invalid parent chains and missing references. Compressed `.drawio` pages are not supported in this phase. Truncated output stays in the editor; explicitly applying it can repair missing closing tags and reports any discarded tail.

Legacy JSON input rejects unsupported or invalid elements without replacing the current diagram or draft. Explicitly applying `[]` creates an empty diagram and can be undone.

## FAQ

### Will my API key be uploaded to a third party?

No. Local configuration stays in the browser. Requests first go to your own server, which then calls the external model provider.

### What if the output is truncated?

The UI provides a continue-generation action automatically when needed.

### What if image recognition fails?

Use a vision-capable model and make sure the image format and size are valid.

### Will history grow without limit?

No. The app keeps only the most recent 20 entries by default.

## Credits and Contributing

- This project is based on [smart-excalidraw-next](https://github.com/liujuntao123/smart-excalidraw-next)
- If it helps you, consider:
  - Giving the repo a star
  - Sharing it with others

## License

MIT
