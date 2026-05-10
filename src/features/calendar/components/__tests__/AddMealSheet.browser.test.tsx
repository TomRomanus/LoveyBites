import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AddMealSheet from '../AddMealSheet'
import { useAuth } from '@/features/auth/contexts/AuthContext'
import { getRecipes } from '@/features/recipe/api/recipes'

vi.mock('@/features/auth/contexts/AuthContext')
vi.mock('@/features/recipe/api/recipes')
vi.mock('@/features/calendar/api/mealPlan')

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

function setup(props: Partial<React.ComponentProps<typeof AddMealSheet>> = {}) {
  const defaults = {
    visible: true,
    date: '2026-05-11',
    existingRecipeIds: [] as string[],
    onClose: vi.fn(),
    onSaved: vi.fn(),
  }
  const merged = { ...defaults, ...props }
  return render(
    <QueryClientProvider client={makeQC()}>
      <MemoryRouter>
        <AddMealSheet {...merged} />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('AddMealSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      user: { uid: 'u1' } as any,
      loading: false,
      authError: null,
      signInWithGoogle: vi.fn(),
      signInWithEmail: vi.fn(),
      signUpWithEmail: vi.fn(),
      signOutUser: vi.fn(),
    })
    vi.mocked(getRecipes).mockResolvedValue([])
  })

  it('renders "Maaltijd toevoegen" heading', () => {
    setup()
    expect(screen.getByRole('heading', { name: /maaltijd toevoegen/i })).toBeInTheDocument()
  })

  it('shows the "Uit kookboek" tab option', () => {
    setup()
    expect(screen.getByText('Uit kookboek')).toBeInTheDocument()
  })

  it('shows the "Eigen tekst" tab option', () => {
    setup()
    expect(screen.getByText('Eigen tekst')).toBeInTheDocument()
  })

  it('shows "maandag" in the eyebrow for Monday', () => {
    setup()
    expect(screen.getByText(/maandag/i)).toBeInTheDocument()
  })

  it('shows month and day in eyebrow (mei 11)', () => {
    setup()
    // The eyebrow renders e.g. "maandag, mei 11"
    expect(screen.getByText(/mei/)).toBeInTheDocument()
    expect(screen.getByText(/11/)).toBeInTheDocument()
  })
})
