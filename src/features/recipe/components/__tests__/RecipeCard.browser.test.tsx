import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import RecipeCard from '../RecipeCard'
import type { Recipe } from '@/features/recipe/types/recipe'


vi.mock('@/features/recipe/components/StarRating', () => ({
  StarRating: ({ value }: any) => <span data-testid="star-rating">{value}</span>,
}))

const BASE_RECIPE: Recipe = {
  id: 'r1',
  title: 'Pasta Bolognese',
  description: 'Lekker',
  ingredients: [],
  steps: [],
  tags: ['italiaans', 'pasta'],
  imageUrl: '',
  createdAt: null as any,
  updatedAt: null as any,
  createdBy: 'u1',
}

type Props = React.ComponentProps<typeof RecipeCard>

function setup(overrides: Partial<Props> = {}) {
  const props = { recipe: BASE_RECIPE, ...overrides }
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <RecipeCard {...props} />
    </MemoryRouter>,
  )
}

describe('RecipeCard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows the recipe title', () => {
    setup()
    expect(screen.getByText('Pasta Bolognese')).toBeInTheDocument()
  })

  it('shows the recipe description', () => {
    setup()
    expect(screen.getByText('Lekker')).toBeInTheDocument()
  })

  it('shows all recipe tags', () => {
    setup()
    expect(screen.getByText('italiaans')).toBeInTheDocument()
    expect(screen.getByText('pasta')).toBeInTheDocument()
  })

  it('links to /recipe/:id', () => {
    const { container } = setup()
    const link = container.querySelector('a')!
    expect(link.getAttribute('href')).toContain('/recipe/r1')
  })

  it('does not render a calendar button when onAddToCalendar is not provided', () => {
    setup()
    expect(screen.queryByRole('button', { name: /kalender/i })).not.toBeInTheDocument()
  })

  it('renders a calendar button when onAddToCalendar is provided', () => {
    setup({ onAddToCalendar: vi.fn() })
    expect(screen.getByRole('button', { name: /kalender/i })).toBeInTheDocument()
  })

  it('calls onAddToCalendar with the recipe when the calendar button is clicked', async () => {
    const onAddToCalendar = vi.fn()
    setup({ onAddToCalendar })
    await userEvent.click(screen.getByRole('button', { name: /kalender/i }))
    expect(onAddToCalendar).toHaveBeenCalledWith(BASE_RECIPE)
  })
})
