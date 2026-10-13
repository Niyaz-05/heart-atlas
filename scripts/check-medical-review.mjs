import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { articlePackage, reviewState } from './build-content-fingerprints.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const legacy = JSON.parse(readFileSync(resolve(root, 'editorial/legacy-published.json'), 'utf8'));
const reviewers = parse(readFileSync(resolve(root, 'editorial/reviewers.yaml'), 'utf8'));
const maintainers = JSON.parse(readFileSync(resolve(root, 'editorial/maintainers.json'), 'utf8'));
export function publicationAllowed({ legacy, previouslyPublished, state, expiredOnly, hasReview }) {
  return state === 'verified' || (legacy && !hasReview) || (previouslyPublished && expiredOnly);
}
function wasPublished(articleId) {
  const base = process.env.HA_REVIEW_BASE || 'origin/main';
  if (base !== 'origin/main' && !/^[a-f0-9]{40}$/.test(base))
    throw new Error('Review base must be an exact SHA');
  try {
    const previous = execFileSync('git', ['show', `${base}:content/${articleId}.mdx`], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return parse(/^---\n([\s\S]*?)\n---/.exec(previous)[1]).publication === 'published';
  } catch {
    return false;
  }
}
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
    const input = review
      ? {
          articleId,
          contributors: metadata.contributors ?? [],
          digest: articlePackage(articleId).digest,
          review,
          reviewers,
          maintainers,
        }
      : null;
    const state = input ? reviewState(input) : 'unreviewed';
    const expiredOnly =
      input &&
      state === 'needs_review' &&
      reviewState({ ...input, now: review.reviewedAt }) === 'verified';
    if (review && state !== 'verified')
      queue.push({ articleId, state, nextReview: review.nextReview });
    if (
      metadata.publication === 'published' &&
      !publicationAllowed({
        legacy: legacy.includes(articleId),
        previouslyPublished: legacy.includes(articleId) || (expiredOnly && wasPublished(articleId)),
        state,
        expiredOnly,
        hasReview: !!review,
      })
    )
      throw new Error(
        `${articleId}: publication requires current independent medical confirmation (${state})`,
      );
  }
  return queue;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  console.log(JSON.stringify({ queue: checkMedicalReviews() }, null, 2));
