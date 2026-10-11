import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseConduction } from '../src/conduction.ts';
import { assetsDir } from '../src/paths.ts';

describe('parseConduction', () => {
  it('accepts the committed conduction.yaml', () => {
    const parts = parseConduction(readFileSync(join(assetsDir, 'heart/conduction.yaml'), 'utf8'));
    expect(parts.map((p) => p.id)).toContain('sa-node');
  });

  it('lists every problem with its id', () => {
    const text = `
- id: a
  shape: ellipsoid
  center: [0, 0]
  radii: [1, 1, 0]
- id: b
  shape: tube
  radius: 0
  paths: [[[0, 0, 0]]]
- id: c
  shape: cone
- 3
`;
    expect(() => parseConduction(text)).toThrow(
      [
        'Invalid conduction.yaml:',
        'a: center must be three numbers',
        'a: radii must be three positive numbers',
        'b: radius must be positive',
        'b: paths must be lists of at least two points',
        'c: shape must be ellipsoid or tube',
        '#3: entry must be a mapping',
      ].join('\n'),
    );
  });
});
