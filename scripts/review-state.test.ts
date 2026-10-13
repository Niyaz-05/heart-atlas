import { describe, expect, it } from 'vitest';
import { packageDigest, reviewState } from './build-content-fingerprints.mjs';
describe('review package identity', () => {
  it('hashes dependency paths and bytes, not review records or unrelated README', () => {
    const base = {'content/en/anatomy/demo.mdx':'body','content/en/anatomy/demo.quiz.yaml':'quiz','apps/web/src/components/diagrams/HeartValves.astro':'svg'};
    const digest=packageDigest(base);
    for (const key of Object.keys(base)) expect(packageDigest({...base,[key]:'changed'})).not.toBe(digest);
    expect(packageDigest({...base,'README.md':'changed','editorial/reviews/demo.json':'approval'})).toBe(digest);
    expect(packageDigest({...base,'apps/web/src/components/diagrams/new.astro':'new'})).not.toBe(digest);
  });
  it('requires independent registered reviewer, bound approval, locale and dates', () => {
    const review={articleId:'en/anatomy/demo',locale:'en',reviewerId:'doctor',digest:'a'.repeat(64),reviewedAt:'2026-01-01',nextReview:'2027-01-01',scope:['text','sources','quiz','interactive','fallback'],commit:'b'.repeat(40),confirmation:{by:'maintainer',digest:'a'.repeat(64),url:'https://github.com/w3lld1/heart-atlas/pull/1#issuecomment-1'}};
    const input={articleId:review.articleId,contributors:['author'],digest:review.digest,review,reviewers:[{id:'doctor',consent:true,credentialVerified:true}],maintainers:['maintainer'],now:'2026-06-01'};
    expect(reviewState(input)).toBe('verified');
    for (const changed of [{digest:'c'.repeat(64)},{contributors:['doctor']},{reviewers:[]},{articleId:'ru/anatomy/demo'},{now:'2028-01-01'},{review:{...review,confirmation:{...review.confirmation,digest:'x'}}}]) expect(reviewState({...input,...changed})).not.toBe('verified');
    expect(reviewState({...input,review:null})).toBe('unreviewed');
  });
});
