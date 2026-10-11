/** `${base}${locale}/${path}`. `base` is import.meta.env.BASE_URL and always ends with "/". */
export function localePath(base: string, locale: string, path = ''): string {
  return `${base}${locale}/${path.replace(/^\/+/, '')}`;
}

/** The same page in another locale: swaps the locale segment that follows `base`. */
export function switchLocalePath(
  pathname: string,
  base: string,
  target: string,
  knownLocales: readonly string[],
): string {
  const rest = pathname.startsWith(base)
    ? pathname.slice(base.length)
    : pathname.replace(/^\//, '');
  const [first = '', ...tail] = rest.split('/');
  const path = knownLocales.includes(first) ? tail.join('/') : rest;
  return localePath(base, target, path);
}
