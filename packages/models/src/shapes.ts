import type { ObjMesh } from './obj.ts';

export type Vec3 = [number, number, number];

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
function normalize(a: Vec3): Vec3 {
  const length = Math.hypot(...a);
  if (length === 0) throw new Error('Zero-length vector');
  return [a[0] / length, a[1] / length, a[2] / length];
}

/** UV ellipsoid with outward-facing triangles. */
export function ellipsoid(center: Vec3, radii: Vec3, segments = 16, rings = 10): ObjMesh {
  const positions: number[] = [];
  const indices: number[] = [];
  for (let r = 0; r <= rings; r++) {
    const phi = (Math.PI * r) / rings;
    for (let s = 0; s <= segments; s++) {
      const theta = (2 * Math.PI * s) / segments;
      positions.push(
        center[0] + radii[0] * Math.sin(phi) * Math.cos(theta),
        center[1] + radii[1] * Math.sin(phi) * Math.sin(theta),
        center[2] + radii[2] * Math.cos(phi),
      );
    }
  }
  const row = segments + 1;
  for (let r = 0; r < rings; r++) {
    for (let s = 0; s < segments; s++) {
      const a = r * row + s;
      const b = a + row;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  return { positions: new Float32Array(positions), indices: new Uint32Array(indices) };
}

/** Tube of constant radius along a polyline, with capped ends. Frames use parallel transport. */
export function tube(points: readonly Vec3[], radius: number, sides = 10): ObjMesh {
  if (points.length < 2) throw new Error('A tube needs at least two points');
  const positions: number[] = [];
  const indices: number[] = [];
  const tangents = points.map((p, i) => {
    const prev = points[Math.max(i - 1, 0)] as Vec3;
    const next = points[Math.min(i + 1, points.length - 1)] as Vec3;
    return normalize(sub(next, prev));
  });
  const t0 = tangents[0] as Vec3;
  const helper: Vec3 = Math.abs(t0[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
  let normal = normalize(cross(t0, helper));
  for (const [i, p] of points.entries()) {
    const t = tangents[i] as Vec3;
    // Remove the tangent component so the frame stays perpendicular as the path bends.
    normal = normalize(sub(normal, t.map((c) => c * dot(normal, t)) as Vec3));
    const binormal = cross(t, normal);
    for (let s = 0; s < sides; s++) {
      const angle = (2 * Math.PI * s) / sides;
      const c = Math.cos(angle) * radius;
      const d = Math.sin(angle) * radius;
      positions.push(
        p[0] + normal[0] * c + binormal[0] * d,
        p[1] + normal[1] * c + binormal[1] * d,
        p[2] + normal[2] * c + binormal[2] * d,
      );
    }
  }
  for (let i = 0; i + 1 < points.length; i++) {
    for (let s = 0; s < sides; s++) {
      const a = i * sides + s;
      const b = i * sides + ((s + 1) % sides);
      indices.push(a, b, a + sides, b, b + sides, a + sides);
    }
  }
  // End caps as triangle fans around the first and last points.
  for (const [ring, p, flip] of [
    [0, points[0] as Vec3, true],
    [points.length - 1, points.at(-1) as Vec3, false],
  ] as const) {
    const centre = positions.length / 3;
    positions.push(...p);
    for (let s = 0; s < sides; s++) {
      const a = ring * sides + s;
      const b = ring * sides + ((s + 1) % sides);
      if (flip) indices.push(centre, b, a);
      else indices.push(centre, a, b);
    }
  }
  return { positions: new Float32Array(positions), indices: new Uint32Array(indices) };
}
