import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';

const run = promisify(execFile);
const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packagePath = path.join(project, 'packages/mcp');
const manifest = JSON.parse(await readFile(path.join(packagePath, 'package.json'), 'utf8'));
const staging = await mkdtemp(path.join(os.tmpdir(), 'smart-drawio-package-'));
const XML = '<mxfile><diagram name="Page-1"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="2" value="独立安装测试" vertex="1" parent="1"><mxGeometry x="0" y="0" width="100" height="60" as="geometry"/></mxCell></root></mxGraphModel></diagram></mxfile>';
let client;
let transport;
try {
  await run(process.execPath, [path.join(project, 'scripts/build-mcp.mjs')], { cwd: project });
  const { stdout } = await run('npm', ['pack', '--json', '--pack-destination', staging], { cwd: packagePath });
  const [packed] = JSON.parse(stdout);
  const files = packed.files.map((entry) => entry.path);
  for (const required of ['dist/stdio.js', 'dist/server.js', 'dist/core.js', 'server.json', 'LICENSE', 'NOTICE', 'README.md']) {
    assert(files.includes(required), `Missing package file: ${required}`);
  }
  assert(!files.some((file) => /(^|\/)(src|tests|node_modules|\.env)(\/|$)/.test(file)), 'Package leaked development files');
  await writeFile(path.join(staging, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
  // Install only the tarball and its declared dependencies, outside the repository.
  await run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--package-lock=false', path.join(staging, packed.filename)], {
    cwd: staging, timeout: 120_000, maxBuffer: 2 * 1024 * 1024,
  });
  const installed = path.join(staging, 'node_modules', ...manifest.name.split('/'));
  const core = await import(pathToFileURL(path.join(installed, 'dist/core.js')).href);
  assert.equal(core.validateDiagram(XML).ok, true);
  assert.equal(core.styleDiagram(XML, { stylePack: 'researchClean' }).ok, true);
  transport = new StdioClientTransport({
    command: process.execPath,
    args: [path.join(installed, 'dist/stdio.js')],
    cwd: staging,
    env: { NODE_ENV: 'production' },
    stderr: 'pipe',
  });
  let stderr = '';
  transport.stderr?.on('data', (chunk) => { stderr += String(chunk).slice(0, 2000); });
  client = new Client({ name: 'smart-drawio-package-verification', version: '0.1.0' });
  await client.connect(transport);
  assert.equal(client.getServerVersion().version, manifest.version, 'Server version does not match package metadata');
  const tools = await client.listTools();
  assert.deepEqual(tools.tools.map((tool) => tool.name).sort(), [
    'generate_drawio', 'list_drawio_options', 'repair_drawio', 'style_drawio', 'validate_drawio',
  ]);
  const validated = await client.callTool({ name: 'validate_drawio', arguments: { xml: XML } });
  assert.equal(validated.isError, false);
  assert.equal(validated.structuredContent.ok, true);
  const invalid = await client.callTool({ name: 'validate_drawio', arguments: { xml: '<mxfile><broken/></mxfile>' } });
  assert.equal(invalid.isError, true);
  const styled = await client.callTool({ name: 'style_drawio', arguments: { xml: XML, stylePack: 'researchClean' } });
  assert.equal(styled.structuredContent.ok, true);
  const options = await client.callTool({ name: 'list_drawio_options', arguments: {} });
  assert.equal(options.structuredContent.ok, true);
  const missingConfig = await client.callTool({ name: 'generate_drawio', arguments: { prompt: 'A single node' } });
  assert.equal(missingConfig.isError, true);
  assert(!stderr.trim(), 'The installed server emitted unexpected stderr');
  const registry = JSON.parse(await readFile(path.join(installed, 'server.json'), 'utf8'));
  assert.equal(registry.name, manifest.mcpName);
  assert.equal(registry.version, manifest.version);
  assert.equal(registry.packages[0].identifier, manifest.name);
  assert.equal(registry.packages[0].version, manifest.version);
  const report = { package: manifest.name, version: manifest.version, files,
    checks: ['isolated tarball installation', 'Node core import', 'stdio initialization', 'five tool discovery',
      'valid/invalid XML', 'style application', 'option discovery', 'missing model configuration', 'registry metadata consistency'] };
  await mkdir(path.join(project, 'test-results'), { recursive: true });
  await writeFile(path.join(project, 'test-results/mcp-package-report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(`Verified ${manifest.name}@${manifest.version} outside the repository (${files.length} package files).`);
} finally {
  await client?.close();
  await transport?.close();
  await rm(staging, { recursive: true, force: true });
}
