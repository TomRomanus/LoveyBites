import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type React from 'react'
import RecipeTabContent from '../RecipeTabContent'
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

function setup(props: Partial<React.ComponentProps<typeof RecipeTabContent>> = {}) {
  const searchRef = { current: null } as React.RefObject<HTMLInputElement>
  const defaults = {
    recipes: [] as Recipe[],
    search: '',
    onSearchChange: vi.fn(),
    onSelect: vi.fn(),
    selectedId: null as string | null,
    saving: false,
    searchRef,
  }
  const merged = { ...defaults, ...props }
  return { ...render(<RecipeTabContent {...merged} />), merged }
}

describe('RecipeTabContent', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders search input with placeholder "Zoek recept of ingrediënt"', () => {
    setup()
    expect(screen.getByPlaceholderText('Zoek recept of ingrediënt')).toBeInTheDocument()
  })

  it('shows "0 RECEPTEN" when recipes is empty', () => {
    setup({ recipes: [] })
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText(/RECEPTEN/)).toBeInTheDocument()
  })

  it('shows "1 RECEPT" (singular) when one recipe', () => {
    setup({ recipes: [makeRecipe()] })
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('RECEPT')).toBeInTheDocument()
  })

  it('shows "Geen recepten gevonden" when recipes is empty', () => {
    setup({ recipes: [] })
    expect(screen.getByText('Geen recepten gevonden')).toBeInTheDocument()
  })

  it('does NOT show "Geen recepten gevonden" when recipes present', () => {
    setup({ recipes: [makeRecipe()] })
    expect(screen.queryByText('Geen recepten gevonden')).not.toBeInTheDocument()
  })

  it('renders recipe titles for each recipe', () => {
    setup({
      recipes: [
        makeRecipe({ id: 'r1', title: 'Stamppot' }),
        makeRecipe({ id: 'r2', title: 'Erwtensoep' }),
      ],
    })
    expect(screen.getByText('Stamppot')).toBeInTheDocument()
    expect(screen.getByText('Erwtensoep')).toBeInTheDocument()
  })
})
