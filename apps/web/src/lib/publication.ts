export type Visibility = 'public' | 'preview';
export function selectArticles<T extends { data: { publication: string } }>(
  entries: readonly T[],
  visibility: Visibility = 'public',
): T[] {
  return entries.filter(
    ({ data }) =>
      data.publication === 'published' ||
      (visibility === 'preview' && data.publication === 'draft'),
  );
}
