import { describe, expect, it } from 'vitest';
import { mergeMeshes, parseObj } from '../src/obj.ts';

describe('parseObj', () => {
  it('reads vertices and fan-triangulates polygons', () => {
    const mesh = parseObj(
      '# quad\nv 0 0 0\nv 1 0 0\nv 1 1 0\nv 0 1 0\nvn 0 0 1\nf 1//1 2//1 3//1 4//1\n',
    );
    expect(Array.from(mesh.positions)).toEqual([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0]);
    expect(Array.from(mesh.indices)).toEqual([0, 1, 2, 0, 2, 3]);
  });

  it('resolves negative indices', () => {
    const mesh = parseObj('v 0 0 0\nv 1 0 0\nv 0 1 0\nf -3 -2 -1\n');
    expect(Array.from(mesh.indices)).toEqual([0, 1, 2]);
  });

  it('rejects faces that point past the vertex list', () => {
    expect(() => parseObj('v 0 0 0\nf 1 2 3\n')).toThrow(/Bad face/);
  });
});

describe('mergeMeshes', () => {
  it('offsets indices of later meshes', () => {
    const a = parseObj('v 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3\n');
    const merged = mergeMeshes([a, a]);
    expect(merged.positions).toHaveLength(18);
    expect(Array.from(merged.indices)).toEqual([0, 1, 2, 3, 4, 5]);
  });
});
