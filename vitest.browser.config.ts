/// <reference types="vitest/config" />
import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'

// Browser-mode config: runs the .test.tsx component tests in real Chromium via
// Playwright. Complements the jsdom run in vite.config.ts by catching issues
// that jsdom cannot simulate (real event dispatch, focus, form behaviour, etc.).
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'framer-motion': path.resolve(__dirname, 'src/test/mocks/framer-motion.tsx'),
    },
  },
  plugins: [react()],
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react-router-dom',
      '@testing-library/react',
      '@testing-library/user-event',
      'lucide-react',
      '@tanstack/react-query',
      '@radix-ui/react-dialog',
      'date-fns',
      'date-fns/locale',
      'zod',
    ],
  },
  test: {
    name: 'browser',
    include: ['src/**/*.browser.test.tsx'],
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      screenshotFailures: false,
      instances: [{ browser: 'chromium' }],
    },
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    env: {
      VITE_ENABLE_GOOGLE_LOGIN: 'true',
    },
  },
})
