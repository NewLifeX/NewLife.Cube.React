import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

/** ESLint 10 扁平配置：TypeScript + React Hooks 基础规则 */
export default tseslint.config(
  {
    ignores: ['node_modules/**', 'dist/**', '../wwwroot/**', 'coverage/**', 'playwright-report/**', 'test-results/**'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      // 只启用经典 Hooks 规则；react-hooks v7 的 React Compiler 规则（set-state-in-effect、
      // refs、immutability 等）会把「effect 内异步加载 → setState」这一通用模式判为错误
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // 现有代码大量使用 unknown/any 边界类型与可选依赖，交给 TypeScript 把关
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  {
    files: ['*.config.ts', 'tests/**/*.ts'],
    languageOptions: { globals: { ...globals.node } },
  },
);
