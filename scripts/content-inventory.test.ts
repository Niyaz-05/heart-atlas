import { describe, expect, it } from 'vitest';
import { inventory } from './content-inventory.mjs';

describe('data-only content inventory', () => {
  it('computes pilot resources and semantics without executing MDX', () => {
    const rows = inventory();
    const valves = rows.find((row) => row.id === 'ru/anatomy/heart-valves');
    expect(valves).toMatchObject({ locale: 'ru', type: 'anatomy', quiz: true, review: null });
    expect(valves?.components).toContain('Diagram');
    expect(valves?.sources).toBeGreaterThan(0);
    expect(valves?.headings.length).toBeGreaterThan(0);
    for (const id of ['ru/diagnostic/echocardiography', 'ru/disease/mitral-regurgitation']) {
      expect(rows.some((row) => row.id === id)).toBe(true);
    }
    expect(new Set(rows.map((row) => row.id)).size).toBe(rows.length);
  });
});
