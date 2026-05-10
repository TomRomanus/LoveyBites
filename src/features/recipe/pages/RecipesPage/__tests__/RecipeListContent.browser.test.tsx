import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import RecipeListContent from '../RecipeListContent'
import type { Recipe } from '@/features/recipe/types/recipe'


vi.mock('@/features/recipe/components/RecipeCard', () => ({
  default: ({ recipe, onAddToCalendar }: any) => (
    <div data-testid="recipe-card" data-id={recipe.id} onClick={() => onAddToCalendar?.(recipe)}>
      {recipe.title}
    </div>
  ),
}))

const makeRecipe = (id: string, title: string): Recipe => ({
  id,
  title,
  description: '',
  ingredients: [],
  steps: [],
  tags: [],
  imageUrl: '',
  createdAt: null as any,
  updatedAt: null as any,
  createdBy: 'u1',
})

const RECIPES = [makeRecipe('r1', 'Pasta'), makeRecipe('r2', 'Soep'), makeRecipe('r3', 'Salade')]

type Props = React.ComponentProps<typeof RecipeListContent>

function setup(overrides: Partial<Props> = {}) {
  const defaults: Props = {
    recipes: RECIPES,
    activeTags: [],
    onAddToCalendar: vi.fn(),
  }
  const props = { ...defaults, ...overrides }
  return {
    ...render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <RecipeListContent {...props} />
      </MemoryRouter>,
    ),
    onAddToCalendar: props.onAddToCalendar,
  }
}

describe('RecipeListContent', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders a card for each recipe', () => {
    setup()
    expect(screen.getAllByTestId('recipe-card')).toHaveLength(3)
    expect(screen.getByText('Pasta')).toBeInTheDocument()
    expect(screen.getByText('Soep')).toBeInTheDocument()
    expect(screen.getByText('Salade')).toBeInTheDocument()
  })

  it('renders no cards when recipes is empty', () => {
    setup({ recipes: [] })
    expect(screen.queryAllByTestId('recipe-card')).toHaveLength(0)
  })

  it('calls onAddToCalendar with the recipe when a card is clicked', async () => {
    const onAddToCalendar = vi.fn()
    setup({ onAddToCalendar })
    await userEvent.click(screen.getByText('Soep'))
    expect(onAddToCalendar).toHaveBeenCalledWith(RECIPES[1])
  })
})
