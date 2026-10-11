/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

// Runs tests through Astro's Vite setup so `astro:content` and import.meta.env work.
export default getViteConfig({
  test: {
    include: ['src/**/*.test.{ts,tsx}', 'test/**/*.test.{ts,tsx}'],
  },
});
