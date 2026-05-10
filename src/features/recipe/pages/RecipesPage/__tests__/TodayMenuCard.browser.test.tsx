import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import TodayMenuCard from '../TodayMenuCard'

type Recipe = React.ComponentProps<typeof TodayMenuCard>['recipe']

function setup(recipe: Partial<Recipe> = {}) {
  const defaults: Recipe = { id: 'r1', title: 'Stamppot', description: 'Heerlijk', rating: 4 }
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <TodayMenuCard recipe={{ ...defaults, ...recipe }} />
    </MemoryRouter>,
  )
}

describe('TodayMenuCard', () => {
  it('renders the recipe title', () => {
    setup({ title: 'Spaghetti Bolognese' })
    expect(screen.getByText('Spaghetti Bolognese')).toBeInTheDocument()
  })

  it('links to the recipe detail page', () => {
    setup({ id: 'abc123' })
    expect(screen.getByRole('link')).toHaveAttribute('href', '/recipe/abc123')
  })

  it('renders the recipe description when provided', () => {
    setup({ description: 'Een klassiek Italiaans gerecht.' })
    expect(screen.getByText('Een klassiek Italiaans gerecht.')).toBeInTheDocument()
  })

  it('does not render a description paragraph when absent', () => {
    const { container } = setup({ description: undefined })
    expect(container.querySelector('p')).toBeNull()
  })
})
