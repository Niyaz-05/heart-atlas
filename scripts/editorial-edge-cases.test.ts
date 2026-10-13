import { describe, expect, it } from 'vitest';
import {
  articlePackage,
  packageDigest,
  repositoryRoot,
  reviewState,
} from './build-content-fingerprints.mjs';
import { checkContent, checkMdx, literal, safeUrl } from './check-content-safety.mjs';
import { resolve } from 'node:path';

describe('editorial dependency closure and input edge cases', () => {
  it('loads the real conservative closure and excludes approval records', () => {
    const value = articlePackage('ru/anatomy/heart-valves');
    expect(value.digest).toMatch(/^[a-f0-9]{64}$/);
    expect(value.dependencies).toContain('content/ru/anatomy/heart-valves.quiz.yaml');
    expect(value.dependencies).toContain('apps/web/src/components/diagrams/HeartValves.astro');
    expect(value.dependencies.some((p) => p.startsWith('editorial/reviews'))).toBe(false);
    expect(value.metadata.review).toBeUndefined();
    expect(() => articlePackage('../bad')).toThrow();
    expect(() => articlePackage('ru/anatomy/not-present')).toThrow();
    expect(packageDigest({ 'README.md': 'irrelevant' })).toBe(packageDigest({}));
  });
  it('validates every actual and fictional MDX before any compilation', () => {
    expect(checkContent(resolve(repositoryRoot(), 'content'))).toBeGreaterThan(0);
    expect(
      checkContent(resolve(repositoryRoot(), 'apps/web/test/fixtures/site-content')),
    ).toBeGreaterThan(0);
  }, 20000);
  it('interprets only literal object properties and URL allowlists', () => {
    expect(literal({ type: 'Literal', value: true })).toBe(true);
    expect(
      literal({
        type: 'ObjectExpression',
        properties: [
          {
            type: 'Property',
            computed: false,
            method: false,
            kind: 'init',
            key: { type: 'Identifier', name: 'ok' },
            value: { type: 'Literal', value: 1 },
          },
        ],
      }),
    ).toEqual({ ok: 1 });
    expect(() =>
      literal({ type: 'ObjectExpression', properties: [{ type: 'SpreadElement' }] }),
    ).toThrow();
    expect(() =>
      literal({
        type: 'ObjectExpression',
        properties: [
          {
            type: 'Property',
            kind: 'init',
            key: { type: 'Identifier', name: '__proto__' },
            value: { type: 'Literal', value: 1 },
          },
        ],
      }),
    ).toThrow();
    for (const url of ['https://example.org/path', '../path', '#anchor'])
      expect(() => safeUrl(url)).not.toThrow();
    for (const url of ['http://example.org', '//evil', 'a\\b', 'a\nb'])
      expect(() => safeUrl(url)).toThrow();
    for (const text of [
      '<HeartModel highlight={["bad"]} />',
      '<Diagram name="heart-valves"><p slot={2}>bad</p></Diagram>',
      '<Patient x="a" />',
    ])
      expect(() => checkMdx(text)).toThrow();
  });
  it('fails closed for malformed or unconfirmed review metadata', () => {
    const review = {
      articleId: 'en/anatomy/demo',
      locale: 'en',
      reviewerId: 'doctor',
      digest: 'a'.repeat(64),
      reviewedAt: '2026-01-01',
      nextReview: '2027-01-01',
      scope: ['text', 'sources', 'quiz', 'interactive', 'fallback'],
      commit: 'b'.repeat(40),
      confirmation: {
        by: 'maintainer',
        digest: 'a'.repeat(64),
        url: 'https://github.com/w3lld1/heart-atlas/pull/1#issuecomment-1',
      },
    };
    const input = {
      articleId: review.articleId,
      contributors: [],
      digest: review.digest,
      review,
      reviewers: [{ id: 'doctor', consent: true, credentialVerified: true }],
      maintainers: ['maintainer'],
      now: '2026-06-01',
    };
    for (const delta of [
      { locale: 'ru' },
      { commit: 'bad' },
      { reviewedAt: '2026-02-30' },
      { reviewedAt: '2027-01-01' },
      { nextReview: 'bad' },
      { nextReview: '2025-01-01' },
      { scope: [] },
      { confirmation: null },
      { confirmation: { ...review.confirmation, by: 'author' } },
      { confirmation: { ...review.confirmation, url: 'https://evil.example' } },
    ])
      expect(reviewState({ ...input, review: { ...review, ...delta } })).toBe('needs_review');
  });
});
