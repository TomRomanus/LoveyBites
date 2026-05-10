import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import RecipeEquipment from '../RecipeEquipment'

function setup(props: Partial<React.ComponentProps<typeof RecipeEquipment>> = {}) {
  const defaults = { equipment: ['Grote kom', 'Garde'], deel: 'I' }
  return render(<RecipeEquipment {...defaults} {...props} />)
}

describe('RecipeEquipment', () => {
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
