import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,
  reporter: [['html'], ['list']],
  globalSetup: './e2e/support/global-setup.ts',
  use: {
    baseURL: 'http://localhost:5174',
    ...devices['Pixel 7'],
    trace: 'on-first-retry',
    // Framer Motion animations can interfere with timing — prefer waiting for
    // DOM state rather than fixed timeouts where possible.
    actionTimeout: 12_000,
    navigationTimeout: 15_000,
  },
  projects: [
    // ── 1. Save auth state ────────────────────────────────────────────────
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    // ── 2. Main test suite (uses saved auth) ──────────────────────────────
    {
      name: 'android',
      use: {
        ...devices['Pixel 7'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
      testIgnore: /auth\.spec\.ts/,
    },
    // ── 3. Auth-specific tests (no saved auth, fresh context) ─────────────
    {
      name: 'auth-tests',
      use: { ...devices['Pixel 7'] },
      testMatch: /auth\.spec\.ts/,
      dependencies: ['setup'], // still need setup to have run (for the emulator users)
    },
  ],
  webServer: {
    command: 'npm run dev -- --mode test --port 5174',
    url: 'http://localhost:5174',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
