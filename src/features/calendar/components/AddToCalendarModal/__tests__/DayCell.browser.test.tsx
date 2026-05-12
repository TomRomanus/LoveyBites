import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { DayCell } from '../DayCell'
import type { DaySaveState } from '../DayCell'
import type { MealPlanEntry } from '@/features/calendar/types/calendar'

const TODAY = new Date('2026-05-11T00:00:00.000Z')

function makeEntry(overrides: Partial<MealPlanEntry> = {}): MealPlanEntry {
  return { id: 'e1', date: '2026-05-11', createdAt: null, createdBy: 'u1', ...overrides }
}

const defaultSaveState: DaySaveState = {
  hasThisRecipe: false,
  isSaving: false,
  isRecentlySaved: false,
}

function setup(props: Partial<React.ComponentProps<typeof DayCell>> = {}) {
  const defaults = {
    day: TODAY,
    today: TODAY,
    dayEntries: [],
    recipeMap: new Map<string, { title: string }>(),
    saveState: defaultSaveState,
    onClick: vi.fn(),
  }
  const merged = { ...defaults, ...props }
  return { ...render(<DayCell {...merged} />), onClick: merged.onClick }
}

describe('DayCell', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('day number', () => {
    it('renders the day of the month', () => {
      setup({ day: new Date('2026-05-14T00:00:00.000Z') })
      expect(screen.getByText('14')).toBeInTheDocument()
    })
  })

  describe('click interaction', () => {
    it('calls onClick when the cell is clicked', async () => {
      const onClick = vi.fn()
      setup({ onClick })
      await userEvent.click(screen.getByRole('button'))
      expect(onClick).toHaveBeenCalledOnce()
    })

    it('is disabled while saving', () => {
      setup({ saveState: { ...defaultSaveState, isSaving: true } })
      expect(screen.getByRole('button')).toBeDisabled()
    })

    it('is not disabled when not saving', () => {
      setup({ saveState: { ...defaultSaveState, isSaving: false } })
      expect(screen.getByRole('button')).not.toBeDisabled()
    })
  })

  describe('saved checkmark', () => {
    it('shows the day-saved-check indicator when isRecentlySaved is true', () => {
      setup({ saveState: { ...defaultSaveState, isRecentlySaved: true } })
      expect(screen.getByTestId('day-saved-check')).toBeInTheDocument()
    })

    it('does not show the day-saved-check indicator when isRecentlySaved is false', () => {
      setup({ saveState: { ...defaultSaveState, isRecentlySaved: false } })
      expect(screen.queryByTestId('day-saved-check')).not.toBeInTheDocument()
    })
  })

  describe('existing entries', () => {
    it('renders a label for each entry up to 2', () => {
      const recipeMap = new Map([['r1', { title: 'Stamppot' }]])
      setup({
        dayEntries: [makeEntry({ recipeId: 'r1' }), makeEntry({ id: 'e2', recipeId: 'r1' })],
        recipeMap,
      })
      expect(screen.getAllByText('Stamppot')).toHaveLength(2)
    })

    it('shows an overflow count when there are more than 2 entries', () => {
      const entries = [
        makeEntry({ id: 'e1' }),
        makeEntry({ id: 'e2', customDescription: 'Pizza' }),
        makeEntry({ id: 'e3', customDescription: 'Soep' }),
      ]
      setup({ dayEntries: entries })
      expect(screen.getByText('+1')).toBeInTheDocument()
    })

    it('uses the recipe title from the recipeMap when available', () => {
      const recipeMap = new Map([['r1', { title: 'Pasta Carbonara' }]])
      setup({ dayEntries: [makeEntry({ recipeId: 'r1' })], recipeMap })
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument()
    })

    it('falls back to recipeTitle on the entry when not in recipeMap', () => {
      setup({ dayEntries: [makeEntry({ recipeTitle: 'Appeltaart' })] })
      expect(screen.getByText('Appeltaart')).toBeInTheDocument()
    })

    it('falls back to customDescription when there is no recipe', () => {
      setup({
        dayEntries: [makeEntry({ recipeId: undefined, customDescription: 'Eigen maaltijd' })],
      })
      expect(screen.getByText('Eigen maaltijd')).toBeInTheDocument()
    })
  })
})
