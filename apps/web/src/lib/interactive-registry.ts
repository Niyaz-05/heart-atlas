/** Only audited resources. Medical dependency files are hashed, never manually versioned. */
export const interactiveRegistry = {
  diagram: {
    renderer: 'Diagram',
    fallback: 'captions',
    resources: ['heart-valves'],
    dependencies: [
      'apps/web/src/components/diagrams/Diagram.astro',
      'apps/web/src/components/diagrams/HeartValves.astro',
      'apps/web/src/components/diagrams/index.ts',
    ],
  },
} as const;
export const valveStates = ['diastole', 'systole'] as const;
