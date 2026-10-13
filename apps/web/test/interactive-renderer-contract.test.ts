import { expect, it } from 'vitest';
import { interactiveSchema, validateInteractiveSources } from '../src/lib/interactive.ts';
import { interactiveRegistry, valveStates } from '../src/lib/interactive-registry.ts';
import { diagramStates } from '../src/components/diagrams/index.ts';
import { selectArticles } from '../src/lib/publication.ts';
it('registry states match the actual renderer and all declared block kinds validate references', () => {
  expect(valveStates).toEqual(diagramStates('heart-valves').states);
  expect(Object.keys(interactiveRegistry).sort()).toEqual([
    'diagram',
    'guided-diagram',
    'report-explorer',
  ]);
  const step = { id: 'one', state: 'diastole', title: 'First', text: 'fixture', sourceRefs: ['a'] };
  const guided = {
    id: 'guide',
    kind: 'guided-diagram',
    diagram: 'heart-valves',
    title: 'Fixture',
    fallback: 'Static',
    steps: [step, { ...step, id: 'two', state: 'systole' }],
  };
  const term = {
    id: 'term',
    label: 'Term',
    example: 'Example',
    explanation: 'Explanation',
    limitations: 'Limits',
    sourceRefs: ['a'],
  };
  const report = {
    id: 'report',
    kind: 'report-explorer',
    title: 'Fixture',
    fallback: 'Static',
    terms: [term],
  };
  const data = interactiveSchema.parse({ schemaVersion: 1, blocks: [guided, report] });
  expect(() => validateInteractiveSources(data, [{ id: 'a' }])).not.toThrow();
  expect(() => validateInteractiveSources(data, [])).toThrow();
  for (const block of [
    { ...guided, steps: [step, step] },
    { ...report, terms: [term, term] },
    { ...report, terms: [{ ...term, referenceRange: 'normal' }] },
    { ...report, terms: [{ ...term, related: 'https://evil.example' }] },
  ])
    expect(() => interactiveSchema.parse({ schemaVersion: 1, blocks: [block] })).toThrow();
  expect(
    selectArticles(
      [{ data: { publication: 'draft' } }, { data: { publication: 'published' } }],
      'preview',
    ),
  ).toHaveLength(2);
  expect(selectArticles([{ data: { publication: 'withdrawn' } }])).toHaveLength(0);
});
