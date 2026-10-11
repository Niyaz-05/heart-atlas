export type LocaleConfig = {
  /** Native name shown in the language switcher. */
  name: string;
  dir: 'ltr' | 'rtl';
  /** Locale whose strings and content are shown when a translation is missing. */
  fallback: string | null;
};

export type LocaleRegistry = Record<string, LocaleConfig>;

/** Locales in fallback order, starting with `code` itself. Throws on unknown codes and cycles. */
export function fallbackChain(registry: LocaleRegistry, code: string): string[] {
  const chain: string[] = [];
  let current: string | null = code;
  while (current !== null) {
    if (chain.includes(current)) {
      throw new Error(`Locale fallback cycle: ${[...chain, current].join(' -> ')}`);
    }
    const config: LocaleConfig | undefined = registry[current];
    if (!config) throw new Error(`Unknown locale "${current}" in the fallback chain of "${code}"`);
    chain.push(current);
    current = config.fallback;
  }
  return chain;
}

/** Returns a list of problems with the registry; empty when it is valid. */
export function validateRegistry(registry: LocaleRegistry, defaultLocale: string): string[] {
  const errors: string[] = [];
  if (!(defaultLocale in registry))
    errors.push(`defaultLocale "${defaultLocale}" is not in the registry`);
  for (const code of Object.keys(registry)) {
    try {
      fallbackChain(registry, code);
    } catch (error) {
      errors.push((error as Error).message);
    }
  }
  return errors;
}
