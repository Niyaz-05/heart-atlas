import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { articlePackage, reviewState } from './build-content-fingerprints.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const legacy = JSON.parse(readFileSync(resolve(root, 'editorial/legacy-published.json'), 'utf8'));
const reviewers = parse(readFileSync(resolve(root, 'editorial/reviewers.yaml'), 'utf8'));
const maintainers = JSON.parse(readFileSync(resolve(root, 'editorial/maintainers.json'), 'utf8'));
export function checkMedicalReviews() {
  const queue = [];
  for (const file of readdirSync(resolve(root, 'content'), {
    recursive: true,
    encoding: 'utf8',
  }).filter((f) => f.endsWith('.mdx'))) {
    const articleId = file.slice(0, -4);
    const text = readFileSync(resolve(root, 'content', file), 'utf8');
    const metadata = parse(/^---\n([\s\S]*?)\n---/.exec(text)[1]);
    const record = resolve(root, 'editorial/reviews', articleId.replaceAll('/', '--') + '.json');
    const review = existsSync(record) ? JSON.parse(readFileSync(record, 'utf8')) : null;
    const state = review
      ? reviewState({
          articleId,
          contributors: metadata.contributors ?? [],
          digest: articlePackage(articleId).digest,
          review,
          reviewers,
          maintainers,
        })
      : 'unreviewed';
    if (review && state !== 'verified')
      queue.push({ articleId, state, nextReview: review.nextReview });
    if (
      metadata.publication === 'published' &&
      ((!legacy.includes(articleId) && state !== 'verified') || (review && state !== 'verified'))
    )
      throw new Error(
        `${articleId}: publication requires current independent medical confirmation (${state})`,
      );
  }
  return queue;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  console.log(JSON.stringify({ queue: checkMedicalReviews() }, null, 2));
