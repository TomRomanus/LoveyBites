import { test, expect, Page } from '@playwright/test'
import { reseedRecipes, waitForData, deleteAllRecipes } from './support/helpers'

test.beforeAll(async () => {
  await reseedRecipes()
})

async function waitForRecipes(page: Page) {
  await waitForData(page, 10_000)
}

function locateSortButton(page: Page) {
  return page
    .locator('button')
    .filter({ hasText: /Naam|Nieuwste|Hoogste|Laagste/ })
    .last()
}

test.describe('Recipe list — initial display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForRecipes(page)
  })

  test('shows all 3 seeded recipes with data from Firestore', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Pasta Carbonara' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Tomatensoep' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Appeltaart' })).toBeVisible()
    await expect(page.getByText(/3\s*RECEPTEN/)).toBeVisible()
    await expect(page.getByText('Een klassiek Italiaans gerecht')).toBeVisible()
    await expect(page.getByText('pasta').first()).toBeVisible()
    await expect(page.getByText('dessert').first()).toBeVisible()
  })
})

test.describe('Recipe list — search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForRecipes(page)
  })

  test('searching by recipe title filters results', async ({ page }) => {
    await page.fill('input[placeholder*="Zoek recept"]', 'Pasta')
    await expect(page.getByRole('heading', { name: 'Pasta Carbonara' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Tomatensoep' })).toBeHidden()
    await expect(page.getByRole('heading', { name: 'Appeltaart' })).toBeHidden()
  })

  test('searching by ingredient filters results', async ({ page }) => {
    await page.fill('input[placeholder*="Zoek recept"]', 'pancetta')
    await expect(page.getByRole('heading', { name: 'Pasta Carbonara' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Tomatensoep' })).toBeHidden()
  })

  test('searching by description text matches correctly', async ({ page }) => {
    await page.fill('input[placeholder*="Zoek recept"]', 'Nederlandse')
    await expect(page.getByRole('heading', { name: 'Appeltaart' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Pasta Carbonara' })).toBeHidden()
  })

  test('search with no match shows empty state', async ({ page }) => {
    await page.fill('input[placeholder*="Zoek recept"]', 'xyznonexistentingredient')
    await expect(page.getByText('Niets gevonden')).toBeVisible()
  })
})

test.describe('Recipe list — tag filter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForRecipes(page)
  })

  test('filter sheet shows all available tags from Firestore', async ({ page }) => {
    await page.click('button:has-text("Tags")')
    await expect(page.getByRole('button', { name: 'pasta', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'soep', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'dessert', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'vegetarisch', exact: true })).toBeVisible()
  })

  test('selecting one tag filters recipe list', async ({ page }) => {
    await page.click('button:has-text("Tags")')
    await page.click('button:has-text("soep")')
    await page.click('button:has-text("Toepassen")')

    await expect(page.getByRole('heading', { name: 'Tomatensoep' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Pasta Carbonara' })).toBeHidden()
    await expect(page.getByRole('heading', { name: 'Appeltaart' })).toBeHidden()
  })

  test('selecting two tags uses AND logic', async ({ page }) => {
    await page.click('button:has-text("Tags")')
    await page.click('button:has-text("soep")')
    await page.click('button:has-text("vegetarisch")')
    await page.click('button:has-text("Toepassen")')

    await expect(page.getByRole('heading', { name: 'Tomatensoep' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Pasta Carbonara' })).toBeHidden()
    await expect(page.getByRole('heading', { name: 'Appeltaart' })).toBeHidden()
  })

  test('tags that dont exist together produce empty state', async ({ page }) => {
    await page.click('button:has-text("Tags")')
    await page.click('button:has-text("pasta")')
    await page.click('button:has-text("dessert")')
    await page.click('button:has-text("Toepassen")')
    await expect(page.getByText('Niets gevonden')).toBeVisible()
  })

  test('"Alles wissen" button clears all active tags', async ({ page }) => {
    await page.click('button:has-text("Tags")')
    await page.click('button:has-text("soep")')
    await page.click('button:has-text("Toepassen")')
    await expect(page.getByRole('heading', { name: 'Pasta Carbonara' })).toBeHidden()

    await page.click('button:has-text("Tags")')
    await page.click('text=Alles wissen')
    await page.click('button:has-text("Toepassen")')
    await expect(page.getByRole('heading', { name: 'Pasta Carbonara' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Tomatensoep' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Appeltaart' })).toBeVisible()
  })
})

test.describe('Recipe list — sorting', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForRecipes(page)
  })

  test('sort by name A→Z puts Appeltaart before Pasta Carbonara before Tomatensoep', async ({
    page,
  }) => {
    await locateSortButton(page).click()
    await page.locator('.lb-sheet').getByRole('button', { name: 'Naam A → Z' }).click()

    const items = page.locator('[style*="border-bottom: 0.5px solid var(--line)"] h3')
    const texts = await items.allTextContents()
    const appIdx = texts.findIndex((t) => t.includes('Appeltaart'))
    const pastaIdx = texts.findIndex((t) => t.includes('Pasta Carbonara'))
    const soupIdx = texts.findIndex((t) => t.includes('Tomatensoep'))
    expect(appIdx).toBeLessThan(pastaIdx)
    expect(pastaIdx).toBeLessThan(soupIdx)
  })

  test('sort by name Z→A puts Tomatensoep first', async ({ page }) => {
    await locateSortButton(page).click()
    await page.click('text=Naam Z → A')

    const items = page.locator('[style*="border-bottom: 0.5px solid var(--line)"] h3')
    const texts = await items.allTextContents()
    const soupIdx = texts.findIndex((t) => t.includes('Tomatensoep'))
    const appIdx = texts.findIndex((t) => t.includes('Appeltaart'))
    expect(soupIdx).toBeLessThan(appIdx)
  })

  test('sort by highest rating puts Appeltaart (4.5) first', async ({ page }) => {
    await locateSortButton(page).click()
    await page.click('text=Hoogste beoordeling')

    const items = page.locator('[style*="border-bottom: 0.5px solid var(--line)"] h3')
    const texts = await items.allTextContents()
    expect(texts[0]).toContain('Appeltaart')
  })

  test('sort by lowest rating puts Tomatensoep (3.5) first', async ({ page }) => {
    await locateSortButton(page).click()
    await page.click('text=Laagste beoordeling')

    const items = page.locator('[style*="border-bottom: 0.5px solid var(--line)"] h3')
    const texts = await items.allTextContents()
    expect(texts[0]).toContain('Tomatensoep')
  })
})

test.describe('Recipe list — navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForRecipes(page)
  })

  test('clicking a recipe navigates to its detail page', async ({ page }) => {
    await page.click('h3:has-text("Pasta Carbonara")')
    await expect(page).toHaveURL('/recipe/test-pasta-001')
  })

  test('clicking the + link navigates to /new', async ({ page }) => {
    await page.click('a[href="/new"]')
    await expect(page).toHaveURL('/new')
  })

  test('bottom nav calendar tab navigates to /calendar', async ({ page }) => {
    const calendarNavLink = page.locator('a[href="/calendar"]')
    await calendarNavLink.click()
    await expect(page).toHaveURL('/calendar')
  })
})

// ── Empty state ───────────────────────────────────────────────────────────────

test.describe('Recipe list — empty state', () => {
  test.beforeAll(async () => {
    await deleteAllRecipes()
  })

  test.afterAll(async () => {
    await reseedRecipes()
  })

  test('empty recipe list shows "Je boek is nog leeg" message', async ({ page }) => {
    await page.goto('/')
    await waitForRecipes(page)
    await expect(page.getByText('Je boek is nog leeg')).toBeVisible()
    await expect(
      page.getByText('Begin met het bewaren van je eerste favoriete recept.'),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Eerste recept toevoegen' })).toBeVisible()
  })
})
