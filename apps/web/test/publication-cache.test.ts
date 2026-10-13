import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { expect, it } from 'vitest';
it('retires legacy and prior-version page caches on service-worker activation', async () => {
  const handlers: Record<
    string,
    (event: { waitUntil: (promise: Promise<unknown>) => void }) => void
  > = {};
  const removed: string[] = [];
  runInNewContext(
    readFileSync(new URL('../integrations/service-worker.js', import.meta.url), 'utf8'),
    {
      CONFIG: { version: 'new' },
      self: {
        addEventListener: (type: string, fn: (typeof handlers)[string]) => {
          handlers[type] = fn;
        },
      },
      caches: {
        keys: async () => [
          'heart-atlas-pages',
          'heart-atlas-pages-old',
          'heart-atlas-pages-new',
          'other-site-cache',
        ],
        delete: async (key: string) => {
          removed.push(key);
        },
      },
    },
  );
  let pending: Promise<unknown> = Promise.resolve();
  handlers['activate']?.({
    waitUntil: (promise) => {
      pending = promise;
    },
  });
  await pending;
  expect(removed).toEqual(['heart-atlas-pages', 'heart-atlas-pages-old']);
});
