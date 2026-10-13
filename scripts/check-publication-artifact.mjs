import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';

const directory = resolve(process.argv[2] ?? 'apps/web/dist');
const sentinels = ['HA_DRAFT_SECRET_48f6', 'HA_WITHDRAWN_SECRET_7b20'];
let checked = 0;
for (const file of readdirSync(directory, { recursive: true, encoding: 'utf8' })) {
  const path = resolve(directory, file);
  if (!existsSync(path) || !/\.[^/]+$/.test(file)) continue;
  let data;
  try {
    data = readFileSync(path);
  } catch (error) {
    if (error.code === 'EISDIR') continue;
    throw error;
  }
  if (data[0] === 0x1f && data[1] === 0x8b) data = gunzipSync(data);
  for (const sentinel of sentinels) {
    if (data.includes(Buffer.from(sentinel)))
      throw new Error(`Unpublished content leaked in ${file}: ${sentinel}`);
  }
  checked++;
}
if (checked === 0) throw new Error('Empty artifact');
for (const path of [
  'ru/anatomy/editorial-draft/index.html',
  'ru/embed/anatomy/editorial-draft/index.html',
  'ru/embed/anatomy/editorial-withdrawn/index.html',
]) {
  if (existsSync(resolve(directory, path))) throw new Error(`Forbidden route ${path}`);
}
const tombstone = resolve(directory, 'ru/anatomy/editorial-withdrawn/index.html');
if (!existsSync(tombstone)) throw new Error('Missing withdrawal tombstone');
if (readFileSync(tombstone, 'utf8').includes('data-pagefind-body'))
  throw new Error('Withdrawal indexed');
console.log(
  `Publication artifact passed: ${checked} files including decompressed Pagefind data; tombstone present, no draft/embed routes.`,
);
