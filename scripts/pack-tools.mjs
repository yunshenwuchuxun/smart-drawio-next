import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'artifacts');
await mkdir(output, { recursive: true });
await run(process.execPath, [path.join(root, 'scripts/build-mcp.mjs')], { cwd: root });
const { stdout } = await run('npm', ['pack', '--json', '--pack-destination', output], { cwd: path.join(root, 'packages/mcp') });
const [packed] = JSON.parse(stdout);
const skillArchive = 'smart-drawio-skill-0.1.0.zip';
const packSkill = `
from pathlib import Path
import sys, zipfile
skill, target, license = map(Path, sys.argv[1:])
with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED) as archive:
    for source in sorted(skill.rglob('*')):
        if source.is_file() and '__pycache__' not in source.parts and source.suffix != '.pyc':
            archive.write(source, 'smart-drawio/' + source.relative_to(skill).as_posix())
    if not (skill / 'LICENSE').is_file():
        archive.write(license, 'smart-drawio/LICENSE')
`;
await run('python3', ['-c', packSkill, path.join(root, 'skills/smart-drawio'), path.join(output, skillArchive), path.join(root, 'LICENSE')]);
const lines = [];
for (const filename of [packed.filename, skillArchive]) {
  const hash = createHash('sha256').update(await readFile(path.join(output, filename))).digest('hex');
  lines.push(`${hash}  ${filename}`);
}
await writeFile(path.join(output, 'SHA256SUMS'), lines.join('\n') + '\n');
console.log(`Prepared local release artifacts:\n${packed.filename}\n${skillArchive}\nSHA256SUMS`);
