import { test, expect, Page } from '@playwright/test'
import { reseedRecipes, waitForData, locateCloseButton, resetMealPlan } from './support/helpers'

async function gotoDetail(page: Page, id = 'test-pasta-001') {
  await page.goto(`/recipe/${id}`)
  await waitForData(page, 20_000)
}

function locateActionsButton(page: Page) {
  return page
    .locator('button')
    .filter({
      has: page.locator('circle[r="1.6"]'),
    })
    .first()
}

// ── Display ───────────────────────────────────────────────────────────────────

test.describe('Recipe detail — display', () => {
  test.beforeEach(async ({ page }) => {
    await gotoDetail(page)
  })

  test('shows recipe title, description, and tags from Firestore', async ({ page }) => {
    await expect(page.getByText('Pasta Carbonara').first()).toBeVisible()
    await expect(
      page.getByText('Een klassiek Italiaans gerecht met eieren, kaas en pancetta.'),
    ).toBeVisible()
    await expect(page.getByText('pasta').first()).toBeVisible()
    await expect(page.getByText('italiaans').first()).toBeVisible()
  })

  test('shows ingredients scaled to default 2 portions', async ({ page }) => {
    // Default display is 2 portions (ratio 2/4 = 0.5), so amounts are halved
    await expect(page.getByText('200g spaghetti')).toBeVisible()
    await expect(page.getByText('75g pancetta')).toBeVisible()
  })

  test('shows all steps from Firestore', async ({ page }) => {
    await expect(page.getByText('Kook de spaghetti in gezouten water al dente')).toBeVisible()
    await expect(page.getByText('Meng alles voorzichtig buiten het vuur om')).toBeVisible()
  })
})

// ── Cook mode ─────────────────────────────────────────────────────────────────

test.describe('Recipe detail — cook mode', () => {
  test.beforeEach(async ({ page }) => {
    await gotoDetail(page)
    await page.click('text=Start kookmodus')
    await expect(
      page.getByText('Kook de spaghetti in gezouten water al dente').first(),
    ).toBeVisible()
  })

  test('cook mode shows step text and ingredient data from Firestore', async ({ page }) => {
    await expect(
      page.getByText('Kook de spaghetti in gezouten water al dente').first(),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Ingrediënten' }).click()
    await expect(page.getByText('spaghetti').first()).toBeVisible()
  })

  test('Overzicht tab shows all steps from Firestore', async ({ page }) => {
    await page.click('text=Overzicht')
    await expect(page.getByText('TIK EEN STAP AAN OM ERNAAR TE SPRINGEN')).toBeVisible()
    await expect(
      page.getByText('Kook de spaghetti in gezouten water al dente').first(),
    ).toBeVisible()
    await expect(page.getByText('Meng alles voorzichtig buiten het vuur om').first()).toBeVisible()
  })

  test('close button exits cook mode', async ({ page }) => {
    await locateCloseButton(page).click()
    await expect(page.getByText('Kookmodus', { exact: true })).toBeHidden()
    await expect(page.getByText('Start kookmodus')).toBeVisible()
  })
})

// ── Calendar FAB & modal ──────────────────────────────────────────────────────

test.describe('Recipe detail — calendar FAB and modal', () => {
  test.beforeEach(async ({ page }) => {
    await gotoDetail(page)
  })

  test('calendar FAB opens modal showing recipe title', async ({ page }) => {
    const fab = page.locator('button[style*="position: fixed"][style*="bordeaux"]').first()
    await fab.click()
    await expect(page.getByText('Toevoegen aan menu')).toBeVisible()
    await expect(page.getByText('Pasta Carbonara').first()).toBeVisible()
  })
})

// ── Actions menu ──────────────────────────────────────────────────────────────

test.describe('Recipe detail — actions menu', () => {
  test('"Recept bewerken" navigates to edit page', async ({ page }) => {
    await gotoDetail(page)
    await locateActionsButton(page).click()
    await page.click('text=Recept bewerken')
    await expect(page).toHaveURL('/edit/test-pasta-001')
  })
})

// ── Delete flow ───────────────────────────────────────────────────────────────

test.describe('Recipe detail — delete flow', () => {
  test.afterAll(async () => {
    // Restore deleted recipe so parallel/subsequent tests see all 3 recipes.
    await reseedRecipes()
  })

  test('cancelling delete keeps the recipe', async ({ page }) => {
    await gotoDetail(page)
    await locateActionsButton(page).click()
    await page.click('text=Recept verwijderen')
    await expect(page.getByText('Dit recept verwijderen?')).toBeVisible()
    await page.click('button:has-text("Annuleren")')
    await expect(page.getByText('Dit recept verwijderen?')).toBeHidden()
    await expect(page.getByText('Pasta Carbonara').first()).toBeVisible()
  })

  test('confirming delete navigates back to recipe list', async ({ page }) => {
    await gotoDetail(page, 'test-cake-001')
    await locateActionsButton(page).click()
    await page.click('text=Recept verwijderen')
    await expect(page.getByText('“Appeltaart” wordt uit ons kookboek gehaald.')).toBeVisible()
    await page.click('button:has-text("Verwijderen")')
    await page.waitForURL('/')
    await waitForData(page, 10_000)
    await expect(page.locator('h3').filter({ hasText: 'Appeltaart' })).toBeHidden()
  })
})

// ── Navigation ────────────────────────────────────────────────────────────────

test.describe('Recipe detail — navigation', () => {
  test('back button navigates to previous page', async ({ page }) => {
    await page.goto('/')
    await waitForData(page, 10_000)
    await gotoDetail(page)

    const backBtn = page
      .locator('button')
      .filter({
        has: page.locator('svg path[d*="m15 18-6-6"]'),
      })
      .first()
    await backBtn.click()
    await expect(page).toHaveURL('/')
  })

  test('404 recipe shows not-found message', async ({ page }) => {
    await page.goto('/recipe/does-not-exist-xyz')
    await waitForData(page, 5_000)
    await expect(page.getByText('Recept niet gevonden.')).toBeVisible()
  })
})

// ── Calendar modal ────────────────────────────────────────────────────────────

test.describe('Recipe detail — calendar modal day selection', () => {
  test.beforeEach(async ({ page }) => {
    await resetMealPlan()
    await gotoDetail(page)
  })

  test.afterAll(async () => {
    await resetMealPlan()
  })

  test('clicking a day in the calendar modal adds the recipe', async ({ page }) => {
    const fab = page.locator('button[style*="position: fixed"][style*="bordeaux"]').first()
    await fab.click()
    await expect(page.getByText('Toevoegen aan menu')).toBeVisible()

    // Click today's day button (identified by its bordeaux circular background)
    const todayBtn = page
      .locator('button')
      .filter({ has: page.locator('span[style*="var(--bordeaux)"]') })
      .first()
    await todayBtn.click()

    // Checkmark animation briefly confirms the save
    await expect(page.locator('path[d*="M5 13l4 4"]').first()).toBeVisible({ timeout: 10_000 })
  })
})
