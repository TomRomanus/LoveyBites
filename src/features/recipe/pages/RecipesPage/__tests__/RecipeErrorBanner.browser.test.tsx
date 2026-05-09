import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import RecipeErrorBanner from '../RecipeErrorBanner'

describe('RecipeErrorBanner', () => {
  it('renders the error message', () => {
    render(<RecipeErrorBanner message="Recepten konden niet worden geladen." />)
    expect(screen.getByText('Recepten konden niet worden geladen.')).toBeInTheDocument()
  })

  it('renders a different error message', () => {
    render(<RecipeErrorBanner message="Controleer je Firebase-configuratie." />)
    expect(screen.getByText('Controleer je Firebase-configuratie.')).toBeInTheDocument()
  })
})
