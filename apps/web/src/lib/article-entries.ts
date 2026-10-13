import { getCollection } from 'astro:content';
import { selectArticles, type Visibility } from './publication.ts';
/** Build-only switch: never derived from URL/query parameters. */
export async function getArticleEntries(
  visibility: Visibility = process.env['HA_CONTENT_MODE'] === 'preview' ? 'preview' : 'public',
) {
  return selectArticles(await getCollection('articles'), visibility);
}
export async function getWithdrawnEntries() {
  return (await getCollection('articles')).filter(
    (entry) => entry.data.publication === 'withdrawn',
  );
}
