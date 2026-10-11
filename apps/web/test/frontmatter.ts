import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

/** Reads the YAML frontmatter of an MDX file the way Astro's glob loader sees it. */
export function readFrontmatter(path: string | URL): unknown {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(readFileSync(path, 'utf8'));
  if (!match) throw new Error(`${String(path)} has no frontmatter`);
  return parse(match[1] ?? '');
}
