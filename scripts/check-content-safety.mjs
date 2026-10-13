import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';
import { parse } from 'yaml';

const root = fileURLToPath(new URL('../', import.meta.url));
const structures = new Set(
  parse(
    readFileSync(new URL('../assets/models/heart/structures.yaml', import.meta.url), 'utf8'),
  ).map((s) => s.id),
);
const props = {
  Patient: [],
  Student: [],
  Quiz: [],
  Cite: ['n', 'refs'],
  Diagram: ['name'],
  Structure: ['id'],
  HeartModel: ['highlight', 'cycle', 'headingLevel', 'disease'],
  CongenitalModel: ['model', 'headingLevel'],
  EcgMonitor: ['preset', 'presets'],
  HeartSounds: ['sound'],
  Interactive: ['id'],
  p: ['slot'],
};

/** Interpret only an ESTree literal subset; never eval or import content. */
export function literal(node) {
  if (
    node?.type === 'Literal' &&
    !node.regex &&
    (node.value === null || ['string', 'number', 'boolean'].includes(typeof node.value))
  )
    return node.value;
  if (node?.type === 'ArrayExpression') return node.elements.map(literal);
  if (node?.type === 'ObjectExpression') {
    const value = Object.create(null);
    for (const property of node.properties) {
      if (
        property.type !== 'Property' ||
        property.computed ||
        property.method ||
        property.kind !== 'init' ||
        !['Identifier', 'Literal'].includes(property.key.type)
      )
        throw new Error('Only literal object properties allowed');
      const key = property.key.name ?? property.key.value;
      if (['__proto__', 'constructor', 'prototype'].includes(key) || Object.hasOwn(value, key))
        throw new Error('Unsafe/duplicate object key');
      value[key] = literal(property.value);
    }
    return value;
  }
  throw new Error(`Nonliteral expression: ${node?.type}`);
}

export function safeUrl(url) {
  if (typeof url !== 'string' || /[\u0000-\u0020\u007f\\]/.test(url)) throw new Error('Unsafe URL');
  if (/^[a-z][a-z\d+.-]*:/i.test(url) && !/^https:\/\//i.test(url))
    throw new Error('Unsafe URL protocol');
  if (url.startsWith('//')) throw new Error('Protocol-relative URL');
}

export function checkMdx(text) {
  const body = text.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, '');
  const ast = unified().use(remarkParse).use(remarkMdx).parse(body);
  function walk(node, parent) {
    if (node.type === 'mdxjsEsm' || node.type === 'html') throw new Error(`Forbidden ${node.type}`);
    if (node.type === 'mdxFlowExpression' || node.type === 'mdxTextExpression')
      throw new Error('Article expressions are forbidden');
    if (node.url !== undefined) safeUrl(node.url);
    if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
      if (!Object.hasOwn(props, node.name)) throw new Error(`Unknown component ${node.name}`);
      if (node.name === 'p' && parent?.name !== 'Diagram')
        throw new Error('HTML permitted only for Diagram captions');
      const values = Object.create(null);
      for (const attribute of node.attributes) {
        if (
          attribute.type !== 'mdxJsxAttribute' ||
          !props[node.name].includes(attribute.name) ||
          Object.hasOwn(values, attribute.name)
        )
          throw new Error(`Forbidden prop on ${node.name}`);
        let value = attribute.value;
        if (value?.type === 'mdxJsxAttributeValueExpression') {
          const expressions = value.data?.estree?.body;
          if (expressions?.length !== 1 || expressions[0].type !== 'ExpressionStatement')
            throw new Error('Expected one literal');
          value = literal(expressions[0].expression);
        }
        values[attribute.name] = value;
      }
      if (node.name === 'Structure' && !structures.has(values.id))
        throw new Error('Unknown structure');
      if (
        node.name === 'HeartModel' &&
        values.highlight !== undefined &&
        (!Array.isArray(values.highlight) || values.highlight.some((id) => !structures.has(id)))
      )
        throw new Error('Unknown highlighted structure');
      if (node.name === 'p' && (typeof values.slot !== 'string' || !/^[a-z-]+$/.test(values.slot)))
        throw new Error('Caption needs a literal slot');
    }
    for (const child of node.children ?? [])
      walk(child, node.type.startsWith('mdxJsx') ? node : parent);
  }
  walk(ast);
  return ast;
}

export function checkContent(
  directory = resolve(
    root,
    process.env.HA_TEST_CONTENT === '1' ? 'apps/web/test/fixtures/site-content' : 'content',
  ),
) {
  const files = readdirSync(directory, { recursive: true, encoding: 'utf8' }).filter((f) =>
    f.endsWith('.mdx'),
  );
  for (const file of files) {
    try {
      checkMdx(readFileSync(resolve(directory, file), 'utf8'));
    } catch (error) {
      throw new Error(`${file}: ${error.message}`, { cause: error });
    }
  }
  return files.length;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  console.log(`Content safety: ${checkContent()} ASTs passed (no MDX execution).`);
