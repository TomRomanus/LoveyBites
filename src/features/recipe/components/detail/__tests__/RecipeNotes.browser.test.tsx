import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import RecipeNotes from '../RecipeNotes'

const baseNotes = [
  { label: 'Bewaren', text: 'Tot 3 dagen in de koelkast.' },
  { label: 'Opwarmen', text: 'Op laag vuur verwarmen.' },
]

function setup(props: Partial<React.ComponentProps<typeof RecipeNotes>> = {}) {
  const defaults = { notes: baseNotes, deel: 'III' }
  return render(<RecipeNotes {...defaults} {...props} />)
}

describe('RecipeNotes', () => {
  describe('headings', () => {
    it('renders the "Notities" heading', () => {
      setup()
      expect(screen.getByRole('heading', { name: 'Notities' })).toBeInTheDocument()
    })

    it('renders the DEEL eyebrow from the deel prop', () => {
      setup({ deel: 'III' })
      expect(screen.getByText('DEEL III')).toBeInTheDocument()
    })

    it('renders DEEL IV when deel prop is "IV"', () => {
      setup({ deel: 'IV' })
      expect(screen.getByText('DEEL IV')).toBeInTheDocument()
    })
  })

  describe('note items', () => {
    it('renders each note label', () => {
      setup()
      expect(screen.getByText('Bewaren')).toBeInTheDocument()
      expect(screen.getByText('Opwarmen')).toBeInTheDocument()
    })

    it('renders each note text', () => {
      setup()
      expect(screen.getByText('Tot 3 dagen in de koelkast.')).toBeInTheDocument()
      expect(screen.getByText('Op laag vuur verwarmen.')).toBeInTheDocument()
    })

    it('renders one vertical bar per note', () => {
      const { container } = setup()
      expect(container.querySelectorAll('[data-note-bar]')).toHaveLength(2)
    })
  })
})
