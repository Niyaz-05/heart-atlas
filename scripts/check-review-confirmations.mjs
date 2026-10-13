import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { repositoryRoot } from './build-content-fingerprints.mjs';

export function confirmationEndpoint(url) {
  const match =
    /^https:\/\/github\.com\/w3lld1\/heart-atlas\/(?:pull|issues)\/\d+#issuecomment-(\d+)$/.exec(
      url ?? '',
    );
  if (!match) throw new Error('Confirmation must be a repository issue/PR conversation comment');
  return `repos/w3lld1/heart-atlas/issues/comments/${match[1]}`;
}
export function verifyConfirmation(review, comment) {
  confirmationEndpoint(review.confirmation?.url);
  const marker = `Medical approval: sha256:${review.digest}; reviewer:${review.reviewerId}`;
  if (
    comment.html_url !== review.confirmation.url ||
    comment.user?.login !== review.confirmation.by ||
    !comment.body?.split(/\r?\n/).includes(marker)
  )
    throw new Error('Actual confirmation author, URL or digest approval marker does not match');
}
export function checkConfirmations() {
  const dir = resolve(repositoryRoot(), 'editorial/reviews');
  const files = readdirSync(dir).filter((file) => file.endsWith('.json'));
  for (const file of files) {
    const review = JSON.parse(readFileSync(resolve(dir, file), 'utf8'));
    const comment = JSON.parse(
      execFileSync('gh', ['api', confirmationEndpoint(review.confirmation?.url)], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }),
    );
    verifyConfirmation(review, comment);
  }
  return files.length;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  console.log(
    `Actual medical confirmation comments checked: ${checkConfirmations()}. Zero means no physician approvals, not verified content.`,
  );
