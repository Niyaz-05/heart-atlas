/** Logical properties only, so right-to-left languages work. */
export default {
  extends: ['stylelint-config-standard', 'stylelint-config-html/astro'],
  plugins: ['stylelint-use-logical'],
  rules: {
    'csstools/use-logical': 'always',
  },
};
