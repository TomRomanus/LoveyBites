import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { Timestamp } from 'firebase/firestore'
import RecipesPage from '../index'
import type { Recipe } from '@/features/recipe/types/recipe'
import type { MealPlanEntry } from '@/features/calendar/types/calendar'
import { getRecipes, getRecipe } from '@/features/recipe/api/recipes'
import { getMealPlanEntries } from '@/features/calendar/api/mealPlan'

vi.mock('@/features/recipe/api/recipes')
vi.mock('@/features/calendar/api/mealPlan')

const ts = { seconds: 0, nanoseconds: 0 } as unknown as Timestamp

const mockRecipes: Recipe[] = [
  {
    id: 'r1',
    title: 'Stamppot',
    description: 'Hollands',
    ingredients: [],
    steps: [],
    tags: ['vegetarisch'],
    imageUrl: '',
    rating: 3,
    createdAt: ts,
    updatedAt: ts,
    createdBy: 'u1',
  },
  {
    id: 'r2',
    title: 'Bitterballen',
    description: 'Borrelsnack',
    ingredients: [],
    steps: [],
    tags: [],
    imageUrl: '',
    rating: 5,
    createdAt: ts,
    updatedAt: ts,
    createdBy: 'u1',
  },
]

const mockEntry: MealPlanEntry = {
  id: 'e1',
  date: '2026-05-09',
  recipeId: 'r1',
  createdAt: null,
  createdBy: 'u1',
}

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

function setup() {
  return render(
    <QueryClientProvider client={makeQueryClient()}>
      <MemoryRouter initialEntries={['/']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<RecipesPage />} />
          <Route path="/new" element={<div>nieuw recept</div>} />
          <Route path="/recipe/:id" element={<div>recept detail</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('RecipesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getMealPlanEntries).mockResolvedValue([])
  })

  describe('static elements', () => {
    it('renders "Ons kookboek" title', () => {
      vi.mocked(getRecipes).mockResolvedValue([])
      setup()
      expect(screen.getByText('Ons kookboek')).toBeInTheDocument()
    })

    it('renders add-recipe link pointing to /new', () => {
      vi.mocked(getRecipes).mockResolvedValue([])
      setup()
      expect(screen.getByTitle('Recept toevoegen')).toHaveAttribute('href', '/new')
    })
  })

  describe('when recipes load', () => {
    it('renders each recipe title in the list', async () => {
      vi.mocked(getRecipes).mockResolvedValue(mockRecipes)
      setup()
      await waitFor(() => {
        expect(screen.getByText('Stamppot')).toBeInTheDocument()
        expect(screen.getByText('Bitterballen')).toBeInTheDocument()
      })
    })

    it('shows the recipe count in the search bar', async () => {
      vi.mocked(getRecipes).mockResolvedValue(mockRecipes)
      const { container } = setup()
      await waitFor(() => {
        const eyebrow = container.querySelector('.lb-eyebrow')
        expect(eyebrow).toHaveTextContent('2')
        expect(eyebrow).toHaveTextContent('RECEPTEN')
      })
    })

    it('renders one recipe card per recipe', async () => {
      vi.mocked(getRecipes).mockResolvedValue(mockRecipes)
      setup()
      await waitFor(() => {
        expect(screen.getAllByTestId('recipe-list-item')).toHaveLength(2)
      })
    })
  })

  describe('when fetch fails', () => {
    it('shows the Dutch error banner', async () => {
      vi.mocked(getRecipes).mockRejectedValue(new Error('network'))
      setup()
      await waitFor(() => {
        expect(screen.getByText(/recepten konden niet worden geladen/i)).toBeInTheDocument()
      })
    })

    it('does not render the search bar', async () => {
      vi.mocked(getRecipes).mockRejectedValue(new Error('network'))
      setup()
      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Zoek recept of ingrediënt')).not.toBeInTheDocument()
      })
    })
  })

  describe('when no recipes exist', () => {
    it('shows "Je boek is nog leeg"', async () => {
      vi.mocked(getRecipes).mockResolvedValue([])
      setup()
      await waitFor(() => {
        expect(screen.getByText('Je boek is nog leeg')).toBeInTheDocument()
      })
    })

    it('shows "Eerste recept toevoegen" button', async () => {
      vi.mocked(getRecipes).mockResolvedValue([])
      setup()
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /eerste recept toevoegen/i })).toBeInTheDocument()
      })
    })
  })

  describe("today's menu section", () => {
    it('shows "Op het menu vandaag" and recipe title when planned', async () => {
      vi.mocked(getRecipes).mockResolvedValue([])
      vi.mocked(getMealPlanEntries).mockResolvedValue([mockEntry])
      vi.mocked(getRecipe).mockResolvedValue(mockRecipes[0])
      setup()
      await waitFor(() => {
        expect(screen.getByText('Op het menu vandaag')).toBeInTheDocument()
        expect(screen.getByText('Stamppot')).toBeInTheDocument()
      })
    })

    it('hides "Op het menu vandaag" when nothing is planned today', async () => {
      vi.mocked(getRecipes).mockResolvedValue([])
      vi.mocked(getMealPlanEntries).mockResolvedValue([])
      setup()
      await waitFor(() => {
        expect(screen.queryByText('Op het menu vandaag')).not.toBeInTheDocument()
      })
    })
  })
})
