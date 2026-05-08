import { test as setup } from '@playwright/test'
import { TEST_EMAIL, TEST_PASSWORD } from './global-setup'
import { waitForData } from './helpers'
import { fileURLToPath } from 'url'
import path from 'path'

const authFile = path.join(path.dirname(fileURLToPath(import.meta.url)), '../.auth/user.json')

setup.setTimeout(120_000)

setup('authenticate', async ({ page }) => {
  await page.goto('/login')
  await page.locator('[type=email]').waitFor()

  await page.fill('[type=email]', TEST_EMAIL)
  await page.fill('[type=password]', TEST_PASSWORD)
  await page.click('[type=submit]')

  await page.waitForURL('/')

  // Wait for skeleton to APPEAR first (page mounted, Firestore queries started),
  // then DETACH (all queries resolved — includes getMealPlanEntries today-range).
  await waitForData(page, 60_000)

  // Client-side nav to calendar pre-warms getMealPlanEntries(weekStart, weekEnd) on the emulator.
  await page.click('a[href="/calendar"]')
  await waitForData(page, 60_000)

  await page.context().storageState({ path: authFile })
})
