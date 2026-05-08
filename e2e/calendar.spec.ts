import { test, expect, Page } from '@playwright/test'
import {
  resetMealPlan,
  seedMealPlanEntry,
  waitForData,
  locateCloseButton,
} from './support/helpers'

async function gotoCalendar(page: Page) {
  // Full page load gives a fresh Firebase SDK connection — avoids the emulator
  // cold-start hang that occurs on client-side navigation.
  await page.goto('/calendar')
  await waitForData(page, 30_000)
}

function locateAddButton(page: Page) {
  return page
    .locator('button')
    .filter({
      has: page.locator('svg path[d*="M5 12h14"]'),
    })
    .first()
}

function locateShoppingButton(page: Page) {
  return page
    .locator('button')
    .filter({
      has: page.locator('svg path[d*="M16 10a4 4"]'),
    })
    .first()
}

async function openAddSheet(page: Page) {
  await locateAddButton(page).click()
  await expect(page.getByText('Maaltijd toevoegen')).toBeVisible()
}

// Click a recipe item in the add sheet by targeting its button element directly.
// Using text= on the inner span is unreliable during Framer Motion layout animations.
function clickRecipeInSheet(page: Page, name: string) {
  return page.locator('.lb-sheet button').filter({ hasText: name }).first().click()
}

// ── Add meal sheet — recipe tab ───────────────────────────────────────────────

test.describe('Calendar — add meal sheet (recipe tab)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoCalendar(page)
    await openAddSheet(page)
    // Wait for recipe list to load before each test
    await expect(page.getByText('Pasta Carbonara').first()).toBeVisible({ timeout: 30_000 })
  })

  test('all 3 seeded recipes appear in the list', async ({ page }) => {
    await expect(page.getByText('Pasta Carbonara').first()).toBeVisible()
    await expect(page.getByText('Tomatensoep').first()).toBeVisible()
    await expect(page.getByText('Appeltaart').first()).toBeVisible()
  })

  test('searching filters the recipe list', async ({ page }) => {
    await page.fill('input[placeholder*="Zoek recept"]', 'soep')
    await expect(page.getByText('Tomatensoep').first()).toBeVisible()
    await expect(page.getByText('Pasta Carbonara').first()).toBeHidden()
  })

  test('searching by ingredient filters results', async ({ page }) => {
    await page.fill('input[placeholder*="Zoek recept"]', 'pancetta')
    await expect(page.getByText('Pasta Carbonara').first()).toBeVisible()
    await expect(page.getByText('Tomatensoep').first()).toBeHidden()
  })

  test('selecting a recipe closes the sheet and shows it in the week', async ({ page }) => {
    await clickRecipeInSheet(page, 'Pasta Carbonara')
    await expect(page.getByText('Maaltijd toevoegen')).toBeHidden()
    await expect(page.getByText('Pasta Carbonara').first()).toBeVisible()
  })
})

// ── Add meal sheet — custom text tab ─────────────────────────────────────────

test.describe('Calendar — add meal sheet (custom text tab)', () => {
  test('can add a custom meal and it appears in week view', async ({ page }) => {
    await gotoCalendar(page)
    await openAddSheet(page)
    await page.click('text=Eigen tekst')
    const input = page
      .locator('input[placeholder*="Afhalen"]')
      .or(page.locator('input[placeholder*="Restjes"]'))
      .first()
    await expect(input).toBeVisible()
    await input.fill('Afhalen Grieks')
    await page.click('text=Aan planning toevoegen')
    await expect(page.getByText('Maaltijd toevoegen')).toBeHidden()
    await expect(page.getByText('Afhalen Grieks').first()).toBeVisible()
  })
})

// ── Meal management ───────────────────────────────────────────────────────────

test.describe('Calendar — meal management in week view', () => {
  test.beforeEach(async ({ page }) => {
    await resetMealPlan()
    await gotoCalendar(page)
  })

  test('adding a recipe shows it in the week row', async ({ page }) => {
    await openAddSheet(page)
    await expect(page.getByText('Tomatensoep').first()).toBeVisible({ timeout: 30_000 })
    await clickRecipeInSheet(page, 'Tomatensoep')
    await expect(page.getByText('Tomatensoep').first()).toBeVisible()
  })

  test('can delete a meal entry from week view', async ({ page }) => {
    await openAddSheet(page)
    await expect(page.getByText('Tomatensoep').first()).toBeVisible({ timeout: 30_000 })
    await clickRecipeInSheet(page, 'Tomatensoep')
    await expect(page.getByText('Tomatensoep').first()).toBeVisible()

    await locateCloseButton(page).click()
    await expect(page.getByText('Tomatensoep')).toBeHidden()
  })

  test('adding same recipe twice is prevented (recipe not shown in list again)', async ({
    page,
  }) => {
    await openAddSheet(page)
    await expect(page.getByText('Pasta Carbonara').first()).toBeVisible({ timeout: 30_000 })
    await clickRecipeInSheet(page, 'Pasta Carbonara')
    await expect(page.getByText('Maaltijd toevoegen')).toBeHidden()

    await locateAddButton(page).click()
    await expect(page.getByText('Maaltijd toevoegen')).toBeVisible()
    // Scope to inside the sheet — the week-view entry (behind the sheet) is still visible
    await expect(page.locator('.lb-sheet').getByText('Pasta Carbonara').first()).toBeHidden()
  })
})

// ── Shopping list ─────────────────────────────────────────────────────────────

test.describe('Calendar — shopping list', () => {
  test.beforeEach(async ({ page }) => {
    await resetMealPlan()
    await gotoCalendar(page)
  })

  test('empty shopping list shows "Geen geplande recepten" message', async ({ page }) => {
    await locateShoppingButton(page).click()
    await expect(page.getByText('Geen geplande recepten in deze periode.')).toBeVisible()
  })

  test('shopping list shows added recipe ingredients', async ({ page }) => {
    await openAddSheet(page)
    await expect(page.getByText('Pasta Carbonara').first()).toBeVisible({ timeout: 30_000 })
    await clickRecipeInSheet(page, 'Pasta Carbonara')
    await expect(page.getByText('Maaltijd toevoegen')).toBeHidden()

    await locateShoppingButton(page).click()
    await expect(page.getByText('Pasta Carbonara').first()).toBeVisible()
    await expect(page.getByText(/spaghetti/)).toBeVisible()
  })
})

// ── Shopping list ─────────────────────────────────────────────────────────────
// (continued)

test.describe('Calendar — shopping list date range', () => {
  test.beforeEach(async ({ page }) => {
    await resetMealPlan()
    await gotoCalendar(page)
  })

  test('changing date range to exclude added meal shows empty state', async ({ page }) => {
    await openAddSheet(page)
    await expect(page.getByText('Tomatensoep').first()).toBeVisible({ timeout: 30_000 })
    await clickRecipeInSheet(page, 'Tomatensoep')
    await expect(page.getByText('Maaltijd toevoegen')).toBeHidden()

    await locateShoppingButton(page).click()
    // Verify the meal's ingredient appears in the current range
    await expect(page.getByText(/tomaten/).first()).toBeVisible({ timeout: 10_000 })

    // Open the VAN (FROM) date picker (first button containing the calendar icon)
    const pickerButtons = page.locator('.lb-sheet').locator('button').filter({
      has: page.locator('svg rect[x="3"][y="4"]'),
    })
    await pickerButtons.nth(0).click()

    // Navigate to next month in the date picker dropdown
    const pickerDropdown = page.locator('[style*="z-index: 400"]')
    await pickerDropdown
      .locator('button')
      .filter({ has: page.locator('svg path[d="m9 18 6-6-6-6"]') })
      .click()

    // Click day 15 of next month (sets FROM to a future date, excluding today's meal)
    await pickerDropdown.locator('button').filter({ hasText: '15' }).first().click()

    // Shopping list should now show the empty state
    await expect(
      page.getByText('Geen geplande recepten in deze periode.'),
    ).toBeVisible({ timeout: 8_000 })
  })
})

// ── Week navigation ───────────────────────────────────────────────────────────

test.describe('Calendar — week navigation', () => {
  test.beforeEach(async ({ page }) => {
    await gotoCalendar(page)
  })

  test('next week button advances past current week', async ({ page }) => {
    const forwardBtn = page
      .locator('button')
      .filter({ has: page.locator('svg path[d="m9 18 6-6-6-6"]') })
      .first()
    await forwardBtn.click()
    // Vandaag becomes enabled when not on the current period
    await expect(page.locator('button:has-text("Vandaag")')).toBeEnabled()
  })

  test('"Vandaag" button returns to current week after navigating away', async ({ page }) => {
    const forwardBtn = page
      .locator('button')
      .filter({ has: page.locator('svg path[d="m9 18 6-6-6-6"]') })
      .first()
    await forwardBtn.click()

    const vandaagBtn = page.locator('button:has-text("Vandaag")')
    await expect(vandaagBtn).toBeEnabled()
    await vandaagBtn.click()
    // Back to current period — button is disabled again
    await expect(vandaagBtn).toBeDisabled()
  })
})

// ── Navigation from calendar ──────────────────────────────────────────────────

test.describe('Calendar — navigation', () => {
  test('bottom nav home tab navigates to recipe list', async ({ page }) => {
    await gotoCalendar(page)
    const homeLink = page.locator('a[href="/"]')
    await homeLink.click()
    await expect(page).toHaveURL('/')
  })

  test('switching to month view shows calendar grid', async ({ page }) => {
    await gotoCalendar(page)
    await page.click('button:has-text("MAAND")')
    await expect(page.locator('button[style*="border-radius: 10px"]').first()).toBeVisible()
  })

  test('clicking a day in month view opens day detail sheet', async ({ page }) => {
    await resetMealPlan()
    await gotoCalendar(page)
    await page.click('button:has-text("MAAND")')
    await expect(page.locator('button[style*="border-radius: 10px"]').first()).toBeVisible()
    await page.locator('button[style*="border-radius: 10px"]').first().click()
    // Day detail sheet opens showing empty state
    await expect(page.getByText('Nog niets gepland.').first()).toBeVisible()
  })

  test('clicking a recipe entry in day detail navigates to recipe detail', async ({ page }) => {
    await resetMealPlan()
    await seedMealPlanEntry('test-pasta-001')
    await gotoCalendar(page)
    await page.click('button:has-text("MAAND")')
    await expect(page.locator('button[style*="border-radius: 10px"]').first()).toBeVisible()
    const todayBtn = page
      .locator('button[style*="border-radius: 10px"]')
      .filter({ has: page.locator('div[style*="var(--bordeaux)"]') })
      .first()
    await todayBtn.click()
    const recipeTitle = page
      .locator('.lb-sheet span')
      .filter({ hasText: 'Pasta Carbonara' })
      .first()
    await expect(recipeTitle).toBeVisible({ timeout: 8_000 })
    await recipeTitle.click()
    await expect(page).toHaveURL('/recipe/test-pasta-001')
  })
})

// ── Day detail sheet ──────────────────────────────────────────────────────────

test.describe('Calendar — day detail sheet', () => {
  test.beforeEach(async ({ page }) => {
    await resetMealPlan()
    await gotoCalendar(page)
  })

  test('can delete a meal from day detail sheet in month view', async ({ page }) => {
    // Add a meal via the add sheet (adds to whichever day's + button is first)
    await openAddSheet(page)
    await expect(page.getByText('Tomatensoep').first()).toBeVisible({ timeout: 30_000 })
    await clickRecipeInSheet(page, 'Tomatensoep')
    await expect(page.getByText('Maaltijd toevoegen')).toBeHidden()

    // Switch to month view
    await page.click('button:has-text("MAAND")')
    await expect(page.locator('button[style*="border-radius: 10px"]').first()).toBeVisible()

    // Find the month-grid button that contains the Tomatensoep label
    const dayWithEntry = page
      .locator('button[style*="border-radius: 10px"]')
      .filter({ has: page.locator('span').filter({ hasText: /Tomaten/ }) })
      .first()
    await expect(dayWithEntry).toBeVisible({ timeout: 5_000 })
    await dayWithEntry.click()

    // Day detail sheet shows the meal
    await expect(page.locator('.lb-sheet').getByText('Tomatensoep').first()).toBeVisible()

    // Delete via the X button inside the sheet
    const deleteBtn = page
      .locator('.lb-sheet')
      .locator('button')
      .filter({ has: page.locator('svg path[d*="M18 6 6"]') })
      .first()
    await deleteBtn.click()

    // Entry animates out of the sheet; month-grid label behind the backdrop can't interfere
    await expect(page.locator('.lb-sheet').getByText('Tomatensoep')).toBeHidden()
  })
})
