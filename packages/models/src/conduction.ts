import { parse } from 'yaml';
import type { Vec3 } from './shapes.ts';

export type ConductionPart =
  | { id: string; shape: 'ellipsoid'; center: Vec3; radii: Vec3 }
  | { id: string; shape: 'tube'; radius: number; paths: Vec3[][] };

const isVec3 = (v: unknown): v is Vec3 =>
  Array.isArray(v) && v.length === 3 && v.every((n) => typeof n === 'number' && Number.isFinite(n));
const isPositive = (n: unknown): n is number => typeof n === 'number' && n > 0;

/** Parses and validates conduction.yaml. Throws with every problem listed. */
export function parseConduction(text: string): ConductionPart[] {
  const data: unknown = parse(text);
  if (!Array.isArray(data)) throw new Error('conduction.yaml must be a list');
  const errors: string[] = [];
  const parts: ConductionPart[] = [];
  for (const [index, item] of data.entries()) {
    if (typeof item !== 'object' || item === null) {
      errors.push(`#${index}: entry must be a mapping`);
      continue;
    }
    const e = item as Record<string, unknown>;
    const id = typeof e['id'] === 'string' ? e['id'] : `#${index}`;
    if (e['shape'] === 'ellipsoid') {
      const { center, radii } = e;
      if (!isVec3(center)) errors.push(`${id}: center must be three numbers`);
      if (!isVec3(radii) || !radii.every(isPositive))
        errors.push(`${id}: radii must be three positive numbers`);
      if (isVec3(center) && isVec3(radii)) parts.push({ id, shape: 'ellipsoid', center, radii });
    } else if (e['shape'] === 'tube') {
      const { radius, paths } = e;
      const pathsOk =
        Array.isArray(paths) &&
        paths.length > 0 &&
        paths.every((p) => Array.isArray(p) && p.length >= 2 && p.every(isVec3));
      if (!isPositive(radius)) errors.push(`${id}: radius must be positive`);
      if (!pathsOk) errors.push(`${id}: paths must be lists of at least two points`);
      if (isPositive(radius) && pathsOk)
        parts.push({ id, shape: 'tube', radius, paths: paths as Vec3[][] });
    } else {
      errors.push(`${id}: shape must be ellipsoid or tube`);
    }
  }
  if (errors.length > 0) throw new Error(`Invalid conduction.yaml:\n${errors.join('\n')}`);
  return parts;
}
