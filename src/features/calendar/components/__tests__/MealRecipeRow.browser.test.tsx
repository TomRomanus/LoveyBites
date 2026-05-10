import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import MealRecipeRow from '../MealRecipeRow'
import type { Recipe } from '@/features/recipe/types/recipe'

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

function setup(props: Partial<React.ComponentProps<typeof MealRecipeRow>> = {}) {
  const defaults = {
    recipe: makeRecipe(),
    selectedId: null as string | null,
    saving: false,
    onSelect: vi.fn(),
    index: 0,
  }
  const merged = { ...defaults, ...props }
  return { ...render(<MealRecipeRow {...merged} />), merged }
}

describe('MealRecipeRow', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders recipe title', () => {
    setup()
    expect(screen.getByText('Stamppot')).toBeInTheDocument()
  })

  it('renders tags when present', () => {
    setup({ recipe: makeRecipe({ tags: ['vegetarisch', 'snel'] }) })
    expect(screen.getByText('vegetarisch')).toBeInTheDocument()
    expect(screen.getByText('snel')).toBeInTheDocument()
  })

  it('does not render tag row when tags empty', () => {
    setup({ recipe: makeRecipe({ tags: [] }) })
    expect(screen.queryByText('vegetarisch')).not.toBeInTheDocument()
  })

  it('button calls onSelect with recipe.id when clicked', async () => {
    const onSelect = vi.fn()
    setup({ recipe: makeRecipe({ id: 'r42' }), onSelect })
    await userEvent.click(screen.getByRole('button'))
    expect(onSelect).toHaveBeenCalledWith('r42')
  })

  it('button is disabled when saving=true', () => {
    setup({ saving: true })
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('button is not disabled when saving=false', () => {
    setup({ saving: false })
    expect(screen.getByRole('button')).not.toBeDisabled()
  })
})
