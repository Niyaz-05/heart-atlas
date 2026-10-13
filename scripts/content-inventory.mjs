import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(new URL('../apps/web/package.json', import.meta.url));
const { parse } = require('yaml');
const root = fileURLToPath(new URL('../content/', import.meta.url));

/** Read content as data only: never import, compile or evaluate article code. */
export function inventory(directory = root) {
  return readdirSync(directory, { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith('.mdx'))
    .sort()
    .map((file) => {
      const text = readFileSync(resolve(directory, file), 'utf8');
      const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(text);
      if (!match) throw new Error(`Missing frontmatter: ${file}`);
      const data = parse(match[1]);
      const body = text.slice(match[0].length);
      const id = file.slice(0, -4);
      const [locale, type] = id.split('/');
      const quizPath = resolve(directory, `${id}.quiz.yaml`);
      return {
        id,
        locale,
        type,
        title: data.title,
        url: `/heart-atlas/${id}/`,
        components: [
          ...new Set([...body.matchAll(/<([A-Z][A-Za-z]*)\b/g)].map((m) => m[1])),
        ].sort(),
        sources: data.sources.length,
        review: data.review ?? null,
        quiz: existsSync(quizPath),
        quizData: existsSync(quizPath) ? parse(readFileSync(quizPath, 'utf8')) : null,
        presets: [data.preset, ...(data.morePresets ?? [])].filter(Boolean),
        models: [...body.matchAll(/<(?:HeartModel|CongenitalModel)\b[^>]*>/g)].map((m) => m[0]),
        headings: [...body.matchAll(/^#{1,6}\s+(.+)$/gm)].map((m) => m[1]),
        links: [...body.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map((m) => m[1]),
        captions: [...body.matchAll(/<p slot="([^"]+)">([\s\S]*?)<\/p>/g)].map((m) => ({
          state: m[1],
          text: m[2].trim(),
        })),
      };
    });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const rows = inventory();
  const output = process.argv[2];
  const json = JSON.stringify(rows, null, 2) + '\n';
  if (output) {
    writeFileSync(`${output}.json`, json);
    writeFileSync(
      `${output}.md`,
      '# Content inventory\n\n| ID | Components | Sources | Quiz | Review |\n| --- | --- | --- | --- | --- |\n' +
        rows
          .map(
            (r) =>
              `| ${r.id} | ${r.components.join(', ')} | ${r.sources} | ${r.quiz} | ${JSON.stringify(r.review)} |`,
          )
          .join('\n') +
        '\n',
    );
  } else process.stdout.write(json);
}
