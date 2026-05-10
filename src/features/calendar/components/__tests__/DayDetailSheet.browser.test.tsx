import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import DayDetailSheet from '../DayDetailSheet'
import type { MealPlanEntry } from '@/features/calendar/types/calendar'
import type { Recipe } from '@/features/recipe/types/recipe'

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

function setup(props: Partial<React.ComponentProps<typeof DayDetailSheet>> = {}) {
  const defaults = {
    visible: true,
    date: MONDAY,
    entries: [] as MealPlanEntry[],
    recipeMap: new Map<string, Recipe>(),
    onDelete: vi.fn(),
    onAdd: vi.fn(),
    onClose: vi.fn(),
  }
  const merged = { ...defaults, ...props }
  return {
    ...render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <DayDetailSheet {...merged} />
      </MemoryRouter>,
    ),
    merged,
  }
}

describe('DayDetailSheet', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the day name in uppercase (MAANDAG for Monday)', () => {
    setup()
    expect(screen.getByText('MAANDAG')).toBeInTheDocument()
  })

  it('renders the month name (mei for May)', () => {
    setup()
    expect(screen.getByText(/mei/)).toBeInTheDocument()
  })

  it('renders the day number (11)', () => {
    setup()
    expect(screen.getByText('11')).toBeInTheDocument()
  })

  it('shows "Nog niets gepland." when entries is empty', () => {
    setup({ entries: [] })
    expect(screen.getByText('Nog niets gepland.')).toBeInTheDocument()
  })

  it('does not show "Nog niets gepland." when entries are present', () => {
    setup({ entries: [makeEntry({ customDescription: 'Pizza' })] })
    expect(screen.queryByText('Nog niets gepland.')).not.toBeInTheDocument()
  })

  it('renders entry titles — recipe title from recipeMap', () => {
    const recipe = makeRecipe({ id: 'r1', title: 'Stamppot' })
    const recipeMap = new Map([['r1', recipe]])
    setup({
      entries: [makeEntry({ recipeId: 'r1' })],
      recipeMap,
    })
    expect(screen.getByText('Stamppot')).toBeInTheDocument()
  })

  it('renders entry titles — custom description', () => {
    setup({ entries: [makeEntry({ customDescription: 'Afhalen' })] })
    expect(screen.getByText('Afhalen')).toBeInTheDocument()
  })

  it('"Maaltijd toevoegen" button calls onAdd when clicked', async () => {
    const onAdd = vi.fn()
    setup({ onAdd })
    await userEvent.click(screen.getByRole('button', { name: /maaltijd toevoegen/i }))
    expect(onAdd).toHaveBeenCalledOnce()
  })
})
