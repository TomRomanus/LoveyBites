import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ShoppingListSheet from '../ShoppingListSheet'
import type { Recipe, IngredientNode } from '@/features/recipe/types/recipe'
import type { MealPlanEntry } from '@/features/calendar/types/calendar'

vi.mock('@/features/calendar/api/calendarQueries')
import { fetchEntriesWithRecipes } from '@/features/calendar/api/calendarQueries'

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

function setup(props: Partial<React.ComponentProps<typeof ShoppingListSheet>> = {}) {
  const defaults = {
    visible: true,
    defaultStart: '2026-05-11',
    defaultEnd: '2026-05-17',
    onClose: vi.fn(),
  }
  const merged = { ...defaults, ...props }
  return render(
    <QueryClientProvider client={makeQC()}>
      <ShoppingListSheet {...merged} />
    </QueryClientProvider>,
  )
}

function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: 'r1',
    title: 'Stamppot',
    description: '',
    ingredients: [{ kind: 'leaf', text: '200g aardappelen' } as IngredientNode],
    steps: [],
    tags: [],
    imageUrl: '',
    portions: 2,
    createdAt: null as any,
    updatedAt: null as any,
    createdBy: 'u1',
    ...overrides,
  }
}

function makeEntry(overrides: Partial<MealPlanEntry> = {}): MealPlanEntry {
  return {
    id: 'e1',
    date: '2026-05-11',
    recipeId: 'r1',
    createdAt: null,
    createdBy: 'u1',
    ...overrides,
  }
}

describe('ShoppingListSheet', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders "BOODSCHAPPENLIJST" heading', () => {
    vi.mocked(fetchEntriesWithRecipes).mockResolvedValue({ entries: [], recipeMap: new Map() })
    setup()
    expect(screen.getByText('BOODSCHAPPENLIJST')).toBeInTheDocument()
  })

  it('renders "Wat we" text', () => {
    vi.mocked(fetchEntriesWithRecipes).mockResolvedValue({ entries: [], recipeMap: new Map() })
    setup()
    expect(screen.getByText(/Wat we/)).toBeInTheDocument()
  })

  it('renders "nodig hebben" text', () => {
    vi.mocked(fetchEntriesWithRecipes).mockResolvedValue({ entries: [], recipeMap: new Map() })
    setup()
    expect(screen.getByText('nodig hebben')).toBeInTheDocument()
  })

  it('renders "VAN" label for first DatePickerInput', () => {
    vi.mocked(fetchEntriesWithRecipes).mockResolvedValue({ entries: [], recipeMap: new Map() })
    setup()
    expect(screen.getByText('VAN')).toBeInTheDocument()
  })

  it('renders "TOT" label for second DatePickerInput', () => {
    vi.mocked(fetchEntriesWithRecipes).mockResolvedValue({ entries: [], recipeMap: new Map() })
    setup()
    expect(screen.getByText('TOT')).toBeInTheDocument()
  })

  it('shows empty state message when fetched with no sections', async () => {
    vi.mocked(fetchEntriesWithRecipes).mockResolvedValue({ entries: [], recipeMap: new Map() })
    setup()
    await waitFor(() => {
      expect(screen.getByText('Geen geplande recepten in deze periode.')).toBeInTheDocument()
    })
  })

  it('renders section label and ingredient when fetched with sections', async () => {
    const recipe = makeRecipe()
    const entry = makeEntry()
    const recipeMap = new Map<string, Recipe>([['r1', recipe]])
    vi.mocked(fetchEntriesWithRecipes).mockResolvedValue({ entries: [entry], recipeMap })
    setup()
    await waitFor(() => {
      expect(screen.getByText('Stamppot')).toBeInTheDocument()
    })
    expect(screen.getByText('200g aardappelen')).toBeInTheDocument()
  })

  it('shows CopyButton (Kopieer text) when fetched with sections', async () => {
    const recipe = makeRecipe()
    const entry = makeEntry()
    const recipeMap = new Map<string, Recipe>([['r1', recipe]])
    vi.mocked(fetchEntriesWithRecipes).mockResolvedValue({ entries: [entry], recipeMap })
    setup()
    await waitFor(() => {
      expect(screen.getByText('Kopieer')).toBeInTheDocument()
    })
  })
})
