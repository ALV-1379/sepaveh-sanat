import globals from 'globals';

export default [
  { ignores: ['**/dist/**', '**/node_modules/**'] },
  {
    files: ['**/*.{js,jsx,mjs}'],
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      'no-unreachable': 'error',
      'no-duplicate-imports': 'error',
      'no-constant-condition': 'error',
      'no-dupe-keys': 'error',
      'no-undef': 'error',
    },
  },
];
