/**
 * Horizontal physical properties (left/right) are banned so right-to-left languages work.
 * Vertical and size properties stay allowed: they do not flip with writing direction here.
 */
export default {
  extends: ['stylelint-config-standard', 'stylelint-config-html/astro'],
  plugins: ['stylelint-use-logical'],
  ignoreFiles: [
    '**/dist/**',
    '**/node_modules/**',
    '**/coverage/**',
    '**/playwright-report/**',
    '**/test-results/**',
    '**/.lighthouseci/**',
  ],
  rules: {
    'csstools/use-logical': [
      'always',
      {
        except: [
          'width',
          'height',
          'min-width',
          'min-height',
          'max-width',
          'max-height',
          'top',
          'bottom',
          'margin-top',
          'margin-bottom',
          'padding-top',
          'padding-bottom',
          'border-top',
          'border-bottom',
        ],
      },
    ],
  },
};
