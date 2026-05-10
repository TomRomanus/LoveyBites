import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import DayEntryRow from '../DayEntryRow'
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

function setup(props: Partial<React.ComponentProps<typeof DayEntryRow>> = {}) {
  const defaults = { entry: makeEntry(), recipe: undefined as Recipe | undefined, onDelete: vi.fn() }
  const merged = { ...defaults, ...props }
  return { ...render(<MemoryRouter><DayEntryRow {...merged} /></MemoryRouter>), merged }
}

describe('DayEntryRow', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders recipe title when recipe is provided', () => {
    const recipe = makeRecipe({ title: 'Stamppot' })
    setup({ recipe })
    expect(screen.getByText('Stamppot')).toBeInTheDocument()
  })

  it('renders customDescription when no recipe', () => {
    setup({ entry: makeEntry({ customDescription: 'Afhalen' }) })
    expect(screen.getByText('Afhalen')).toBeInTheDocument()
  })

  it('delete button calls onDelete with entry.id', async () => {
    const onDelete = vi.fn()
    const entry = makeEntry({ id: 'my-id' })
    setup({ entry, onDelete })
    await userEvent.click(screen.getByTestId('delete-entry-btn'))
    expect(onDelete).toHaveBeenCalledWith('my-id')
  })

  it('recipe title text has bordeaux color class', () => {
    const recipe = makeRecipe()
    setup({ recipe })
    const span = screen.getByText('Stamppot')
    expect(span.className).toMatch(/text-bordeaux/)
  })

  it('custom description text has stone color class', () => {
    setup({ entry: makeEntry({ customDescription: 'Restjes' }) })
    const span = screen.getByText('Restjes')
    expect(span.className).toMatch(/text-stone/)
  })
})
