import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'yaml';
import { interactiveSchema, validateInteractiveSources } from '../src/lib/interactive.ts';
import { citationNumbers } from '../src/lib/citations.ts';
import { checkMdx, literal } from '../../../scripts/check-content-safety.mjs';
import { repositoryRoot } from '../../../scripts/build-content-fingerprints.mjs';

/** Validate even unused sidecars and citation props before rendering any article. */
export function checkEditorialContent() {
  const directory = resolve(
    repositoryRoot(),
    process.env['HA_TEST_CONTENT'] === '1' ? 'apps/web/test/fixtures/site-content' : 'content',
  );
  for (const file of readdirSync(directory, { recursive: true, encoding: 'utf8' })) {
    if (
      file.endsWith('.interactive.yaml') &&
      !existsSync(resolve(directory, file.replace('.interactive.yaml', '.mdx')))
    )
      throw new Error(`Orphan sidecar ${file}`);
    if (!file.endsWith('.mdx')) continue;
    const source = readFileSync(resolve(directory, file), 'utf8');
    const match = /^---\n([\s\S]*?)\n---/.exec(source);
    if (!match) throw new Error(`Missing frontmatter ${file}`);
    const metadata = parse(match[1] ?? '');
    const sidecarPath = resolve(directory, file.replace('.mdx', '.interactive.yaml'));
    const sidecar = existsSync(sidecarPath)
      ? interactiveSchema.parse(parse(readFileSync(sidecarPath, 'utf8')))
      : undefined;
    if (sidecar) validateInteractiveSources(sidecar, metadata.sources);
    const ast = checkMdx(source);
    const used = new Set<string>();
    type ContentNode = {
      type: string;
      name?: string;
      attributes?: { name: string; value: unknown }[];
      children?: ContentNode[];
    };
    function walk(node: ContentNode) {
      if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
        const values = Object.fromEntries(
          (node.attributes ?? []).map((a: { name: string; value: unknown }) => {
            const value = a.value as {
              type?: string;
              data?: { estree?: { body: { expression: unknown }[] } };
            };
            return [
              a.name,
              value?.type === 'mdxJsxAttributeValueExpression'
                ? literal(value.data?.estree?.body[0]?.expression)
                : a.value,
            ];
          }),
        );
        if (node.name === 'Cite') citationNumbers(values, metadata.sources);
        if (node.name === 'Interactive') {
          if (!sidecar?.blocks.some((block) => block.id === values['id']))
            throw new Error(`Unknown block in ${file}`);
          used.add(values['id']);
        }
      }
      for (const child of node.children ?? []) walk(child);
    }
    walk(ast as unknown as ContentNode);
    if (sidecar?.blocks.some((block) => !used.has(block.id)))
      throw new Error(`Unused interactive block in ${file}`);
  }
}
