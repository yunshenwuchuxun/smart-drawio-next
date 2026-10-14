// @vitest-environment node
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { Client } from '@modelcontextprotocol/client';
import { getDefaultEnvironment, StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { execFile } from 'node:child_process';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { validateDiagram } from '../../packages/core/src/index.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const XML = '<mxfile><diagram id="page" name="Page-1"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="node" value="Diagram" style="whiteSpace=wrap;html=1;" vertex="1" parent="1"><mxGeometry x="80" y="80" width="120" height="60" as="geometry"/></mxCell></root></mxGraphModel></diagram></mxfile>';
const API_KEY = 'stdio-private-placeholder';
const cleanups = [];
let provider;
let baseUrl;
let mode = 'complete';
let requests = [];

async function connect(configured = false) {
  const env = getDefaultEnvironment();
  if (configured) Object.assign(env, {
    SMART_DRAWIO_PROVIDER: 'openai', SMART_DRAWIO_BASE_URL: baseUrl,
    SMART_DRAWIO_API_KEY: API_KEY, SMART_DRAWIO_MODEL: 'stdio-test-model',
  });
  const transport = new StdioClientTransport({
    command: process.execPath, args: [path.join(ROOT, 'packages/mcp/dist/stdio.js')],
    cwd: ROOT, env, stderr: 'pipe',
  });
  let stderr = '';
  transport.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
  const client = new Client({ name: 'drawio-stdio-test', version: '1.0.0' });
  const protocolErrors = [];
  client.onerror = (error) => protocolErrors.push(error);
  cleanups.push(async () => {
    await client.close();
    expect(stderr).not.toContain(API_KEY);
    expect(protocolErrors).toEqual([]);
  });
  await client.connect(transport);
  return client;
}

beforeAll(async () => {
  // Exercise the exact distributable entry point, not a mocked transport.
  await promisify(execFile)(process.execPath, [path.join(ROOT, 'scripts/build-mcp.mjs')], { cwd: ROOT, timeout: 20000 });
  provider = createServer((request, response) => {
    const entry = { closed: false, authorization: request.headers.authorization, body: '' };
    requests.push(entry);
    response.on('close', () => { entry.closed = true; });
    request.on('data', (chunk) => { entry.body += chunk.toString(); });
    request.on('end', () => {
      response.writeHead(200, { 'Content-Type': 'text/event-stream' });
      if (mode === 'stalled') {
        response.write(': connected\n\n');
        return;
      }
      if (mode === 'provider-error') {
        response.end(`data: ${JSON.stringify({ error: { message: `provider echoed ${API_KEY}` } })}\n\n`);
        return;
      }
      if (mode === 'abrupt') {
        response.end(`data: ${JSON.stringify({ choices: [{ delta: { content: '<mxfile>' } }] })}\n\n`);
        return;
      }
      const content = mode === 'json' ? '{"elements":[]}' : XML;
      const finish_reason = mode === 'truncated' ? 'length' : 'stop';
      response.end(`data: ${JSON.stringify({ choices: [{ delta: { content }, finish_reason }] })}\n\ndata: [DONE]\n\n`);
    });
  });
  await new Promise((resolve) => provider.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${provider.address().port}/v1`;
}, 25000);

afterEach(async () => {
  await Promise.all(cleanups.splice(0).map((cleanup) => cleanup()));
  mode = 'complete';
  requests = [];
});

afterAll(async () => {
  provider?.closeAllConnections();
  if (provider) await new Promise((resolve) => provider.close(resolve));
});

describe('published MCP stdio entry', () => {
  it('negotiates the protocol and keeps local tools available without credentials', async () => {
    const client = await connect();
    const { tools } = await client.listTools();
    expect(tools).toHaveLength(5);
    expect(tools.every((tool) => tool.outputSchema.properties.ok.type === 'boolean')).toBe(true);
    const validation = await client.callTool({ name: 'validate_drawio', arguments: { xml: XML } });
    expect(validation.isError).toBe(false);
    const generated = await client.callTool({ name: 'generate_drawio', arguments: { prompt: 'one node' } });
    expect(generated.isError).toBe(true);
    expect(generated.structuredContent.diagnostics[0].code).toBe('MODEL_CONFIG_MISSING');
    expect(requests).toHaveLength(0);
  });

  it('generates validated XML through a local compatible provider', async () => {
    const client = await connect(true);
    const result = await client.callTool({ name: 'generate_drawio', arguments: { prompt: 'one node', chartType: 'flowchart', theme: 'research' } });
    expect(result.isError).toBe(false);
    expect(validateDiagram(result.structuredContent.xml).ok).toBe(true);
    expect(result.structuredContent.xml).toContain('id="node"');
    expect(result.content.some((item) => item.type === 'text' && item.text.includes('<mxfile>'))).toBe(true);
    expect(requests).toHaveLength(1);
    expect(requests[0].authorization).toBe(`Bearer ${API_KEY}`);
    expect(JSON.parse(requests[0].body).model).toBe('stdio-test-model');
    expect(JSON.stringify(result)).not.toContain(API_KEY);
  });

  it.each([
    ['provider-error', 'PROVIDER_ERROR'],
    ['abrupt', 'PROVIDER_STREAM_INCOMPLETE'],
    ['json', 'INVALID_MODEL_XML'],
    ['truncated', 'OUTPUT_TRUNCATED'],
  ])('returns diagnostics and no draft XML for %s', async (providerMode, code) => {
    mode = providerMode;
    const client = await connect(true);
    const result = await client.callTool({ name: 'generate_drawio', arguments: { prompt: 'one node' } });
    expect(result.isError).toBe(true);
    expect(result.structuredContent).toMatchObject({ ok: false, diagnostics: [expect.objectContaining({ code })] });
    expect(result.structuredContent.xml).toBeUndefined();
    expect(JSON.stringify(result)).not.toContain(API_KEY);
  });

  it('cancels the live provider request and can still validate on the same connection', async () => {
    mode = 'stalled';
    const client = await connect(true);
    const controller = new AbortController();
    const assertion = expect(client.callTool({ name: 'generate_drawio', arguments: { prompt: 'one node' } }, { signal: controller.signal })).rejects.toThrow();
    await vi.waitFor(() => expect(requests).toHaveLength(1), { timeout: 3000 });
    controller.abort();
    await assertion;
    await vi.waitFor(() => expect(requests[0].closed).toBe(true), { timeout: 3000 });
    const result = await client.callTool({ name: 'validate_drawio', arguments: { xml: XML } });
    expect(result.isError).toBe(false);
  });
});
