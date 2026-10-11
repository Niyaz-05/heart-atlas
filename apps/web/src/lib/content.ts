import { z } from 'astro/zod';
import { parse } from 'yaml';

// Source policy from docs/plans/2026-10-11-stage-0-foundation.md ("Политика источников").

export const articleTypes = ['anatomy', 'disease', 'diagnostic', 'treatment'] as const;
export type ArticleType = (typeof articleTypes)[number];

/** Article types that make clinical claims and need a clinical guideline among their sources. */
const clinicalTypes: ReadonlySet<ArticleType> = new Set(['disease', 'diagnostic', 'treatment']);

export const sourceTiers = ['guideline', 'review', 'textbook', 'reference'] as const;

/** Tiers whose sources must name an organization from content/trusted-sources.yaml. */
const orgTiers = ['guideline', 'reference'] as const;

export const trustedSourcesSchema = z.record(
  z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Organization id must be kebab-case'),
  z.strictObject({ name: z.string().min(1), tier: z.enum(orgTiers) }),
);
export type TrustedSources = z.infer<typeof trustedSourcesSchema>;

export function parseTrustedSources(yamlText: string): TrustedSources {
  return trustedSourcesSchema.parse(parse(yamlText));
}

/** Validates the ISBN-10 or ISBN-13 check digit, ignoring hyphens and spaces. */
export function isValidIsbn(value: string): boolean {
  const isbn = value.replace(/[\s-]/g, '').toUpperCase();
  if (/^\d{9}[\dX]$/.test(isbn)) {
    const sum = [...isbn].reduce(
      (acc, char, i) => acc + (char === 'X' ? 10 : Number(char)) * (10 - i),
      0,
    );
    return sum % 11 === 0;
  }
  if (/^\d{13}$/.test(isbn)) {
    const sum = [...isbn].reduce((acc, char, i) => acc + Number(char) * (i % 2 === 0 ? 1 : 3), 0);
    return sum % 10 === 0;
  }
  return false;
}

const doiSchema = z.string().regex(/^10\.\d{4,9}\/\S+$/, 'DOI must look like 10.1234/abc');
const isbnSchema = z.string().refine(isValidIsbn, 'ISBN check digit is invalid');

export function createSourceSchema(trusted: TrustedSources) {
  return z
    .strictObject({
      tier: z.enum(sourceTiers),
      org: z.string().optional(),
      title: z.string().min(1),
      year: z.number().int().min(1900),
      doi: doiSchema.optional(),
      isbn: isbnSchema.optional(),
      url: z.url({ protocol: /^https$/, error: 'URL must use https' }).optional(),
    })
    .superRefine((source, ctx) => {
      if (source.doi === undefined && source.isbn === undefined && source.url === undefined) {
        ctx.addIssue({ code: 'custom', message: 'Source needs a doi, isbn or url' });
      }
      if (source.tier === 'guideline' || source.tier === 'reference') {
        const org = source.org === undefined ? undefined : trusted[source.org];
        if (org === undefined) {
          ctx.addIssue({
            code: 'custom',
            path: ['org'],
            message: `A ${source.tier} source needs an org from content/trusted-sources.yaml`,
          });
        } else if (org.tier !== source.tier) {
          ctx.addIssue({
            code: 'custom',
            path: ['tier'],
            message: `Organization "${source.org}" is listed as ${org.tier}, not ${source.tier}`,
          });
        }
      }
      if (source.tier === 'review' && source.doi === undefined) {
        ctx.addIssue({ code: 'custom', path: ['doi'], message: 'A review source needs a doi' });
      }
      if (source.tier === 'textbook' && source.isbn === undefined) {
        ctx.addIssue({
          code: 'custom',
          path: ['isbn'],
          message: 'A textbook source needs an isbn',
        });
      }
    });
}

export const reviewSchema = z.strictObject({
  reviewer: z.string().min(1),
  date: z.coerce.date(),
});
export type Review = z.infer<typeof reviewSchema>;

export function createArticleSchema(trusted: TrustedSources) {
  return z
    .strictObject({
      title: z.string().min(1),
      description: z.string().min(1),
      type: z.enum(articleTypes),
      sources: z.array(createSourceSchema(trusted)).min(1, 'An article needs at least one source'),
      // YAML turns an unquoted date into a Date and a quoted one into a string; accept both.
      sources_checked: z.coerce.date(),
      // Optional until the project has physician reviewers. While null, pages show ReviewNotice.
      review: reviewSchema.nullable().default(null),
    })
    .superRefine((article, ctx) => {
      if (!clinicalTypes.has(article.type)) return;
      if (article.sources.length < 2) {
        ctx.addIssue({
          code: 'custom',
          path: ['sources'],
          message: `A ${article.type} article needs at least two sources`,
        });
      }
      if (!article.sources.some((source) => source.tier === 'guideline')) {
        ctx.addIssue({
          code: 'custom',
          path: ['sources'],
          message: `A ${article.type} article needs at least one guideline source`,
        });
      }
    });
}
export type Article = z.infer<ReturnType<typeof createArticleSchema>>;

/** Sources older than this many years get a warning so someone re-checks them. */
export const SOURCES_STALE_AFTER_YEARS = 2;

export function isSourcesCheckStale(checked: Date, now: Date = new Date()): boolean {
  const limit = new Date(now);
  limit.setUTCFullYear(limit.getUTCFullYear() - SOURCES_STALE_AFTER_YEARS);
  return checked < limit;
}
