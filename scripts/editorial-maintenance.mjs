import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { repositoryRoot } from './build-content-fingerprints.mjs';
const root = repositoryRoot();
const today = new Date().toISOString().slice(0, 10);
const due = [];
for (const name of readdirSync(resolve(root, 'editorial/reviews')).filter((name) =>
  name.endsWith('.json'),
)) {
  const record = JSON.parse(readFileSync(resolve(root, 'editorial/reviews', name), 'utf8'));
  if (!record.nextReview || record.nextReview <= today)
    due.push(`${record.articleId}: next review ${record.nextReview ?? 'missing'}`);
}
const report = due.length
  ? '## Medical reviews due\n\n' + due.map((line) => `- ${line}`).join('\n') + '\n'
  : '';
if (process.argv[2]) writeFileSync(process.argv[2], report);
else console.log(JSON.stringify({ asOf: today, due }, null, 2));
