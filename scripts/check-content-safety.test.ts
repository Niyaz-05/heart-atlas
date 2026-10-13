import { describe, expect, it } from 'vitest';
import { checkMdx } from './check-content-safety.mjs';

describe('MDX AST boundary before compilation', () => {
  it.each([
    'import fs from "node:fs"\n\n# Text',
    '<Cite n={danger()} />', '<Cite {...props} />', '<Unknown />',
    '<Patient onclick="bad">text</Patient>', '[bad](javascript:alert%281%29)',
    '<a href="data:text/html,evil">bad</a>', '{process.exit()}',
    '<script>bad()</script>', '<Structure id="not-real">bad</Structure>',
    '<Cite n={{get value(){return 1}}} />', '<Cite n={globalThis} />',
  ])('rejects executable or unsupported content: %s', (body) => {
    expect(() => checkMdx(body)).toThrow();
  });
  it('allows literal citation arrays and narrow historical slots', () => {
    expect(() => checkMdx('<Patient>Text <Cite n={[1, 2]} /></Patient>\n\n<Diagram name="heart-valves">\n<p slot="systole">Text</p>\n</Diagram>')).not.toThrow();
  });
  it('rejects HTML outside the explicit caption location', () => {
    expect(() => checkMdx('<p slot="systole">text</p>')).toThrow();
  });
});
