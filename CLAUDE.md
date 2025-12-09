# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Smart Drawio Next is a Next.js application that generates editable Draw.io diagrams from natural language descriptions or reference images using LLM APIs. Users can describe what they want (e.g., "a Transformer architecture diagram") and the system streams back either JSON elements or Draw.io XML that can be visualized and edited.

## Technology Stack

- **Framework**: Next.js 16 with App Router + React 19
- **UI**: Tailwind CSS v4 (experimental with `@theme inline` syntax)
- **Canvas**: Embedded draw.io iframe and Excalidraw
- **Editor**: Monaco Editor for code editing
- **LLM Integration**: OpenAI/Anthropic-compatible APIs with SSE streaming
- **State**: Client-side localStorage for configs, history, and passwords

## Development Commands

```bash
# Install dependencies (pnpm recommended)
pnpm install

# Start development server with webpack
pnpm dev

# Production build
pnpm build

# Start production server (requires build first)
pnpm start

# Run ESLint
pnpm lint
```

**Requirements**: Node.js ≥ 18.18

## Architecture & Key Concepts

### Application Structure

The app is a **single-page client-driven application** with state orchestrated entirely in `app/page.js`:

- **`app/page.js`**: Main orchestrator containing all state management (generation status, config, modals, panels, errors). All UI updates flow through this component.
- **`app/api/`**: Server-side API routes that stream LLM responses as Server-Sent Events (SSE)
  - `generate/`: Main generation endpoint
  - `models/`: List available models
  - `configs/`: Test configurations
  - `auth/validate`: Validate access passwords

### Critical Flow Patterns

#### 1. **LLM Generation Flow**

```
User Input (Chat.jsx)
  → app/page.js setState
    → POST /api/generate with streaming
      → lib/llm-client.js (OpenAI/Anthropic adapter)
        → Stream chunks back as SSE
          → app/page.js accumulates response
            → Update CodeEditor + DrawioCanvas
```

**Key Files**:
- `lib/llm-client.js`: Handles OpenAI/Anthropic API calls with streaming support
- `lib/prompts.js`: System prompts and prompt templates
- `lib/constants.js`: Chart type definitions and constants
- `app/api/generate/route.js`: SSE streaming endpoint

#### 2. **Configuration Management**

Two modes exist:
- **Client-side configs** (default): Multiple configs stored in `localStorage` with key `smart-excalidraw-configs`
- **Server-side config** (optional): Enabled via access password in `.env`, accessed when `x-access-password` header matches `ACCESS_PASSWORD`

**Key Files**:
- `lib/config-manager.js`: Modern config CRUD and localStorage management
- `lib/config.js`: Legacy config adapter (migration layer)
- `components/ConfigManager.jsx`: UI for managing multiple configs

#### 3. **Data Format & Rendering**

The system supports two output formats:
1. **JSON Elements**: Array of shape objects that get converted to Draw.io components
2. **Draw.io XML**: Direct `mxGraphModel` XML that can be loaded into draw.io

**Key Files**:
- `components/DrawioCanvas.jsx`: Manages draw.io iframe communication via `postMessage`
- `components/CodeEditor.jsx`: Monaco editor for viewing/editing generated code
- `lib/optimizeArrows.js`: Arrow anchor optimization logic

### Storage Namespaces

All localStorage keys use the prefix `smart-excalidraw-*`:
- `smart-excalidraw-configs`: Array of all saved configs
- `smart-excalidraw-active-config`: ID of currently active config
- `smart-excalidraw-history`: Last 20 generations
- `smart-excalidraw-use-password`: Boolean flag for access password mode
- `smart-excalidraw-password`: Stored access password

### Important Patterns

#### Client-Side State Management
All application state lives in `app/page.js` and is passed down as props. There's no global state management library. When adding new features, follow this pattern:
- Add state to `app/page.js`
- Pass handlers and state as props to child components
- Use `useEffect` in `app/page.js` for localStorage sync

#### Dynamic Imports for SSR
Draw.io and Excalidraw canvases are dynamically imported with `ssr: false` to avoid server-side rendering issues:
```javascript
const DrawioCanvas = dynamic(() => import('@/components/DrawioCanvas'), {
  ssr: false,
});
```

#### API Route Streaming Pattern
API routes return `ReadableStream` with SSE format. Each chunk is prefixed with `data: ` and terminated with `\n\n`:
```javascript
const stream = new ReadableStream({
  async start(controller) {
    controller.enqueue(`data: ${JSON.stringify({ content: chunk })}\n\n`);
  }
});
```

#### Error Handling
- API errors are caught and stored in `apiError` state
- JSON parsing errors are caught and stored in `jsonError` state with line numbers
- Errors are displayed via the `Notification` component

## Environment Variables

Optional server-side LLM configuration (see `.env.example`):

```bash
ACCESS_PASSWORD=your-secure-password
SERVER_LLM_TYPE=openai         # or anthropic
SERVER_LLM_BASE_URL=https://api.openai.com/v1
SERVER_LLM_API_KEY=sk-...
SERVER_LLM_MODEL=gpt-4
```

When these are set, users can enable "Access Password" mode to use the server's API key instead of providing their own.

## Component Organization

### Feature Components (`components/`)
- `Chat.jsx`: User input, chart type selection, generation controls
- `CodeEditor.jsx`: Monaco editor with clear/optimize/apply actions
- `DrawioCanvas.jsx`: Draw.io iframe integration with postMessage API
- `ExcalidrawCanvas.jsx`: Excalidraw canvas alternative
- `ImageUpload.jsx`: Image upload for vision models (≤5MB)
- `OptimizationPanel.jsx`: Advanced optimization checklist UI
- `ConfigManager.jsx`: Multi-config CRUD interface
- `HistoryModal.jsx`: Recent 20 generations with replay
- `AccessPasswordModal.jsx`: Access password enablement
- `ContactModal.jsx`: Contact information modal
- `Notification.jsx`: Toast-style notifications

### Primitive Components (`components/ui/`)
Reusable primitives: `Button`, `Input`, `Modal`, `Select`, `Spinner`

### Utilities (`lib/`)
- `config-manager.js`: Config storage and retrieval
- `history-manager.js`: Generation history (max 20 entries)
- `llm-client.js`: LLM API abstraction layer
- `optimizeArrows.js`: Arrow anchor position optimization
- `prompts.js`: System prompts and templates
- `constants.js`: Chart types and application constants
- `design-system.js`: Shared design tokens
- `imageHelpers.js`: Image compression and base64 conversion

## Common Tasks

### Adding a New Chart Type
1. Add entry to `CHART_TYPES` in `lib/constants.js`
2. Update system prompt in `lib/prompts.js` if needed
3. Chart type will automatically appear in dropdown

### Adding a New LLM Provider
1. Add provider type handling in `lib/llm-client.js` (follow OpenAI/Anthropic pattern)
2. Add provider option in `components/ConfigManager.jsx`
3. Update server route in `app/api/generate/route.js` if using server-side config

### Modifying Optimization Logic
- Auto-optimization: Edit `optimizeExcalidrawCode()` in `lib/optimizeArrows.js`
- AI-based optimization: Modify `OPTIMIZATION_SYSTEM_PROMPT` in `lib/prompts.js`

## Path Aliases

The project uses `@/` as an alias for the root directory (configured in `jsconfig.json`):
```javascript
import Component from '@/components/Component';
import { helper } from '@/lib/helper';
```

## Language & Localization

Most UI strings are currently in Chinese. When modifying UI text, maintain consistency with existing language or add proper i18n if implementing localization.

## Testing

No test framework is currently configured. When adding tests, consider:
- Jest for unit tests
- Playwright for E2E tests of the generation flow
- Testing localStorage interactions requires browser environment mocking

## Deployment Notes

- The app is deployed on Vercel (see README for live URL)
- Requires environment variables to be set in Vercel dashboard for server-side config
- All client-side data (configs, history) is stored in browser localStorage
- No database or backend persistence layer exists
