import { fileURLToPath } from 'node:url';

/** Repository root `assets/models/`, licensed under LICENSE-CONTENT. */
export const assetsDir = fileURLToPath(new URL('../../../assets/models/', import.meta.url));
