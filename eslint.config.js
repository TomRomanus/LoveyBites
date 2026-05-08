import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactPlugin from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import playwright from 'eslint-plugin-playwright'
import prettierConfig from 'eslint-config-prettier'

export default tseslint.config(
  { ignores: ['dist/**', 'playwright-report/**', 'test-results/**', 'functions/lib/**', 'scripts/**'] },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // React rules — src only
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
    },
    settings: {
      react: { version: 'detect' },
    },
  },

  // Playwright rules — e2e only
  {
    files: ['e2e/**/*.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // conditional test.skip() is an accepted Playwright pattern for data-dependent tests
      'playwright/no-conditional-in-test': 'off',
      // page.click/fill still work correctly; full locator migration is a separate task
      'playwright/prefer-locator': 'off',
      // test.skip() is used intentionally for data-dependent tests
      'playwright/no-skipped-test': 'off',
    },
  },

  // Setup scripts don't have assertions — that's expected
  {
    files: ['e2e/support/*.ts'],
    rules: {
      'playwright/expect-expect': 'off',
    },
  },

  // Disable ESLint formatting rules that conflict with Prettier (must be last)
  prettierConfig,
)
