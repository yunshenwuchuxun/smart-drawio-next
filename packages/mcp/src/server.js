import { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';

import * as diagramCore from '../../core/src/index.js';
import { GenerateConfigSchema, MAX_GENERATE_TEXT_CHARS } from '../../core/src/schemas.js';
import { CHART_TYPES } from '../../core/src/constants.js';
import { themes } from '../../core/src/themes/index.js';

const MAX_XML_CHARS = 2 * 1024 * 1024;
const xmlSchema = z.string().min(1).max(MAX_XML_CHARS).describe('Uncompressed draw.io mxfile or mxGraphModel XML.');
const optionId = z.string().min(1).max(64);
const resultSchema = z.object({
  ok: z.boolean(),
  xml: z.string().optional(),
  diagnostics: z.array(z.object({
    code: z.string(), message: z.string(), severity: z.enum(['error', 'warning', 'info']),
  }).passthrough()),
  stats: z.record(z.string(), z.unknown()).optional(),
  options: z.record(z.string(), z.unknown()).optional(),
}).passthrough();
const localAnnotations = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const failure = (code, message) => ({ ok: false, diagnostics: [{ code, message, severity: 'error' }] });

function cancelledError() {
  const error = new Error('Draw.io operation cancelled.');
  error.name = 'AbortError';
  return error;
}

/** Read provider credentials once; neither tool schemas nor results contain them. */
export function readModelConfig(env = process.env) {
  const fields = ['SMART_DRAWIO_PROVIDER', 'SMART_DRAWIO_BASE_URL', 'SMART_DRAWIO_API_KEY', 'SMART_DRAWIO_MODEL'];
  if (fields.some((field) => typeof env[field] !== 'string' || !env[field].trim())) {
    return { error: failure('MODEL_CONFIG_MISSING', 'Set SMART_DRAWIO_PROVIDER, SMART_DRAWIO_BASE_URL, SMART_DRAWIO_API_KEY and SMART_DRAWIO_MODEL to enable generation.') };
  }
  const parsed = GenerateConfigSchema.safeParse({
    type: env.SMART_DRAWIO_PROVIDER,
    baseUrl: env.SMART_DRAWIO_BASE_URL,
    apiKey: env.SMART_DRAWIO_API_KEY,
    model: env.SMART_DRAWIO_MODEL,
  });
  return parsed.success ? { config: parsed.data }
    : { error: failure('MODEL_CONFIG_INVALID', 'Model configuration must specify an OpenAI/Anthropic provider, an HTTP(S) base URL, an API key and a model.') };
}

function toolResult(result) {
  const failed = result.ok !== true || result.diagnostics?.some((item) => item.severity === 'error');
  const structuredContent = { ...result, ok: !failed };
  const diagnostics = result.diagnostics?.map((item) => `${item.code}: ${item.message}`).join('\n');
  const content = [{ type: 'text', text: diagnostics || (failed ? 'Diagram operation failed.' : 'Diagram operation completed.') }];
  if (typeof result.xml === 'string') content.push({ type: 'text', text: result.xml });
  if (result.options) content.push({ type: 'text', text: JSON.stringify(result.options) });
  return { content, structuredContent, isError: Boolean(failed) };
}

/** Independent factory shared by the stdio entry and protocol tests. */
export function createSmartDrawioServer({ env = process.env, core = diagramCore } = {}) {
  const server = new McpServer({ name: 'smart-drawio', version: '0.1.0' });
  const model = readModelConfig(env);

  const invoke = async (operation, ctx) => {
    const signal = ctx.mcpReq.signal;
    if (signal.aborted) throw cancelledError();
    try {
      const result = await operation(signal);
      if (signal.aborted) throw cancelledError();
      return toolResult(result);
    } catch (error) {
      if (signal.aborted || error?.name === 'AbortError') throw cancelledError();
      // SDK error responses must not expose raw provider errors or credentials.
      return toolResult(failure('TOOL_FAILED', 'The diagram operation could not be completed.'));
    }
  };

  server.registerTool('list_drawio_options', {
    description: 'List available chart types, themes, style packs, presets, text tools and drawing tricks. Use these IDs in other tools.',
    inputSchema: z.object({}).strict(),
    outputSchema: resultSchema,
    annotations: localAnnotations,
  }, (_input, ctx) => invoke(() => core.listDiagramOptions(), ctx));

  server.registerTool('validate_drawio', {
    description: 'Validate uncompressed draw.io XML syntax and diagram structure without modifying it. JSON, compressed diagrams and malformed XML return diagnostics.',
    inputSchema: z.object({ xml: xmlSchema }).strict(),
    outputSchema: resultSchema,
    annotations: localAnnotations,
  }, ({ xml }, ctx) => invoke(() => core.validateDiagram(xml), ctx));

  server.registerTool('repair_drawio', {
    description: 'Conservatively repair missing closing XML tags, then validate the result. Returns XML only as an in-memory result; does not write files or change an editor.',
    inputSchema: z.object({ xml: xmlSchema }).strict(),
    outputSchema: resultSchema,
    annotations: localAnnotations,
  }, ({ xml }, ctx) => invoke(() => core.repairDiagram(xml), ctx));

  server.registerTool('style_drawio', {
    description: 'Apply a theme, style pack, preset toggles, text tool or drawing trick to uncompressed draw.io XML. Discover valid IDs with list_drawio_options. Returns a new document without changing an editor.',
    inputSchema: z.object({
      xml: xmlSchema,
      theme: z.enum(Object.keys(themes)).optional(),
      sourceTheme: z.enum(Object.keys(themes)).optional(),
      stylePack: optionId.optional(),
      presets: z.record(optionId, z.boolean()).optional(),
      textTool: optionId.optional(),
      trick: optionId.optional(),
    }).strict(),
    outputSchema: resultSchema,
    annotations: localAnnotations,
  }, ({ xml, ...options }, ctx) => invoke(() => core.styleDiagram(xml, options), ctx));

  server.registerTool('generate_drawio', {
    description: 'Generate a complete, validated draw.io XML diagram from a text prompt using the server model configured via SMART_DRAWIO_* environment variables. Requires all four provider settings. An incomplete or invalid model response is an error. Does not open a browser or write files.',
    inputSchema: z.object({
      prompt: z.string().min(1).max(MAX_GENERATE_TEXT_CHARS).refine((value) => value.trim().length > 0, 'Provide a diagram prompt.'),
      chartType: z.enum(Object.keys(CHART_TYPES)).optional().default('auto'),
      theme: z.enum(Object.keys(themes)).optional().default('research'),
    }).strict(),
    outputSchema: resultSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  }, (input, ctx) => invoke((signal) => model.error || core.generateDiagram(input, { config: model.config, signal }), ctx));

  return server;
}
