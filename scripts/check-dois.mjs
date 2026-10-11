// @ts-check
// Checks every DOI in content/ against the Crossref API. doi.org itself often answers
// 403 to CI bots, so lychee skips it and this script is the source of truth for DOIs.
// Usage: node scripts/check-dois.mjs [dir] [report.md]
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const DOI_PATTERN = /\b10\.\d{4,9}\/[^\s"'<>()[\]{}]+/g;

/** Returns the unique DOIs found in a text, without trailing punctuation. */
export function extractDois(text) {
  const found = text.match(DOI_PATTERN) ?? [];
  return [...new Set(found.map((doi) => doi.replace(/[.,;:]+$/, '')))];
}

/** @param {string} dir */
async function listFiles(dir) {
  try {
    const entries = await readdir(dir, { recursive: true, withFileTypes: true });
    return entries.filter((e) => e.isFile()).map((e) => join(e.parentPath, e.name));
  } catch (error) {
    if (/** @type {NodeJS.ErrnoException} */ (error).code === 'ENOENT') return [];
    throw error;
  }
}

/**
 * Asks Crossref about one DOI. Returns "missing" only for a definite 404, so a
 * Crossref outage or rate limit never reports a good DOI as broken.
 * @param {string} doi
 * @returns {Promise<'ok' | 'missing' | 'unknown'>}
 */
async function checkDoi(doi) {
  const url = `https://api.crossref.org/works/${encodeURIComponent(doi)}`;
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'heart-atlas-link-check (https://github.com/w3lld1/heart-atlas)' },
      signal: AbortSignal.timeout(20_000),
    });
    if (response.ok) return 'ok';
    return response.status === 404 ? 'missing' : 'unknown';
  } catch {
    return 'unknown';
  }
}

async function main() {
  const [dir = 'content', reportPath = 'doi-report.md'] = process.argv.slice(2);
  /** @type {Map<string, Set<string>>} DOI -> files that cite it */
  const dois = new Map();
  for (const file of await listFiles(dir)) {
    for (const doi of extractDois(await readFile(file, 'utf8'))) {
      dois.set(doi, (dois.get(doi) ?? new Set()).add(file));
    }
  }

  const missing = [];
  for (const [doi, files] of dois) {
    const result = await checkDoi(doi);
    if (result === 'missing') missing.push(`- \`${doi}\` in ${[...files].join(', ')}`);
    if (result === 'unknown') console.warn(`Could not verify ${doi}`);
  }

  console.log(`Checked ${dois.size} DOI(s), ${missing.length} not found in Crossref.`);
  const report = missing.length ? `## DOI not found in Crossref\n\n${missing.join('\n')}\n` : '';
  await writeFile(reportPath, report);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) await main();
