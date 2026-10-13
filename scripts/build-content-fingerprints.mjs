import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
export function repositoryRoot() {
  let directory = process.cwd();
  while (true) {
    const manifest = resolve(directory, 'package.json');
    if (existsSync(manifest) && JSON.parse(readFileSync(manifest, 'utf8')).name === 'heart-atlas')
      return directory;
    const parent = resolve(directory, '..');
    if (parent === directory) throw new Error('Heart Atlas repository root not found');
    directory = parent;
  }
}
const root = repositoryRoot();

/** Conservative automated closure: additions/deletions and path list affect every review. */
export const dependencyRoots = [
  'apps/web/src/components/',
  'apps/web/src/lib/',
  'apps/web/src/i18n/',
  'packages/heart-clock/src/',
  'packages/viewer/src/',
  'assets/models/',
];
export const dependencyFiles = [
  'scripts/build-content-fingerprints.mjs',
  'scripts/check-content-safety.mjs',
  'apps/web/src/content.config.ts',
  'content/trusted-sources.yaml',
];
function relevant(path) {
  return (
    dependencyRoots.some((prefix) => path.startsWith(prefix)) ||
    dependencyFiles.includes(path) ||
    /^content\/[^/]+\/[^/]+\/[^/]+\.(mdx|quiz.yaml|interactive.yaml)$/.test(path)
  );
}
export function packageDigest(files) {
  const hash = createHash('sha256');
  hash.update(JSON.stringify({ dependencyRoots, dependencyFiles }));
  for (const path of Object.keys(files).filter(relevant).sort()) {
    hash.update(JSON.stringify([path, Buffer.from(files[path]).toString('base64')]));
  }
  return hash.digest('hex');
}
export function articlePackage(articleId, directory = root) {
  if (!/^[a-z-]+\/[a-z]+\/[a-z0-9-]+$/.test(articleId)) throw new Error('Invalid article id');
  const files = {};
  for (const prefix of dependencyRoots)
    for (const name of readdirSync(resolve(directory, prefix), {
      recursive: true,
      encoding: 'utf8',
    })) {
      const path = prefix + name;
      try {
        files[path] = readFileSync(resolve(directory, path));
      } catch (error) {
        if (error.code !== 'EISDIR') throw error;
      }
    }
  for (const path of [
    ...dependencyFiles,
    ...['mdx', 'quiz.yaml', 'interactive.yaml'].map((ext) => `content/${articleId}.${ext}`),
  ]) {
    if (existsSync(resolve(directory, path))) files[path] = readFileSync(resolve(directory, path));
  }
  const articlePath = `content/${articleId}.mdx`;
  if (!files[articlePath]) throw new Error('Missing article');
  const text = files[articlePath].toString();
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!match) throw new Error('Missing metadata');
  const metadata = parse(match[1]);
  delete metadata.review;
  files[articlePath] = JSON.stringify(metadata) + text.slice(match[0].length);
  return { digest: packageDigest(files), dependencies: Object.keys(files).sort(), metadata };
}
export function reviewState({
  articleId,
  contributors,
  digest,
  review,
  reviewers,
  maintainers,
  now = new Date().toISOString().slice(0, 10),
}) {
  if (!review) return 'unreviewed';
  const reviewer = reviewers.find(
    (r) => r.id === review.reviewerId && r.consent === true && r.credentialVerified === true,
  );
  const date = (s) =>
    typeof s === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(s) &&
    !Number.isNaN(Date.parse(s)) &&
    new Date(s).toISOString().slice(0, 10) === s;
  if (
    !reviewer ||
    contributors.includes(review.reviewerId) ||
    review.articleId !== articleId ||
    review.locale !== articleId.split('/')[0] ||
    review.digest !== digest ||
    !/^[a-f0-9]{64}$/.test(digest) ||
    !/^[a-f0-9]{40}$/.test(review.commit ?? '') ||
    !date(review.reviewedAt) ||
    !date(review.nextReview) ||
    review.reviewedAt > now ||
    review.nextReview <= now ||
    review.nextReview <= review.reviewedAt ||
    !['text', 'sources', 'quiz', 'interactive', 'fallback'].every((s) =>
      review.scope?.includes(s),
    ) ||
    !maintainers.includes(review.confirmation?.by) ||
    review.confirmation?.digest !== digest ||
    !/^https:\/\/github\.com\/w3lld1\/heart-atlas\/(pull|issues)\/\d+#/.test(
      review.confirmation?.url ?? '',
    )
  )
    return 'needs_review';
  return 'verified';
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const id = process.argv[2];
  if (!id) throw new Error('Usage: node scripts/build-content-fingerprints.mjs <locale/type/slug>');
  console.log(JSON.stringify({ articleId: id, ...articlePackage(id) }, null, 2));
}
