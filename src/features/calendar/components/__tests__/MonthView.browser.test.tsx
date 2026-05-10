import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import MonthView from '../MonthView'
import type { MealPlanEntry } from '@/features/calendar/types/calendar'
import type { Recipe } from '@/features/recipe/types/recipe'

// MONDAY = 2026-05-11 (a real Monday in May 2026)
// Using this as both anchor and today
const MONDAY = new Date('2026-05-11T00:00:00.000Z')

// For May 2026:
// monthStart = May 1 (Friday)
// startOfWeek(May 1) = Apr 27 (Monday) — grid start
// endOfMonth = May 31 (Sunday)
// startOfWeek(May 31) = May 25 (Monday), addDays(May25, 6) = May 31 — grid end
// Grid: Apr 27 – May 31 = 35 days (5 weeks × 7)
const EXPECTED_DAY_COUNT = 35

function makeEntry(overrides: Partial<MealPlanEntry> = {}): MealPlanEntry {
  return { id: 'e1', date: '2026-05-11', createdAt: null, createdBy: 'u1', ...overrides }
}

function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: 'r1',
    title: 'Stamppot',
    description: '',
    ingredients: [],
    steps: [],
    tags: [],
    imageUrl: '',
    rating: 0,
    createdAt: null,
    updatedAt: null,
    createdBy: 'u1',
    ...overrides,
  }
}

function setup(props: Partial<React.ComponentProps<typeof MonthView>> = {}) {
  const defaults = {
    anchor: MONDAY,
    today: MONDAY,
    entries: [] as MealPlanEntry[],
    recipeMap: new Map<string, Recipe>(),
    onPickDay: vi.fn(),
    selectedDay: null,
  }
  const merged = { ...defaults, ...props }
  return { ...render(<MonthView {...merged} />), merged }
}

describe('MonthView', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('header labels', () => {
    it('renders "Ma" in the day header (NL_DAYS_GRID[0])', () => {
      setup()
      // NL_DAYS_GRID = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']
      // getAllByText because "Ma" may also appear in day cells for April dates outside month
      expect(screen.getByText('Ma')).toBeInTheDocument()
    })

    it('renders "Di" in the day header (NL_DAYS_GRID[1])', () => {
      setup()
      expect(screen.getByText('Di')).toBeInTheDocument()
    })

    it('renders all 7 header labels', () => {
      setup()
      // Each label appears exactly once as a header
      const labels = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']
      for (const label of labels) {
        expect(screen.getByText(label)).toBeInTheDocument()
      }
    })
  })

  describe('day grid', () => {
    it(`renders ${EXPECTED_DAY_COUNT} day buttons for May 2026 (5 weeks × 7)`, () => {
      setup()
      expect(screen.getAllByTestId('month-day-btn')).toHaveLength(EXPECTED_DAY_COUNT)
    })

    it("marks today's button with data-today='true'", () => {
      setup()
      const allButtons = screen.getAllByTestId('month-day-btn')
      const todayButtons = allButtons.filter((btn) => btn.getAttribute('data-today') === 'true')
      expect(todayButtons).toHaveLength(1)
      expect(todayButtons[0]).toBeInTheDocument()
    })

    it('days outside the anchor month have opacity 0.28', () => {
      setup()
      // Apr 27-30 are outside May; they come first in the grid
      const allButtons = screen.getAllByTestId('month-day-btn')
      // First 4 buttons are April 27-30 (outside month)
      const outOfMonthBtn = allButtons[0]
      expect(outOfMonthBtn).toHaveStyle({ opacity: '0.28' })
    })

    it('days inside the anchor month have opacity 1', () => {
      setup()
      const allButtons = screen.getAllByTestId('month-day-btn')
      // Index 4 = May 1 (first day in month, 4 April days come first)
      const inMonthBtn = allButtons[4]
      expect(inMonthBtn).toHaveStyle({ opacity: '1' })
    })
  })

  describe('click interaction', () => {
    it('calls onPickDay when a day button is clicked', async () => {
      const onPickDay = vi.fn()
      setup({ onPickDay })
      const buttons = screen.getAllByTestId('month-day-btn')
      await userEvent.click(buttons[0])
      expect(onPickDay).toHaveBeenCalledOnce()
      expect(onPickDay).toHaveBeenCalledWith(expect.any(Date))
    })

    it('calls onPickDay with the correct Date when clicking May 11', async () => {
      const onPickDay = vi.fn()
      setup({ onPickDay })
      const allButtons = screen.getAllByTestId('month-day-btn')
      // May 11 is index 4 (April days) + 10 (May 1-10) = index 14
      // Apr 27=0, Apr 28=1, Apr 29=2, Apr 30=3, May1=4, ..., May11=14
      await userEvent.click(allButtons[14])
      expect(onPickDay).toHaveBeenCalledWith(expect.any(Date))
      const calledDate: Date = onPickDay.mock.calls[0][0]
      expect(calledDate.getDate()).toBe(11)
      expect(calledDate.getMonth()).toBe(4) // May = 4 (0-indexed)
    })
  })

  describe('entry rendering', () => {
    it('shows a recipe title in the day cell', () => {
      const recipe = makeRecipe({ id: 'r1', title: 'Stamppot' })
      const entry = makeEntry({ recipeId: 'r1', date: '2026-05-11' })
      setup({
        entries: [entry],
        recipeMap: new Map([['r1', recipe]]),
      })
      expect(screen.getByText('Stamppot')).toBeInTheDocument()
    })

    it('shows customDescription when entry has no recipe', () => {
      const entry = makeEntry({ recipeId: undefined, customDescription: 'Eigen maaltijd', date: '2026-05-11' })
      setup({ entries: [entry] })
      expect(screen.getByText('Eigen maaltijd')).toBeInTheDocument()
    })

    it('shows overflow count "+1" when a day has more than 2 entries', () => {
      const entries = [
        makeEntry({ id: 'e1', customDescription: 'Soep', date: '2026-05-11' }),
        makeEntry({ id: 'e2', customDescription: 'Pizza', date: '2026-05-11' }),
        makeEntry({ id: 'e3', customDescription: 'Pasta', date: '2026-05-11' }),
      ]
      setup({ entries })
      expect(screen.getByText('+1')).toBeInTheDocument()
    })

    it('does not show overflow count when a day has exactly 2 entries', () => {
      const entries = [
        makeEntry({ id: 'e1', customDescription: 'Soep', date: '2026-05-11' }),
        makeEntry({ id: 'e2', customDescription: 'Pizza', date: '2026-05-11' }),
      ]
      setup({ entries })
      expect(screen.queryByText('+0')).not.toBeInTheDocument()
      // No overflow text
      const allText = document.body.textContent ?? ''
      expect(allText).not.toMatch(/\+\d/)
    })
  })
})
