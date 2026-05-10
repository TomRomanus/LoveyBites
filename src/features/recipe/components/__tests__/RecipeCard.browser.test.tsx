import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import RecipeCard from '../RecipeCard'
import type { Recipe } from '@/features/recipe/types/recipe'

vi.mock('framer-motion', () => import('@/test/mocks/framer-motion'))

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
  const defaults: Props = {
    recipe: BASE_RECIPE,
    variant: 'default',
  }
  const props = { ...defaults, ...overrides }
  return render(
    <MemoryRouter>
      <RecipeCard {...props} />
    </MemoryRouter>,
  )
}

describe('RecipeCard — default variant', () => {
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
})

describe('RecipeCard — feature variant', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows "UITGELICHT" label', () => {
    setup({ variant: 'feature' })
    expect(screen.getByText('UITGELICHT')).toBeInTheDocument()
  })

  it('shows the recipe title', () => {
    setup({ variant: 'feature' })
    expect(screen.getAllByText('Pasta Bolognese').length).toBeGreaterThanOrEqual(1)
  })

  it('shows all recipe tags', () => {
    setup({ variant: 'feature' })
    expect(screen.getByText('italiaans')).toBeInTheDocument()
    expect(screen.getByText('pasta')).toBeInTheDocument()
  })

  it('renders a calendar button when onAddToCalendar is provided', () => {
    setup({ variant: 'feature', onAddToCalendar: vi.fn() })
    expect(screen.getByRole('button', { name: /kalender/i })).toBeInTheDocument()
  })

  it('calls onAddToCalendar with the recipe when the calendar button is clicked', async () => {
    const onAddToCalendar = vi.fn()
    setup({ variant: 'feature', onAddToCalendar })
    await userEvent.click(screen.getByRole('button', { name: /kalender/i }))
    expect(onAddToCalendar).toHaveBeenCalledWith(BASE_RECIPE)
  })
})
