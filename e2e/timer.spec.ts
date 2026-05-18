import { test, expect, Page } from '@playwright/test'
import { seedRecipe, deleteRecipe, waitForData, locateCloseButton } from './support/helpers'

const TIMER_RECIPE = {
  id: 'test-timer-e2e-001',
  title: 'Timer testrecept',
  description: '',
  tags: [],
  ingredients: [],
  steps: [{ kind: 'leaf', text: 'Laat 5 minuten sudderen op laag vuur', id: 'step-t1' }],
  portions: 2,
  portionsLabel: 'pers',
  rating: 0,
  benodigdheden: [],
  notes: [],
  sources: [],
  imageUrl: '',
  createdBy: 'test-user-001',
}

async function enterCookMode(page: Page) {
  await page.goto(`/recipe/${TIMER_RECIPE.id}`)
  await waitForData(page, 20_000)
  await page.click('text=Start kookmodus')
  await expect(page.getByText('Laat 5 minuten sudderen op laag vuur').first()).toBeVisible()
}

test.describe('Cook mode — timers', () => {
  test.beforeAll(async () => {
    await seedRecipe(TIMER_RECIPE)
  })

  test.afterAll(async () => {
    await deleteRecipe(TIMER_RECIPE.id)
  })

  // ── Timer start button ──────────────────────────────────────────────────────

  test('shows "Start 5 min timer" button when a step contains a detectable time', async ({ page }) => {
    await enterCookMode(page)
    await expect(page.getByRole('button', { name: 'Start 5 min timer' })).toBeVisible()
  })

  test('clicking the timer button marks it as active', async ({ page }) => {
    await enterCookMode(page)
    await page.getByRole('button', { name: 'Start 5 min timer' }).click()
    await expect(page.getByRole('button', { name: '5 min timer actief' })).toBeVisible()
  })

  // ── Timer pill ──────────────────────────────────────────────────────────────

  test('timer pill appears in cook mode header after starting a timer', async ({ page }) => {
    await enterCookMode(page)
    await page.getByRole('button', { name: 'Start 5 min timer' }).click()
    await expect(page.getByRole('button', { name: 'Timers openen' })).toBeVisible()
  })

  // ── Timer sheet ─────────────────────────────────────────────────────────────

  test('timer sheet shows the timer label and countdown', async ({ page }) => {
    await enterCookMode(page)
    await page.getByRole('button', { name: 'Start 5 min timer' }).click()
    await page.getByRole('button', { name: 'Timers openen' }).click()
    await expect(page.getByText('Timers')).toBeVisible()
    await expect(page.getByText('5 min').first()).toBeVisible()
    await expect(page.getByText('5:00')).toBeVisible()
  })

  test('pause and resume a running timer', async ({ page }) => {
    await enterCookMode(page)
    await page.getByRole('button', { name: 'Start 5 min timer' }).click()
    await page.getByRole('button', { name: 'Timers openen' }).click()
    await page.getByRole('button', { name: 'Timer pauzeren' }).click()
    await expect(page.getByRole('button', { name: 'Timer hervatten' })).toBeVisible()
    await page.getByRole('button', { name: 'Timer hervatten' }).click()
    await expect(page.getByRole('button', { name: 'Timer pauzeren' })).toBeVisible()
  })

  test('dismissing a timer shows empty state', async ({ page }) => {
    await enterCookMode(page)
    await page.getByRole('button', { name: 'Start 5 min timer' }).click()
    await page.getByRole('button', { name: 'Timers openen' }).click()
    await page.getByRole('button', { name: 'Timer verwijderen' }).click()
    await expect(page.getByText('Geen actieve timers')).toBeVisible()
  })

  test('adding a manual timer via the form', async ({ page }) => {
    await enterCookMode(page)
    await page.getByRole('button', { name: 'Start 5 min timer' }).click()
    await page.getByRole('button', { name: 'Timers openen' }).click()
    await page.getByRole('button', { name: 'Timer toevoegen' }).click()
    await page.getByRole('button', { name: 'min verhogen' }).click()
    await page.getByRole('button', { name: 'min verhogen' }).click()
    await page.getByRole('button', { name: 'min verhogen' }).click()
    await page.getByRole('button', { name: 'Start' }).click()
    await expect(page.getByText('3min')).toBeVisible()
  })

  // ── Terug naar kookmodus ────────────────────────────────────────────────────

  test('"Terug naar kookmodus" re-enters cook mode from the timer sheet', async ({ page }) => {
    await enterCookMode(page)
    await page.getByRole('button', { name: 'Start 5 min timer' }).click()
    // Exit cook mode — timer keeps running, pill becomes visible outside cook mode
    await locateCloseButton(page).click()
    await expect(page.locator('[data-testid="cooking-close-btn"]')).not.toBeAttached()
    await expect(page.getByRole('button', { name: 'Timers openen' })).toBeVisible()
    // Open timer sheet from outside cook mode
    await page.getByRole('button', { name: 'Timers openen' }).click()
    await expect(page.getByText('Timers')).toBeVisible()
    await expect(page.getByRole('button', { name: /terug naar kookmodus/i })).toBeVisible()
    // Click → cook mode re-opens
    await page.getByRole('button', { name: /terug naar kookmodus/i }).click()
    await expect(page.getByText('Kookmodus')).toBeVisible()
  })
})
