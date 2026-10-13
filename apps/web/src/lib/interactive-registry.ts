/** Only audited resources. Medical dependency files are hashed, never manually versioned. */
export const interactiveRegistry = {
  'guided-diagram': {
    renderer: 'GuidedDiagram',
    schema: 'guidedSchema',
    fallback: 'all-steps',
    resources: ['heart-valves'],
    dependencies: [
      'apps/web/src/components/interactive/GuidedDiagram.astro',
      'apps/web/src/components/diagrams/Diagram.astro',
      'apps/web/src/components/diagrams/HeartValves.astro',
    ],
  },
  'report-explorer': {
    renderer: 'ReportExplorer',
    schema: 'reportSchema',
    fallback: 'semantic-details',
    resources: [],
    dependencies: ['apps/web/src/components/interactive/ReportExplorer.astro'],
  },
  diagram: {
    schema: 'diagramSchema',
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
