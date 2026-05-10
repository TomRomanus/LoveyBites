import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import RecipeBenodigdheden from '../RecipeBenodigdheden'

function setup(props: Partial<React.ComponentProps<typeof RecipeBenodigdheden>> = {}) {
  const defaults = { benodigdheden: ['Grote kom', 'Garde'], deel: 'I' }
  return render(<RecipeBenodigdheden {...defaults} {...props} />)
}

describe('RecipeBenodigdheden', () => {
  describe('headings', () => {
    it('renders the "Benodigdheden" heading', () => {
      setup()
      expect(screen.getByRole('heading', { name: 'Benodigdheden' })).toBeInTheDocument()
    })

    it('renders the DEEL eyebrow from the deel prop', () => {
      setup({ deel: 'I' })
      expect(screen.getByText('DEEL I')).toBeInTheDocument()
    })

    it('renders DEEL II when deel prop is "II"', () => {
      setup({ deel: 'II' })
      expect(screen.getByText('DEEL II')).toBeInTheDocument()
    })
  })

  describe('items', () => {
    it('renders each item', () => {
      setup()
      expect(screen.getByText('Grote kom')).toBeInTheDocument()
      expect(screen.getByText('Garde')).toBeInTheDocument()
    })
  })
})
