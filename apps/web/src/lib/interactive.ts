import { z } from 'astro/zod';
import { valveStates } from './interactive-registry.ts';
const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const text = z.string().trim().min(1);
export const captionSchema = z.strictObject({
  state: z.enum(valveStates),
  text,
  sourceRefs: z.array(id).min(1),
});
export const diagramSchema = z.strictObject({
  id,
  kind: z.literal('diagram'),
  diagram: z.literal('heart-valves'),
  title: text,
  fallback: text,
  captions: z
    .array(captionSchema)
    .length(2)
    .refine(
      (rows) => new Set(rows.map((r) => r.state)).size === 2,
      'All states need unique captions',
    ),
});
export const interactiveSchema = z.strictObject({
  schemaVersion: z.literal(1),
  blocks: z
    .array(diagramSchema)
    .min(1)
    .refine((rows) => new Set(rows.map((r) => r.id)).size === rows.length, 'Duplicate block id'),
});
export type InteractiveData = z.infer<typeof interactiveSchema>;
export type InteractiveBlock = InteractiveData['blocks'][number];
export function validateInteractiveSources(
  data: InteractiveData,
  sources: readonly { id?: string | undefined }[],
) {
  const known = new Set(sources.map((source) => source.id));
  for (const block of data.blocks)
    for (const caption of block.captions)
      for (const ref of caption.sourceRefs)
        if (!known.has(ref)) throw new Error(`Unknown sourceRef ${ref}`);
}
