import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.turbo/**',
      '**/generated/**',
      '**/artifacts/**',
      '**/cache/**',
      '**/typechain-types/**',
      '**/ignition/deployments/**',
      '**/playwright-report/**',
      '**/test-results/**',
      'apps/web/src/components/ui/**',
      'packages/shared/src/abi/**',
      'apps/api/prisma/migrations/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx,mts,cts,mjs}'],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'no-console': 'off',
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.test.ts', '**/*.test.tsx', 'apps/api/test/**/*.ts'],
    languageOptions: {
      globals: { ...globals.jest },
    },
  },
  // Reglas con información de tipos para el código de aplicación del backend y
  // del paquete compartido. Las pruebas y los e2e quedan con el config base:
  // viven en tsconfig.spec.json/jest-e2e.json, fuera del tsconfig de build, y
  // su tipado ya lo verifica `pnpm typecheck`.
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: ['apps/api/**/*.ts', 'packages/shared/**/*.ts'],
    ignores: ['apps/api/src/generated/**', '**/*.spec.ts', 'apps/api/test/**'],
  })),
  {
    files: ['apps/api/**/*.ts', 'packages/shared/**/*.ts'],
    ignores: ['apps/api/src/generated/**', '**/*.spec.ts', 'apps/api/test/**'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['**/*.cjs'],
    languageOptions: {
      globals: { ...globals.node, ...globals.commonjs },
    },
  },
  {
    files: ['apps/api/prisma/**/*.ts', 'apps/api/test/**/*.mjs', '**/*.config.{js,mjs,ts}'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    // Escenarios k6 (no son Node: k6 no expone require/process).
    files: ['infra/k6/**/*.js'],
    languageOptions: {
      globals: {
        __ENV: 'readonly',
        __VU: 'readonly',
        __ITER: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['infra/scripts/**/*.mjs', '**/*.config.{js,mjs,ts}'],
    rules: {
      'no-console': 'off',
    },
  },
  prettierConfig,
);
