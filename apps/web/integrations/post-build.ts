import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import * as pagefind from 'pagefind';

/**
 * Runs after `astro build`: builds the Pagefind search index into dist/pagefind/.
 * Only pages whose <main> carries data-pagefind-body are indexed (see BaseLayout `searchable`).
 * Later steps (manifests, service worker) go here too, so they run in a fixed order.
 */
export default function postBuild(): AstroIntegration {
  return {
    name: 'heart-atlas:post-build',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const site = fileURLToPath(dir);
        try {
          const { index, errors } = await pagefind.createIndex({});
          if (!index) throw new Error(`Pagefind: ${errors.join('; ')}`);
          const added = await index.addDirectory({ path: site });
          if (added.errors.length > 0) throw new Error(`Pagefind: ${added.errors.join('; ')}`);
          const written = await index.writeFiles({ outputPath: `${site}pagefind` });
          if (written.errors.length > 0) throw new Error(`Pagefind: ${written.errors.join('; ')}`);
          const entry = JSON.parse(
            await readFile(`${site}pagefind/pagefind-entry.json`, 'utf8'),
          ) as { languages: Record<string, { page_count: number }> };
          const counts = Object.entries(entry.languages).map(
            ([lang, { page_count }]) => `${lang}: ${page_count}`,
          );
          logger.info(`Pagefind indexed pages (${counts.join(', ')})`);
        } finally {
          await pagefind.close();
        }
      },
    },
  };
}
