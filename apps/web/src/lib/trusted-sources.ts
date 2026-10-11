// Vite inlines the file at build time, so this works in content.config.ts, pages and tests alike.
import yamlText from '../../../../content/trusted-sources.yaml?raw';
import { parseTrustedSources } from './content.ts';

export const trustedSources = parseTrustedSources(yamlText);
