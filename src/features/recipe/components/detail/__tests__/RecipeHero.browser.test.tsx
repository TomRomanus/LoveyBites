import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import RecipeHero from '../RecipeHero'

function setup(props: Partial<React.ComponentProps<typeof RecipeHero>> = {}) {
  const defaults = {
    title: 'Pasta Carbonara',
    onBack: vi.fn(),
    onActionsOpen: vi.fn(),
  }
  const merged = { ...defaults, ...props }
  return { ...render(<RecipeHero {...merged} />), merged }
}

describe('RecipeHero', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('content', () => {
    it('renders the recipe title', () => {
      setup({ title: 'Stamppot met worst' })
      expect(screen.getByText('Stamppot met worst')).toBeInTheDocument()
    })

    it('renders the RECEPT label', () => {
      setup()
      expect(screen.getByText('RECEPT')).toBeInTheDocument()
    })
  })

  describe('back button', () => {
    it('renders the back button', () => {
      setup()
      expect(screen.getByTestId('recipe-back-btn')).toBeInTheDocument()
    })

    it('calls onBack when clicked', async () => {
      const onBack = vi.fn()
      setup({ onBack })
      await userEvent.click(screen.getByTestId('recipe-back-btn'))
      expect(onBack).toHaveBeenCalledOnce()
    })
  })

  describe('actions button', () => {
    it('renders the actions button', () => {
      setup()
      expect(screen.getByTestId('recipe-actions-btn')).toBeInTheDocument()
    })

    it('calls onActionsOpen when clicked', async () => {
      const onActionsOpen = vi.fn()
      setup({ onActionsOpen })
      await userEvent.click(screen.getByTestId('recipe-actions-btn'))
      expect(onActionsOpen).toHaveBeenCalledOnce()
    })
  })
})
