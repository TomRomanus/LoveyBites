import { test, expect, Page } from '@playwright/test'
import {
  reseedRecipes,
  waitForData,
  locateCloseButton,
  resetMealPlan,
  seedRecipe,
  deleteRecipe,
} from './support/helpers'

async function gotoDetail(page: Page, id = 'test-pasta-001') {
  await page.goto(`/recipe/${id}`)
  await waitForData(page, 20_000)
}

function locateActionsButton(page: Page) {
  return page.locator('[data-testid="recipe-actions-btn"]')
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

// ── Equipment & Notes sections ────────────────────────────────────────────────

test.describe('Recipe detail — equipment section', () => {
  test('shows Benodigdheden heading and items when recipe has equipment', async ({ page }) => {
    await gotoDetail(page)
    await expect(page.getByRole('heading', { name: 'Benodigdheden' })).toBeVisible()
    await expect(page.getByText('Grote pan')).toBeVisible()
    await expect(page.getByText('Rasp', { exact: true })).toBeVisible()
  })

  test('does not show Benodigdheden heading when recipe has no equipment', async ({ page }) => {
    await gotoDetail(page, 'test-soup-001')
    await expect(page.getByRole('heading', { name: 'Benodigdheden' })).toBeHidden()
  })
})

test.describe('Recipe detail — notes section', () => {
  test('shows Notities heading, label, and text when recipe has notes', async ({ page }) => {
    await gotoDetail(page)
    await expect(page.getByRole('heading', { name: 'Notities' })).toBeVisible()
    await expect(page.getByText('Bewaren', { exact: true })).toBeVisible()
    await expect(page.getByText('Tot 2 dagen in de koelkast bewaren.')).toBeVisible()
  })

  test('does not show Notities heading when recipe has no notes', async ({ page }) => {
    await gotoDetail(page, 'test-soup-001')
    await expect(page.getByRole('heading', { name: 'Notities' })).toBeHidden()
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
    const fab = page.locator('[data-testid="calendar-fab"]').first()
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

    await page.locator('[data-testid="recipe-back-btn"]').click()
    await expect(page).toHaveURL('/')
  })

  test('404 recipe shows not-found message', async ({ page }) => {
    await page.goto('/recipe/does-not-exist-xyz')
    await waitForData(page, 5_000)
    await expect(page.getByText('Recept niet gevonden.')).toBeVisible()
  })

  test('"Terug" on a missing recipe always goes to home', async ({ page }) => {
    await page.goto('/recipe/does-not-exist-xyz')
    await waitForData(page, 5_000)
    await page.getByRole('button', { name: /terug/i }).click()
    await expect(page).toHaveURL('/')
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
    const fab = page.locator('[data-testid="calendar-fab"]').first()
    await fab.click()
    await expect(page.getByText('Toevoegen aan menu')).toBeVisible()

    // Click today's day button (identified by data-today attribute)
    const todayBtn = page.locator('button[data-today="true"]').first()
    await todayBtn.click()

    // Checkmark animation briefly confirms the save
    await expect(page.locator('[data-testid="day-saved-check"]').first()).toBeVisible({
      timeout: 10_000,
    })
  })
})

// ── Step ingredient refs ───────────────────────────────────────────────────────
// A recipe where each step has ingredientRefs + ingredientAmounts.
// portions: 2 so the default display (selectedPortions = 2) uses ratio 1 — no scaling.

const REFS_RECIPE = {
  id: 'test-refs-001',
  title: 'Pasta met stap-refs',
  description: 'Testrecept.',
  tags: [],
  ingredients: [
    { kind: 'leaf', text: '200 g pasta', id: 'pasta' },
    { kind: 'leaf', text: '100 ml saus', id: 'saus' },
  ],
  steps: [
    {
      kind: 'leaf',
      id: 'step1',
      text: 'Kook de pasta',
      ingredientRefs: ['pasta'],
      ingredientAmounts: { pasta: '200' },
    },
    {
      kind: 'leaf',
      id: 'step2',
      text: 'Verwarm de saus',
      ingredientRefs: ['saus'],
      ingredientAmounts: { saus: '100' },
    },
  ],
  portions: 2,
  portionsLabel: 'pers',
  rating: 3,
  benodigdheden: [],
  notes: [],
  sources: [],
  imageUrl: '',
  createdBy: 'test-user-001',
}

test.describe('Recipe detail — step ingredient refs', () => {
  test.beforeAll(async () => {
    await seedRecipe(REFS_RECIPE)
  })

  test.afterAll(async () => {
    await deleteRecipe(REFS_RECIPE.id)
  })

  test('detail page shows formatted ingredient refs above each step', async ({ page }) => {
    await page.goto(`/recipe/${REFS_RECIPE.id}`)
    await waitForData(page, 20_000)
    // RecipeSteps renders formatStepIngredient(text, amount) above the step text.
    // At ratio 1: formatStepIngredient('200 g pasta', '200') = '200 g pasta'
    await expect(page.getByText('200 g pasta').first()).toBeVisible()
    await expect(page.getByText('Kook de pasta')).toBeVisible()
    await expect(page.getByText('100 ml saus').first()).toBeVisible()
    await expect(page.getByText('Verwarm de saus')).toBeVisible()
  })

  test('cook mode step view shows the step-specific ingredient from Firestore', async ({
    page,
  }) => {
    await page.goto(`/recipe/${REFS_RECIPE.id}`)
    await waitForData(page, 20_000)
    await page.click('text=Start kookmodus')
    await expect(page.getByText('Kook de pasta').first()).toBeVisible()
    // CookingStepsPanel renders currentIngredients joined with ' · ' above the step text
    await expect(page.getByText('200 g pasta').first()).toBeVisible()
  })
})
