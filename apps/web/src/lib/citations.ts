export type CitationSource = { id?: string | undefined };
export function citationNumbers(
  input: { n?: number | number[]; refs?: string[] },
  sources: readonly CitationSource[],
): number[] {
  if ((input.n === undefined) === (input.refs === undefined))
    throw new Error('Use exactly one of n or refs');
  const numbers = input.refs
    ? input.refs.map((id) => sources.findIndex((s) => s.id === id) + 1)
    : [input.n ?? []].flat();
  if (!numbers.length || numbers.some((n) => !Number.isInteger(n) || n < 1 || n > sources.length))
    throw new Error(`Unknown citation source: the article has ${sources.length} sources`);
  return numbers;
}
