import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkDoi, extractDois, formatReport } from './check-dois.mjs';

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

  it('keeps parentheses that are part of the DOI', () => {
    expect(extractDois('doi: 10.1016/S0140-6736(20)30183-5')).toEqual([
      '10.1016/S0140-6736(20)30183-5',
    ]);
    expect(extractDois('(see 10.1016/S0140-6736(20)30183-5).')).toEqual([
      '10.1016/S0140-6736(20)30183-5',
    ]);
  });

  it('returns each DOI once', () => {
    expect(extractDois('10.1000/x and 10.1000/x')).toEqual(['10.1000/x']);
  });

  it('ignores text without DOIs', () => {
    expect(extractDois('version 10.2 of the guideline')).toEqual([]);
  });
});

describe('checkDoi', () => {
  afterEach(() => vi.unstubAllGlobals());

  function stubStatuses(crossref: number | Error, handle: number | Error) {
    const fetchMock = vi.fn(async (url: string) => {
      const result = url.includes('crossref') ? crossref : handle;
      if (result instanceof Error) throw result;
      return new Response(null, { status: result });
    });
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  }

  it('accepts a DOI Crossref knows without asking doi.org', async () => {
    const fetchMock = stubStatuses(200, 404);
    expect(await checkDoi('10.1000/x')).toBe('ok');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('accepts a DOI registered outside Crossref', async () => {
    stubStatuses(404, 200);
    expect(await checkDoi('10.5281/zenodo.1')).toBe('ok');
  });

  it('reports a DOI as missing only when both registries answer 404', async () => {
    stubStatuses(404, 404);
    expect(await checkDoi('10.1000/none')).toBe('missing');
  });

  it('reports an outage or rate limit as unknown, not missing', async () => {
    stubStatuses(429, 404);
    expect(await checkDoi('10.1000/x')).toBe('unknown');
    stubStatuses(new Error('network'), new Error('network'));
    expect(await checkDoi('10.1000/x')).toBe('unknown');
  });
});

describe('formatReport', () => {
  it('is empty when every DOI resolves', () => {
    expect(formatReport([], [])).toBe('');
  });

  it('lists missing and unchecked DOIs in separate sections', () => {
    const report = formatReport(['- `10.1/a`'], ['- `10.1/b`']);
    expect(report).toContain('## DOI not found\n\n- `10.1/a`');
    expect(report).toContain('## DOI that could not be checked\n\n- `10.1/b`');
  });
});
