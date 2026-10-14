// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Client } from '@modelcontextprotocol/client';
import { InMemoryTransport } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';

import { createSmartDrawioServer, readModelConfig } from '../../packages/mcp/src/server.js';
import * as core from '../../packages/core/src/index.js';

const XML = '<mxfile><diagram id="page" name="Page-1"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="node" value="Diagram" style="rounded=1;whiteSpace=wrap;html=1;shadow=1;" vertex="1" parent="1"><mxGeometry x="80" y="80" width="120" height="60" as="geometry"/></mxCell></root></mxGraphModel></diagram></mxfile>';
const ENV = { SMART_DRAWIO_PROVIDER: 'openai', SMART_DRAWIO_BASE_URL: 'http://localhost:11434/v1', SMART_DRAWIO_API_KEY: 'private-test-key', SMART_DRAWIO_MODEL: 'test-model' };
const cleanups = [];

async function connect(options = { env: {} }) {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const handle = serveStdio(() => createSmartDrawioServer(options), { transport: serverTransport });
  const client = new Client({ name: 'drawio-protocol-test', version: '1.0.0' });
  cleanups.push(async () => { await client.close(); await handle.close(); });
  await client.connect(clientTransport);
  return client;
}

afterEach(async () => {
  await Promise.all(cleanups.splice(0).map((cleanup) => cleanup()));
});

describe('Smart Drawio MCP registration and protocol', () => {
  it('exposes five documented tools, XML inputs and no credential arguments', async () => {
    const client = await connect();
    const { tools } = await client.listTools();
    expect(tools.map((tool) => tool.name).sort()).toEqual(['generate_drawio', 'list_drawio_options', 'repair_drawio', 'style_drawio', 'validate_drawio']);
    const generate = tools.find((tool) => tool.name === 'generate_drawio');
    expect(generate.inputSchema.required).toContain('prompt');
    expect(Object.keys(generate.inputSchema.properties).sort()).toEqual(['chartType', 'prompt', 'theme']);
    expect(generate.inputSchema.additionalProperties).toBe(false);
    const catalog = await client.callTool({ name: 'list_drawio_options', arguments: {} });
    expect(catalog.isError).toBe(false);
    expect(catalog.structuredContent.options.themes.some((theme) => theme.id === 'research')).toBe(true);
  });

  it('keeps validation usable without provider configuration and returns structured XML', async () => {
    const client = await connect();
    const result = await client.callTool({ name: 'validate_drawio', arguments: { xml: XML } });
    expect(result.isError).toBe(false);
    expect(result.structuredContent).toMatchObject({ ok: true, diagnostics: [] });
    expect(core.validateDiagram(result.structuredContent.xml).ok).toBe(true);
    expect(result.content.some((item) => item.type === 'text' && item.text.includes('<mxfile>'))).toBe(true);
    const generate = await client.callTool({ name: 'generate_drawio', arguments: { prompt: 'Draw a box' } });
    expect(generate.isError).toBe(true);
    expect(generate.structuredContent.diagnostics[0].code).toBe('MODEL_CONFIG_MISSING');
  });

  it.each(['{"elements":[]}', '<mxfile><diagram></mxfile>'])('reports invalid diagram input through isError (%s)', async (xml) => {
    const client = await connect();
    const result = await client.callTool({ name: 'validate_drawio', arguments: { xml } });
    expect(result.isError).toBe(true);
    expect(result.structuredContent.ok).toBe(false);
    expect(result.structuredContent.diagnostics.length).toBeGreaterThan(0);
  });

  it('repairs supported missing closing tags and returns valid XML', async () => {
    const client = await connect();
    const partial = XML.replace('</mxGraphModel></diagram></mxfile>', '');
    const result = await client.callTool({ name: 'repair_drawio', arguments: { xml: partial } });
    expect(result.isError).toBe(false);
    expect(result.structuredContent.xml).toContain('</mxfile>');
    expect(core.validateDiagram(result.structuredContent.xml).ok).toBe(true);
  });

  it('applies text and boolean preset options while preserving IDs and geometry', async () => {
    const client = await connect();
    const result = await client.callTool({ name: 'style_drawio', arguments: { xml: XML, textTool: 'boldText', presets: { shadow: false } } });
    expect(result.isError).toBe(false);
    expect(result.structuredContent.xml).toContain('fontStyle=1');
    expect(result.structuredContent.xml).not.toContain('shadow=1');
    expect(result.structuredContent.xml).toContain('id="node"');
    expect(result.structuredContent.xml).toContain('x="80"');
    expect(core.validateDiagram(result.structuredContent.xml).ok).toBe(true);
    const unknown = await client.callTool({ name: 'style_drawio', arguments: { xml: XML, textTool: 'unknown' } });
    expect(unknown.isError).toBe(true);
  });

  it('rejects credential arguments without invoking generation or echoing their values', async () => {
    const generateDiagram = vi.fn();
    const client = await connect({ env: ENV, core: { ...core, generateDiagram } });
    const result = await client.callTool({ name: 'generate_drawio', arguments: { prompt: 'diagram', apiKey: ENV.SMART_DRAWIO_API_KEY } });
    expect(result.isError).toBe(true);
    expect(JSON.stringify(result)).not.toContain(ENV.SMART_DRAWIO_API_KEY);
    expect(generateDiagram).not.toHaveBeenCalled();
  });

  it('uses fixed diagnostics for unexpected core errors', async () => {
    const client = await connect({ env: ENV, core: { ...core, generateDiagram: () => { throw new Error(ENV.SMART_DRAWIO_API_KEY); } } });
    const result = await client.callTool({ name: 'generate_drawio', arguments: { prompt: 'diagram' } });
    expect(result.isError).toBe(true);
    expect(result.structuredContent.diagnostics[0].code).toBe('TOOL_FAILED');
    expect(JSON.stringify(result)).not.toContain(ENV.SMART_DRAWIO_API_KEY);
  });

  it('validates structured output while retaining diagnostic page and cell fields', async () => {
    const diagnostic = { code: 'REVIEW_LAYOUT', message: 'Review the layout.', severity: 'info', pageIndex: 0, cellId: 'node' };
    const client = await connect({ env: {}, core: { ...core, validateDiagram: () => ({ ok: true, xml: XML, diagnostics: [diagnostic], stats: { cellCount: 3 } }) } });
    const result = await client.callTool({ name: 'validate_drawio', arguments: { xml: XML } });
    expect(result.isError).toBe(false);
    expect(result.structuredContent.diagnostics).toEqual([diagnostic]);
    expect(result.structuredContent.stats).toEqual({ cellCount: 3 });
  });

  it('propagates protocol cancellation to the core signal and keeps the connection usable', async () => {
    let signal;
    const generateDiagram = vi.fn((_input, options) => {
      signal = options.signal;
      return new Promise((resolve) => signal.addEventListener('abort', () => resolve({ ok: false, diagnostics: [{ code: 'CANCELLED', message: 'Cancelled', severity: 'error' }] }), { once: true }));
    });
    const client = await connect({ env: ENV, core: { ...core, generateDiagram } });
    const controller = new AbortController();
    const assertion = expect(client.callTool({ name: 'generate_drawio', arguments: { prompt: 'diagram' } }, { signal: controller.signal })).rejects.toThrow();
    await vi.waitFor(() => expect(generateDiagram).toHaveBeenCalledOnce());
    controller.abort();
    await assertion;
    await vi.waitFor(() => expect(signal.aborted).toBe(true));
    const validation = await client.callTool({ name: 'validate_drawio', arguments: { xml: XML } });
    expect(validation.isError).toBe(false);
  });

  it('reads supported local provider settings without returning credential diagnostics', () => {
    expect(readModelConfig(ENV).config).toMatchObject({ type: 'openai', baseUrl: ENV.SMART_DRAWIO_BASE_URL, model: 'test-model' });
    const invalid = readModelConfig({ ...ENV, SMART_DRAWIO_PROVIDER: ENV.SMART_DRAWIO_API_KEY });
    expect(invalid.error.diagnostics[0].code).toBe('MODEL_CONFIG_INVALID');
    expect(JSON.stringify(invalid)).not.toContain(ENV.SMART_DRAWIO_API_KEY);
  });
});
