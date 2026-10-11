import { describe, expect, it } from 'vitest';
import { ellipsoid, tube, type Vec3 } from '../src/shapes.ts';
import type { ObjMesh } from '../src/obj.ts';

/** Sum over triangles of (face normal · direction from `inside(face)` to the face centroid). */
function outwardness(mesh: ObjMesh, inside: (c: Vec3) => Vec3): number {
  const p = (i: number): Vec3 => [
    mesh.positions[i * 3] ?? 0,
    mesh.positions[i * 3 + 1] ?? 0,
    mesh.positions[i * 3 + 2] ?? 0,
  ];
  let score = 0;
  let counted = 0;
  for (let t = 0; t < mesh.indices.length; t += 3) {
    const [a, b, c] = [t, t + 1, t + 2].map((k) => p(mesh.indices[k] ?? 0)) as [Vec3, Vec3, Vec3];
    const u: Vec3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const v: Vec3 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const n: Vec3 = [
      u[1] * v[2] - u[2] * v[1],
      u[2] * v[0] - u[0] * v[2],
      u[0] * v[1] - u[1] * v[0],
    ];
    const centre: Vec3 = [
      (a[0] + b[0] + c[0]) / 3,
      (a[1] + b[1] + c[1]) / 3,
      (a[2] + b[2] + c[2]) / 3,
    ];
    if (Math.hypot(...n) < 1e-12) continue; // degenerate triangles at ellipsoid poles
    counted++;
    const o = inside(centre);
    score += Math.sign(
      n[0] * (centre[0] - o[0]) + n[1] * (centre[1] - o[1]) + n[2] * (centre[2] - o[2]),
    );
  }
  return score / counted;
}

describe('shapes', () => {
  it('builds an ellipsoid with outward-facing triangles', () => {
    const mesh = ellipsoid([1, 2, 3], [2, 1, 1]);
    expect(outwardness(mesh, () => [1, 2, 3])).toBeGreaterThan(0.95);
  });

  it('builds a tube with outward-facing walls and caps', () => {
    const mesh = tube(
      [
        [0, 0, 0],
        [0, 0, 5],
        [0, 0, 10],
      ],
      1,
    );
    // The axis is the Z line; caps face away from the tube's middle.
    const isCap = (c: Vec3): boolean => Math.abs(c[2]) < 1e-6 || Math.abs(c[2] - 10) < 1e-6;
    const score = outwardness(mesh, (c) => (isCap(c) ? [0, 0, 5] : [0, 0, c[2]]));
    expect(score).toBeGreaterThan(0.95);
  });

  it('rejects a tube with one point', () => {
    expect(() => tube([[0, 0, 0]], 1)).toThrow();
  });
});
