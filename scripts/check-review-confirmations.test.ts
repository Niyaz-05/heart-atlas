import { expect, it } from 'vitest';
import { confirmationEndpoint, verifyConfirmation } from './check-review-confirmations.mjs';
it('requires actual repository confirmation authored by the attesting maintainer for the exact digest', () => {
  const review = {
    reviewerId: 'fixture-doctor',
    digest: 'a'.repeat(64),
    confirmation: {
      by: 'fixture-maintainer',
      url: 'https://github.com/w3lld1/heart-atlas/pull/1#issuecomment-2',
    },
  };
  const comment = {
    html_url: review.confirmation.url,
    user: { login: 'fixture-maintainer' },
    body: `Medical approval: sha256:${review.digest}; reviewer:${review.reviewerId}`,
  };
  expect(confirmationEndpoint(review.confirmation.url)).toBe(
    'repos/w3lld1/heart-atlas/issues/comments/2',
  );
  expect(() => verifyConfirmation(review, comment)).not.toThrow();
  expect(() => verifyConfirmation(review, { ...comment, user: { login: 'author' } })).toThrow();
  expect(() => verifyConfirmation(review, { ...comment, body: 'No approval' })).toThrow();
  expect(() =>
    verifyConfirmation(review, { ...comment, html_url: 'https://evil.example' }),
  ).toThrow();
  for (const url of [
    'https://evil.example/1#issuecomment-2',
    'https://github.com/w3lld1/heart-atlas/pull/1#not-a-comment',
    'https://github.com/other/repo/pull/1#issuecomment-2',
  ])
    expect(() => confirmationEndpoint(url)).toThrow();
});
