import { test, expect } from '@playwright/test'
import { waitForData, locateCloseButton } from './support/helpers'

// ── New recipe chooser ────────────────────────────────────────────────────────

test.describe('New recipe — chooser screen', () => {
  test('close (X) button navigates back', async ({ page }) => {
    await page.goto('/')
    await waitForData(page)
    await page.click('a[href="/new"]')
    await expect(page).toHaveURL('/new')

    await locateCloseButton(page).click()
    await expect(page).toHaveURL('/')
  })
})

// ── Manual recipe form ────────────────────────────────────────────────────────

test.describe('New recipe — manual form (Zelf invullen)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForData(page, 25_000)
    await page.click('a[href="/new"]')
    await page.waitForURL('/new')
    await page.click('text=Zelf invullen')
  })

  test('submitting with a title creates a recipe and navigates to detail', async ({ page }) => {
    await page.fill('input[placeholder*="Wat gaan we maken"]', 'E2E Testgerecht')
    const submitBtn = page.locator('button[type=submit]').filter({ hasText: 'Toevoegen' })
    await submitBtn.click()
    await page.waitForURL(/\/recipe\//)
    // Full page reload gives a fresh Firebase SDK connection — avoids emulator cold-start hang
    // that occurs after client-side navigation.
    const url = page.url()
    await page.goto(url)
    await waitForData(page, 15_000)
    await expect(page.getByText('E2E Testgerecht').first()).toBeVisible()
  })
})

// ── Edit mode ─────────────────────────────────────────────────────────────────

test.describe('Recipe editing', () => {
  test.beforeEach(async ({ page }) => {
    // Full page load warms up Firestore connection
    await page.goto('/recipe/test-pasta-001')
    await waitForData(page, 15_000)
    // Client-side nav to edit page preserves the warm Firestore connection
    await page.goto('/edit/test-pasta-001')
    await waitForData(page, 10_000)
  })

  test('form is pre-filled with existing recipe data', async ({ page }) => {
    await expect(page.locator('input[placeholder*="Wat gaan we maken"]')).toHaveValue(
      'Pasta Carbonara',
    )
    await expect(
      page.getByText('Een klassiek Italiaans gerecht met eieren, kaas en pancetta.'),
    ).toBeVisible()
    await expect(page.getByText('PASTA')).toBeVisible()
    await expect(page.getByText('italiaans', { exact: true })).toBeVisible()
  })

  test('editing the title and saving updates the recipe', async ({ page }) => {
    const titleInput = page.locator('input[placeholder*="Wat gaan we maken"]')
    await titleInput.clear()
    await titleInput.fill('Pasta Carbonara Bewerkt')
    await page.click('button[type=submit][form=recipe-form]')
    await expect(page).toHaveURL('/recipe/test-pasta-001')
    // Full page reload gives a fresh Firebase SDK connection — avoids emulator cold-start hang
    // that occurs after client-side navigation.
    await page.goto('/recipe/test-pasta-001')
    await waitForData(page, 20_000)
    await expect(page.getByText('Pasta Carbonara Bewerkt').first()).toBeVisible()
  })

  test('close (X) button navigates back without saving', async ({ page }) => {
    // beforeEach already loaded /recipe/test-pasta-001 then /edit/test-pasta-001 (history is set)
    await page.fill('input[placeholder*="Wat gaan we maken"]', 'Unsaved Title')
    await locateCloseButton(page).click()
    await expect(page).toHaveURL('/recipe/test-pasta-001')
    // Full page reload gives a fresh Firebase SDK connection — avoids emulator cold-start hang
    // that occurs after client-side navigation.
    await page.goto('/recipe/test-pasta-001')
    await waitForData(page, 15_000)
    await expect(page.getByText('Pasta Carbonara').first()).toBeVisible()
  })
})
