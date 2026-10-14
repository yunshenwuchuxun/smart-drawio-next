import { build } from 'esbuild';
import { mkdir, chmod, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packagePath = path.join(project, 'packages/mcp');
await mkdir(path.join(packagePath, 'dist'), { recursive: true });
await build({
  absWorkingDir: project,
  entryPoints: {
    stdio: 'packages/mcp/src/stdio.js',
    server: 'packages/mcp/src/server.js',
    core: 'packages/core/src/index.js',
  },
  outdir: path.join(packagePath, 'dist'),
  bundle: true,
  packages: 'external',
  platform: 'node',
  target: 'node20.9',
  format: 'esm',
  sourcemap: false,
});
await chmod(path.join(packagePath, 'dist/stdio.js'), 0o755);
await copyFile(path.join(project, 'LICENSE'), path.join(packagePath, 'LICENSE'));
console.log('Built the standalone MCP package in packages/mcp/dist');
