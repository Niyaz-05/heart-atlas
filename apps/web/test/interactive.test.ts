import { describe, expect, it } from 'vitest';
import { interactiveSchema, validateInteractiveSources } from '../src/lib/interactive.ts';
import { citationNumbers } from '../src/lib/citations.ts';
const diagram = {
  id: 'demo',
  kind: 'diagram',
  diagram: 'heart-valves',
  title: 'Test',
  fallback: 'Static explanation',
  captions: [
    { state: 'diastole', text: 'First', sourceRefs: ['a'] },
    { state: 'systole', text: 'Second', sourceRefs: ['a'] },
  ],
};
describe('declarative interactive contract', () => {
  it('accepts the existing two valve states, no executable resources', () => {
    expect(interactiveSchema.parse({ schemaVersion: 1, blocks: [diagram] }).blocks).toHaveLength(1);
  });
  it.each([
    { ...diagram, kind: 'unknown' },
    { ...diagram, diagram: '../../evil' },
    { ...diagram, html: '<script/>' },
    { ...diagram, captions: [{ state: 'invented', text: 'x', sourceRefs: ['a'] }] },
  ])('rejects unsupported data', (block) => {
    expect(() => interactiveSchema.parse({ schemaVersion: 1, blocks: [block] })).toThrow();
  });
  it('rejects missing source references and duplicate block ids', () => {
    const sidecar = interactiveSchema.parse({ schemaVersion: 1, blocks: [diagram] });
    expect(() => validateInteractiveSources(sidecar, [{ id: 'b' }])).toThrow();
    expect(() =>
      interactiveSchema.parse({ schemaVersion: 1, blocks: [diagram, diagram] }),
    ).toThrow();
  });
});
describe('stable citations', () => {
  it('resolves ids after source reorder and preserves legacy numbers', () => {
    expect(citationNumbers({ refs: ['a'] }, [{ id: 'b' }, { id: 'a' }])).toEqual([2]);
    expect(citationNumbers({ n: [1, 2] }, [{ id: 'a' }, { id: 'b' }])).toEqual([1, 2]);
  });
  it.each([{ refs: ['missing'] }, { n: 0 }, { n: 3 }, { n: 1, refs: ['a'] }, {}])(
    'rejects ambiguous/missing sources',
    (input) => {
      expect(() => citationNumbers(input, [{ id: 'a' }])).toThrow();
    },
  );
});
