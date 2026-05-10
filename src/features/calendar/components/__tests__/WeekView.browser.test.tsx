import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import WeekView from '../WeekView'
import type { MealPlanEntry } from '@/features/calendar/types/calendar'
import type { Recipe } from '@/features/recipe/types/recipe'

// MONDAY = 2026-05-11 (a real Monday in May 2026)
const MONDAY = new Date('2026-05-11T00:00:00.000Z')

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

function setup(props: Partial<React.ComponentProps<typeof WeekView>> = {}) {
  const defaults = {
    anchor: MONDAY,
    today: MONDAY,
    entries: [] as MealPlanEntry[],
    recipeMap: new Map<string, Recipe>(),
    onAdd: vi.fn(),
    onDelete: vi.fn(),
  }
  const merged = { ...defaults, ...props }
  return {
    ...render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <WeekView {...merged} />
      </MemoryRouter>,
    ),
    merged,
  }
}

describe('WeekView', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('day structure', () => {
    it('renders 7 add buttons (one per day)', () => {
      setup()
      expect(screen.getAllByTestId('add-meal-btn')).toHaveLength(7)
    })

    it('renders day numbers Mon=11 through Sun=17 for MONDAY anchor', () => {
      setup()
      for (let d = 11; d <= 17; d++) {
        expect(screen.getByText(String(d))).toBeInTheDocument()
      }
    })

    it('renders the anchor day number (11 for Monday)', () => {
      setup()
      expect(screen.getByText('11')).toBeInTheDocument()
    })

    it('renders the "Ma" day label for Monday (NL_DAYS_SHORT[1])', () => {
      setup()
      // NL_DAYS_SHORT[1] = 'Ma' (Monday, index 1 since 0=Sunday)
      expect(screen.getByText('Ma')).toBeInTheDocument()
    })
  })

  describe('entry rendering', () => {
    it('renders a recipe title when entry has a matching recipe', () => {
      const recipe = makeRecipe({ id: 'r1', title: 'Stamppot' })
      const entry = makeEntry({ recipeId: 'r1', date: '2026-05-11' })
      setup({
        entries: [entry],
        recipeMap: new Map([['r1', recipe]]),
      })
      expect(screen.getByText('Stamppot')).toBeInTheDocument()
    })

    it('renders customDescription when entry has no recipe', () => {
      const entry = makeEntry({
        recipeId: undefined,
        customDescription: 'Eigen maaltijd',
        date: '2026-05-11',
      })
      setup({ entries: [entry] })
      expect(screen.getByText('Eigen maaltijd')).toBeInTheDocument()
    })
  })

  describe('delete interaction', () => {
    it('calls onDelete with the entry id when delete button is clicked', () => {
      const onDelete = vi.fn()
      const recipe = makeRecipe({ id: 'r1', title: 'Stamppot' })
      const entry = makeEntry({ id: 'entry-123', recipeId: 'r1', date: '2026-05-11' })
      setup({
        entries: [entry],
        recipeMap: new Map([['r1', recipe]]),
        onDelete,
      })
      fireEvent.click(screen.getByTestId('delete-meal-entry-btn'))
      expect(onDelete).toHaveBeenCalledWith('entry-123')
    })
  })

  describe('add interaction', () => {
    it('calls onAdd with the ISO date string for Monday when first add button is clicked', async () => {
      const onAdd = vi.fn()
      setup({ onAdd })
      const addButtons = screen.getAllByTestId('add-meal-btn')
      await userEvent.click(addButtons[0])
      expect(onAdd).toHaveBeenCalledWith('2026-05-11')
    })

    it('calls onAdd with the ISO date string for Tuesday when second add button is clicked', async () => {
      const onAdd = vi.fn()
      setup({ onAdd })
      const addButtons = screen.getAllByTestId('add-meal-btn')
      await userEvent.click(addButtons[1])
      expect(onAdd).toHaveBeenCalledWith('2026-05-12')
    })
  })
})
