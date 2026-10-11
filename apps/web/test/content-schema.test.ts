import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  createArticleSchema,
  isSourcesCheckStale,
  isValidIsbn,
  parseTrustedSources,
} from '../src/lib/content';
import { readFrontmatter } from './frontmatter';

const trusted = parseTrustedSources(
  readFileSync(new URL('../../../content/trusted-sources.yaml', import.meta.url), 'utf8'),
);
const articleSchema = createArticleSchema(trusted);
const fixture = (name: string) =>
  readFrontmatter(new URL(`fixtures/content/${name}.mdx`, import.meta.url));

describe('trusted-sources.yaml', () => {
  it('lists the organizations from the spec', () => {
    expect(trusted.esc).toEqual({ name: 'European Society of Cardiology', tier: 'guideline' });
    expect(trusted.statpearls?.tier).toBe('reference');
  });

  it('rejects an organization with an unknown tier', () => {
    expect(() => parseTrustedSources('acme: { name: Acme, tier: blog }')).toThrow();
  });
});

describe('article schema', () => {
  it.each(['valid-disease', 'valid-anatomy'])('accepts %s', (name) => {
    expect(articleSchema.safeParse(fixture(name)).error).toBeUndefined();
  });

  it('defaults review to null and coerces sources_checked to a Date', () => {
    const article = articleSchema.parse(fixture('valid-anatomy'));
    expect(article.review).toBeNull();
    expect(article.sources_checked).toEqual(new Date('2026-10-11'));
  });

  it.each([
    ['invalid-single-source', 'needs at least two sources'],
    ['invalid-no-guideline', 'needs at least one guideline source'],
    ['invalid-unknown-org', 'needs an org from content/trusted-sources.yaml'],
    ['invalid-tier-mismatch', 'is listed as reference, not guideline'],
    ['invalid-review-without-doi', 'A review source needs a doi'],
    ['invalid-textbook-bad-isbn', 'ISBN check digit is invalid'],
    ['invalid-no-sources', 'An article needs at least one source'],
  ])('rejects %s', (name, message) => {
    const result = articleSchema.safeParse(fixture(name));
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toContainEqual(
      expect.stringContaining(message),
    );
  });

  const valid = () => structuredClone(fixture('valid-anatomy')) as Record<string, unknown>;

  it('rejects unknown frontmatter keys', () => {
    expect(articleSchema.safeParse({ ...valid(), source: [] }).success).toBe(false);
  });

  it('rejects a source with neither doi, isbn nor url', () => {
    const article = valid();
    article.sources = [{ tier: 'reference', org: 'statpearls', title: 'Fixture', year: 2025 }];
    expect(articleSchema.safeParse(article).success).toBe(false);
  });

  it('rejects a non-https url and a malformed doi', () => {
    const base = { tier: 'review', title: 'Fixture', year: 2023 };
    for (const source of [
      { ...base, doi: '10.1234/x', url: 'http://example.org' },
      { ...base, doi: 'doi:10.1234/x' },
    ]) {
      expect(articleSchema.safeParse({ ...valid(), sources: [source] }).success).toBe(false);
    }
  });

  it('accepts a review object once a physician has checked the article', () => {
    const result = articleSchema.parse({
      ...valid(),
      review: { reviewer: 'Fixture Reviewer', date: '2026-10-11' },
    });
    expect(result.review?.date).toEqual(new Date('2026-10-11'));
  });
});

describe('isValidIsbn', () => {
  it.each(['978-0-306-40615-7', '0-306-40615-2', '0 8044 2957 X'])('accepts %s', (isbn) => {
    expect(isValidIsbn(isbn)).toBe(true);
  });

  it.each(['978-0-306-40615-8', '0-306-40615-3', '12345'])('rejects %s', (isbn) => {
    expect(isValidIsbn(isbn)).toBe(false);
  });
});

describe('isSourcesCheckStale', () => {
  const now = new Date('2026-10-11');

  it('is false within two years', () => {
    expect(isSourcesCheckStale(new Date('2024-10-11'), now)).toBe(false);
  });

  it('is true after two years', () => {
    expect(isSourcesCheckStale(new Date('2024-10-10'), now)).toBe(true);
  });
});
