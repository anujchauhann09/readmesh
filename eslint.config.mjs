import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

/**
 * Root ESLint flat config (ESLint v9). Lints the Node-side code — `backend/`,
 * `packages/`, and root config files. The Next.js app (`frontend/`) lints
 * itself via `next lint` (run `pnpm --filter readmesh-frontend lint`), so it's
 * ignored here to avoid two ESLint setups fighting over React/JSX rules.
 *
 * `eslint-config-prettier` is last so it disables any stylistic rules that
 * would conflict with Prettier (formatting is owned by Prettier, not ESLint).
 *
 * @type {import('eslint').Linter.Config[]}
 */
export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.next/**',
      'frontend/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  prettier,
];
