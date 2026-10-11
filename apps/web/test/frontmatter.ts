import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

/**
 * Reads the YAML frontmatter of an MDX file. The `yaml` package keeps unquoted dates as strings
 * where Astro gives a Date; the article schema accepts both.
 */
export function readFrontmatter(path: string | URL): unknown {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(readFileSync(path, 'utf8'));
  if (!match) throw new Error(`${String(path)} has no frontmatter`);
  return parse(match[1] ?? '');
}
