import { describe, expect, it } from 'vitest';
import { extractDois } from './check-dois.mjs';

describe('extractDois', () => {
  it('finds DOIs in frontmatter fields and doi.org links', () => {
    const text = [
      'doi: 10.1093/eurheartj/ehae176',
      'url: https://doi.org/10.1161/CIR.0000000000001123.',
      'see (10.1016/j.jacc.2023.01.001), too',
    ].join('\n');
    expect(extractDois(text)).toEqual([
      '10.1093/eurheartj/ehae176',
      '10.1161/CIR.0000000000001123',
      '10.1016/j.jacc.2023.01.001',
    ]);
  });

  it('returns each DOI once', () => {
    expect(extractDois('10.1000/x and 10.1000/x')).toEqual(['10.1000/x']);
  });

  it('ignores text without DOIs', () => {
    expect(extractDois('version 10.2 of the guideline')).toEqual([]);
  });
});
