// @ts-check
// Checks every DOI in content/ against Crossref, falling back to the doi.org handle
// API for DOIs registered elsewhere (DataCite, mEDRA). doi.org pages often answer 403
// to CI bots, so lychee skips them and this script is the source of truth for DOIs.
// Usage: node scripts/check-dois.mjs [dir] [report.md]
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

// DOIs may contain parentheses, e.g. 10.1016/S0140-6736(20)30183-5.
const DOI_PATTERN = /\b10\.\d{4,9}\/[^\s"'<>[\]{}]+/g;

/** @param {string} doi */
function trimDoi(doi) {
  let result = doi.replace(/[.,;:]+$/, '');
  // Drop a closing parenthesis that belongs to the surrounding text, not the DOI.
  while (result.endsWith(')') && result.split('(').length < result.split(')').length) {
    result = result.slice(0, -1).replace(/[.,;:]+$/, '');
  }
  return result;
}

/** Returns the unique DOIs found in a text, without trailing punctuation. */
export function extractDois(text) {
  const found = text.match(DOI_PATTERN) ?? [];
  return [...new Set(found.map(trimDoi))];
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

/** @param {string} url @returns {Promise<number | undefined>} HTTP status, undefined on network error */
async function status(url) {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'heart-atlas-link-check (https://github.com/w3lld1/heart-atlas)' },
      signal: AbortSignal.timeout(20_000),
    });
    return response.status;
  } catch {
    return undefined;
  }
}

/**
 * Returns "missing" only when both Crossref and doi.org answer 404, so an outage or
 * a rate limit never reports a good DOI as broken.
 * @param {string} doi
 * @returns {Promise<'ok' | 'missing' | 'unknown'>}
 */
export async function checkDoi(doi) {
  const crossref = await status(`https://api.crossref.org/works/${encodeURIComponent(doi)}`);
  if (crossref === 200) return 'ok';
  const handle = await status(`https://doi.org/api/handles/${encodeURIComponent(doi)}`);
  if (handle === 200) return 'ok';
  return crossref === 404 && handle === 404 ? 'missing' : 'unknown';
}

/**
 * @param {string[]} missing
 * @param {string[]} unknown
 */
export function formatReport(missing, unknown) {
  const sections = [];
  if (missing.length) sections.push(`## DOI not found\n\n${missing.join('\n')}\n`);
  if (unknown.length) sections.push(`## DOI that could not be checked\n\n${unknown.join('\n')}\n`);
  return sections.join('\n');
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

  /** @type {string[]} */ const missing = [];
  /** @type {string[]} */ const unknown = [];
  for (const [doi, files] of dois) {
    const result = await checkDoi(doi);
    const line = `- \`${doi}\` in ${[...files].join(', ')}`;
    if (result === 'missing') missing.push(line);
    if (result === 'unknown') unknown.push(line);
  }

  console.log(
    `Checked ${dois.size} DOI(s): ${missing.length} not found, ${unknown.length} unknown.`,
  );
  await writeFile(reportPath, formatReport(missing, unknown));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) await main();
