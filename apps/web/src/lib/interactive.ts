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
export const guidedSchema = z.strictObject({
  id,
  kind: z.literal('guided-diagram'),
  diagram: z.literal('heart-valves'),
  title: text,
  fallback: text,
  steps: z
    .array(captionSchema.extend({ id, title: text }))
    .min(2)
    .refine((rows) => new Set(rows.map((r) => r.id)).size === rows.length, 'Duplicate step id'),
});
export const reportSchema = z.strictObject({
  id,
  kind: z.literal('report-explorer'),
  title: text,
  fallback: text,
  terms: z
    .array(
      z.strictObject({
        id,
        label: text,
        example: text,
        explanation: text,
        student: text.optional(),
        limitations: text,
        sourceRefs: z.array(id).min(1),
        related: z
          .string()
          .regex(/^[a-z]+\/[a-z0-9-]+$/)
          .optional(),
      }),
    )
    .min(1)
    .refine((rows) => new Set(rows.map((r) => r.id)).size === rows.length, 'Duplicate term id'),
});
export const interactiveSchema = z.strictObject({
  schemaVersion: z.literal(1),
  blocks: z
    .array(z.discriminatedUnion('kind', [diagramSchema, guidedSchema, reportSchema]))
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
    for (const caption of block.kind === 'diagram'
      ? block.captions
      : block.kind === 'guided-diagram'
        ? block.steps
        : block.terms)
      for (const ref of caption.sourceRefs)
        if (!known.has(ref)) throw new Error(`Unknown sourceRef ${ref}`);
}
