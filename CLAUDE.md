# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Smart Drawio Next is a Next.js application that generates editable Draw.io diagrams from natural language descriptions or reference images using LLM APIs. Users describe what they want (e.g., "a Transformer architecture diagram") and the system streams back Draw.io XML that renders in an embedded draw.io iframe.

## Technology Stack

- **Framework**: Next.js 16 with App Router + React 19
- **UI**: Tailwind CSS v4 with CSS custom properties for light/dark theming (`globals.css`)
- **Canvas**: Embedded draw.io iframe (dynamically imported, SSR-disabled)
- **Editor**: Monaco Editor (`@monaco-editor/react`)
- **LLM Integration**: OpenAI/Anthropic-compatible APIs with SSE streaming
- **Validation**: Zod (`lib/schemas.js`)
- **State**: Client-side localStorage via `lib/storage.js` wrapper
- **Testing**: Vitest (unit) + Playwright (E2E)

## Development Commands

```bash
pnpm install                    # Install dependencies
pnpm dev                        # Start dev server (webpack mode)
pnpm build                      # Production build
pnpm start                      # Start production server
pnpm lint                       # Run ESLint
pnpm test                       # Run unit tests (vitest, watch mode)
pnpm test -- run                # Run unit tests once (no watch)
pnpm test -- tests/lib/theme-engine.test.js   # Run a single test file
pnpm test:coverage              # Run tests with v8 coverage
pnpm test:ui                    # Run tests with Vitest UI
pnpm test:e2e                   # Run E2E tests (Playwright, needs dev server)
```

**Requirements**: Node.js >= 18.18, pnpm

## Architecture

### Core Generation Flow

```
User Input (Chat.jsx)
  -> app/page.js orchestrates state
    -> useGenerationWorkflow hook
      -> POST /api/generate (SSE streaming)
        -> lib/generate-route-utils.js (validation, message building)
          -> lib/llm-client.js (OpenAI/Anthropic adapter)
            -> Stream chunks back via SSE
              -> lib/drawio-code-utils.js (parse, sanitize, post-process)
                -> lib/theme-postprocess.js (auto-apply tricks per theme)
                  -> CodeEditor + DrawioCanvas update
```

### State Management

All application state lives in `app/page.js` and flows down as props. No global state library. Complex logic is extracted into three custom hooks:

| Hook | Location | Purpose |
|------|----------|---------|
| `useGenerationWorkflow` | `lib/hooks/use-generation-workflow.js` | Generation lifecycle: streaming, continuation, optimization, error handling, blueprint phases |
| `useToolsPanel` | `lib/hooks/use-tools-panel.js` | Style preset toggles, drawing tricks, text tools, style packs |
| `useXmlHistory` | `lib/hooks/use-xml-history.js` | Undo/redo stack for XML snapshots (max 20 entries) |

Pattern for adding new state: add to `app/page.js`, pass handlers/state as props, use `useEffect` for localStorage sync.

### Tools System

The tools system (`lib/tool-registry.js`) aggregates four categories of XML post-processing tools, all following the same pattern: take XML in, return `{ xml, error?, stats? }`.

| Category | Module | What it does |
|----------|--------|-------------|
| Style Presets | `lib/style-presets.js` | Toggle-based effects (shadow, gradient, rounded, glass) |
| Text Style Tools | `lib/text-style-tools.js` | Font/text transformations |
| Style Packs | `lib/style-packs.js` | Multi-property style bundles |
| Drawing Tricks | `lib/drawing-tricks.js` | Structural transforms (grid snap, smart arrows, orthogonal routing, label backgrounds) |

### Theme System

Two separate theme systems:

1. **UI Theme** (light/dark/system): CSS custom properties in `globals.css`, toggled via `data-theme` attribute. Managed by `lib/theme-mode.js`.
2. **Diagram Theme** (10 color palettes): `lib/themes/` directory. Each theme defines a `colorPalette` with semantic tokens. `lib/theme-engine.js` handles XML style parsing (`parseStyle`/`stringifyStyle`) and color remapping. `lib/theme-postprocess.js` auto-applies certain drawing tricks per theme (e.g., research theme gets orthogonal routing + smart arrows).

### Storage

Uses `lib/storage.js` wrapper with in-memory Map fallback for SSR/privacy mode. Keys prefixed with `smart-drawio-*`:

| Key | Purpose |
|-----|---------|
| `smart-drawio-configs` | Array of LLM configs |
| `smart-drawio-active-config` | Current config ID |
| `smart-drawio-history` | Last 20 generations |
| `smart-drawio-diagram-theme` | Current diagram theme |
| `smart-drawio-style-presets` | Active style presets |
| `smart-drawio-theme-mode` | UI theme (light/dark/system) |
| `smart-drawio-active-panel` | Currently open sidebar panel |

Legacy keys (`smart-excalidraw-*`) are auto-migrated on first load via `ensureMigration()`.

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/generate` | POST | Main generation endpoint (SSE streaming), rate-limited |
| `/api/models` | GET | List available models from configured provider |
| `/api/configs` | POST | Test LLM connection |

The generate route uses `lib/rate-limiter.js` for IP-based throttling and `lib/generate-route-utils.js` for payload validation, vision model detection, and message assembly.

### Layout Structure

- `TopBar.jsx`: Header with logo, model status, history/settings buttons
- `WorkspaceSidebar.jsx`: Composes the sidebar with three accordion panels (input, code, tools)
- `Sidebar.jsx`: Collapsible container with responsive breakpoints
- `SidebarCard.jsx`: Accordion-style expandable panel
- `Spine.jsx`: Collapsed sidebar mini-view with icon buttons

### Key Modules

| Module | Purpose |
|--------|---------|
| `lib/llm-client.js` | OpenAI/Anthropic API adapter with streaming |
| `lib/prompts.js` | System prompts, user prompt templates, continuation/optimization prompts |
| `lib/drawio-code-utils.js` | SSE stream reading, XML header stripping, post-processing |
| `lib/generation-utils.js` | Input normalization, error parsing, content extraction |
| `lib/config-manager.js` | CRUD operations for LLM configs in localStorage |
| `lib/schemas.js` | Zod schemas for config validation (`ConfigSchema`, `ConnectionConfigSchema`) |
| `lib/optimizeArrows.js` | Arrow anchor point optimization algorithm |
| `lib/blueprint-phase.js` | Generation phase constants (SCANNING -> DRAFTING -> REVEAL) |

## Common Tasks

### Adding a New Chart Type
1. Add entry to `CHART_TYPES` in `lib/constants.js`
2. Update system prompt in `lib/prompts.js` if needed

### Adding a New Style Preset
1. Add preset definition in `lib/style-presets.js` with `styleChanges` and `disableChanges`
2. It auto-registers via `lib/tool-registry.js`

### Adding a New Drawing Trick
1. Add trick definition in `lib/drawing-tricks.js` with an `apply(xml)` function
2. If it should auto-apply for a theme, add it to `THEME_POSTPROCESSING_TRICKS` in `lib/theme-postprocess.js`

### Adding a New Diagram Theme
1. Create theme file in `lib/themes/` following existing pattern (export `colorPalette` + metadata)
2. Register in `lib/themes/index.js`

## Environment Variables

Optional server-side LLM config (`.env`):

```bash
ACCESS_PASSWORD=your-secure-password
SERVER_LLM_TYPE=openai
SERVER_LLM_BASE_URL=https://api.openai.com/v1
SERVER_LLM_API_KEY=sk-...
SERVER_LLM_MODEL=gpt-4
```

## Path Aliases

`@/` maps to project root (configured in `jsconfig.json`):
```javascript
import { storage } from '@/lib/storage';
```

## UI Language

UI strings are in Chinese. Maintain consistency when modifying.
