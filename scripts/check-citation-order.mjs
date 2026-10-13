import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { repositoryRoot } from './build-content-fingerprints.mjs';
export function assertSourceOrder(previous, current, numeric) {
  const identity = (source) =>
    JSON.stringify(
      Object.fromEntries(
        Object.entries(source)
          .filter(([key]) => key !== 'id')
          .sort(([a], [b]) => a.localeCompare(b)),
      ),
    );
  if (
    numeric &&
    previous.some(
      (source, index) => !current[index] || identity(source) !== identity(current[index]),
    )
  )
    throw new Error(
      'Legacy numeric citations forbid deleting/reordering/replacing sources; migrate all MDX/quiz references atomically first',
    );
}
export function checkCitationOrder(base) {
  if (!/^[a-f0-9]{40}$/.test(base ?? '')) throw new Error('Provide the exact base commit SHA');
  const root = repositoryRoot();
  const files = execFileSync(
    'git',
    ['diff', '--name-only', base, '--', 'content', 'editorial/reviews'],
    {
      cwd: root,
      encoding: 'utf8',
    },
  )
    .trim()
    .split('\n')
    .flatMap((file) =>
      file.startsWith('editorial/reviews/') && file.endsWith('.json')
        ? ['content/' + file.slice('editorial/reviews/'.length, -5).replaceAll('--', '/') + '.mdx']
        : file.endsWith('.mdx')
          ? [file]
          : [],
    );
  for (const file of files) {
    if (!existsSync(resolve(root, file))) continue;
    let previous;
    try {
      previous = execFileSync('git', ['show', `${base}:${file}`], {
        cwd: root,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
    } catch {
      continue;
    }
    const current = readFileSync(resolve(root, file), 'utf8');
    const metadata = (s) => parse(/^---\n([\s\S]*?)\n---/.exec(s)[1]);
    const quiz = file.replace('.mdx', '.quiz.yaml');
    const hasQuiz = existsSync(resolve(root, quiz));
    assertSourceOrder(
      metadata(previous).sources,
      metadata(current).sources,
      /<Cite\s+n=/.test(current) || hasQuiz,
    );
    // A previously-reviewed publication cannot erase its record to regain legacy exemption.
    const id = file.slice('content/'.length, -4);
    const record = `editorial/reviews/${id.replaceAll('/', '--')}.json`;
    let reviewed = false;
    try {
      execFileSync('git', ['cat-file', '-e', `${base}:${record}`], { cwd: root, stdio: 'ignore' });
      reviewed = true;
    } catch {
      /* No baseline review. */
    }
    if (
      reviewed &&
      metadata(current).publication === 'published' &&
      !existsSync(resolve(root, record))
    )
      throw new Error(`Cannot delete review for published ${id}`);
  }
  return files.length;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  console.log(
    `Citation order checked: ${checkCitationOrder(process.argv[2])} changed article files`,
  );
