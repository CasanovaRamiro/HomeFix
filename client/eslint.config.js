import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.app.json', './tsconfig.node.json', './tsconfig.test.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // ── Unused vars: allow _prefix and PascalCase ──────────────────────
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^[A-Z_]',
        caughtErrorsIgnorePattern: '^_',
      }],

      // ── Hard errors: no any, no @ts-ignore ────────────────────────────
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': ['error', {
        'ts-expect-error': 'allow-with-description',
        'ts-ignore': true,
        'ts-nocheck': true,
        'ts-check': false,
        minimumDescriptionLength: 15,
      }],

      // ── Type-safety warnings ───────────────────────────────────────────
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-enum-comparison': 'warn',
      '@typescript-eslint/strict-boolean-expressions': 'warn',
      '@typescript-eslint/no-duplicate-type-constituents': 'warn',
      '@typescript-eslint/no-redundant-type-constituents': 'warn',

      // ── Promise correctness warnings ───────────────────────────────────
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-misused-promises': 'warn',
      '@typescript-eslint/require-await': 'warn',
      '@typescript-eslint/await-thenable': 'warn',

      // ── Misc logic warnings ────────────────────────────────────────────
      '@typescript-eslint/restrict-plus-operands': 'warn',
      'no-constant-binary-expression': 'warn',
      'lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],

      // ── Explicitly allowed ─────────────────────────────────────────────
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/consistent-type-assertions': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/naming-convention': 'off',
      '@typescript-eslint/array-type': 'off',
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      '@typescript-eslint/unbound-method': 'off',
    },
  },
)
