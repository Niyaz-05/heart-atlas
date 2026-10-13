import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, unlinkSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { repositoryRoot } from './build-content-fingerprints.mjs';
const root = repositoryRoot();
const scratch = mkdtempSync(resolve(tmpdir(), 'ha-mdx-safety-'));
const marker = resolve(scratch, 'executed');
const fixture = resolve(
  root,
  'apps/web/test/fixtures/site-content/en/anatomy/editorial-unsafe-probe.mdx',
);
if (existsSync(fixture)) throw new Error('Probe collision');
const source = readFileSync(
  resolve(root, 'apps/web/test/fixtures/site-content/en/anatomy/editorial-demo.mdx'),
  'utf8',
);
const header = source.slice(0, source.indexOf('---', 3) + 3);
try {
  writeFileSync(
    fixture,
    header +
      `\n\nimport { writeFileSync } from 'node:fs';\n\nexport const probe = writeFileSync(${JSON.stringify(marker)},'executed');\n\n# Forbidden fixture\n`,
  );
  let failure = '';
  try {
    execFileSync('pnpm', ['--filter', '@heart-atlas/web', 'exec', 'astro', 'build'], {
      cwd: root,
      env: { ...process.env, HA_TEST_CONTENT: '1' },
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    failure = String(error.stdout) + String(error.stderr);
  }
  if (!failure.includes('Forbidden mdxjsEsm'))
    throw new Error('Expected AST rejection before build: ' + failure);
  if (existsSync(marker)) throw new Error('Unsafe content executed');
  console.log('PASS: direct Astro build rejects ESM before rendering; execution marker absent.');
} finally {
  if (existsSync(fixture)) unlinkSync(fixture);
  rmSync(scratch, { recursive: true, force: true });
}
