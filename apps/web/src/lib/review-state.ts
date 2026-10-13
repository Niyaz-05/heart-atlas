import { existsSync, readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { resolve } from 'node:path';
import {
  articlePackage,
  reviewState,
  repositoryRoot,
} from '../../../../scripts/build-content-fingerprints.mjs';
const reviewers = parse(
  readFileSync(resolve(repositoryRoot(), 'editorial/reviewers.yaml'), 'utf8'),
);
const maintainers = JSON.parse(
  readFileSync(resolve(repositoryRoot(), 'editorial/maintainers.json'), 'utf8'),
);
export function medicalReview(articleId: string, contributors: string[]) {
  const path = resolve(
    repositoryRoot(),
    `editorial/reviews/${articleId.replaceAll('/', '--')}.json`,
  );
  if (!existsSync(path)) return { state: 'unreviewed' as const, review: null };
  const review = JSON.parse(readFileSync(path, 'utf8'));
  const { digest } = articlePackage(articleId);
  return {
    state: reviewState({ articleId, contributors, digest, review, reviewers, maintainers }),
    review,
  };
}
