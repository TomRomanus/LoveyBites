import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import RecipeSteps from '../RecipeSteps'

const baseSteps = [{ text: 'Kook de spaghetti al dente.' }, { text: 'Meng de eieren met kaas.' }]

function setup(props: Partial<React.ComponentProps<typeof RecipeSteps>> = {}) {
  const defaults = {
    steps: baseSteps,
    ingredientMap: new Map<string, string>(),
  }
  return render(<RecipeSteps {...defaults} {...props} />)
}

describe('RecipeSteps', () => {
  describe('headings', () => {
    it('renders the "Instructies" heading', () => {
      setup()
      expect(screen.getByRole('heading', { name: 'Instructies' })).toBeInTheDocument()
    })

    it('renders the DEEL II eyebrow label by default', () => {
      setup()
      expect(screen.getByText('DEEL II')).toBeInTheDocument()
    })

    it('renders DEEL III when deel prop is "III"', () => {
      setup({ deel: 'III' })
      expect(screen.getByText('DEEL III')).toBeInTheDocument()
    })
  })

  describe('step numbers', () => {
    it('numbers the first step as 1', () => {
      setup()
      expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('numbers subsequent steps sequentially', () => {
      setup()
      expect(screen.getByText('2')).toBeInTheDocument()
    })
  })

  describe('step text', () => {
    it('renders each step text', () => {
      setup()
      expect(screen.getByText('Kook de spaghetti al dente.')).toBeInTheDocument()
      expect(screen.getByText('Meng de eieren met kaas.')).toBeInTheDocument()
    })
  })

  describe('phase headers', () => {
    it('renders a phase header when a phase is set', () => {
      setup({
        steps: [{ phase: 'Voorbereiding', text: 'Zet water op.' }],
      })
      expect(screen.getByText('Voorbereiding')).toBeInTheDocument()
    })

    it('does not repeat a phase header for consecutive steps in the same phase', () => {
      setup({
        steps: [
          { phase: 'Voorbereiding', text: 'Stap 1.' },
          { phase: 'Voorbereiding', text: 'Stap 2.' },
        ],
      })
      expect(screen.getAllByText('Voorbereiding')).toHaveLength(1)
    })

    it('shows a new phase header when the phase changes', () => {
      setup({
        steps: [
          { phase: 'Voorbereiding', text: 'Stap 1.' },
          { phase: 'Koken', text: 'Stap 2.' },
        ],
      })
      expect(screen.getByText('Voorbereiding')).toBeInTheDocument()
      expect(screen.getByText('Koken')).toBeInTheDocument()
    })
  })

  describe('comments', () => {
    it('renders comment text when a step has a comment', () => {
      setup({
        steps: [{ text: 'Bak de ui.', comment: 'Gebruik een brede pan' }],
      })
      expect(screen.getByText('Gebruik een brede pan')).toBeInTheDocument()
    })

    it('does not render comment markup when a step has no comment', () => {
      const { container } = setup()
      expect(container.querySelector('[data-comment]')).toBeNull()
    })
  })

  describe('ingredient refs', () => {
    it('renders ingredient ref labels resolved from the ingredientMap', () => {
      setup({
        steps: [{ text: 'Kook.', ingredientRefs: ['ing-001'] }],
        ingredientMap: new Map([['ing-001', 'spaghetti']]),
      })
      expect(screen.getByText('spaghetti')).toBeInTheDocument()
    })

    it('falls back to the raw id when the ingredientMap has no matching entry', () => {
      setup({
        steps: [{ text: 'Kook.', ingredientRefs: ['unknown-id'] }],
        ingredientMap: new Map(),
      })
      expect(screen.getByText('unknown-id')).toBeInTheDocument()
    })

    it('does not render the refs row when ingredientRefs is absent', () => {
      setup({ steps: [{ text: 'Kook de pasta.' }] })
      // The refs row uses font-mono text-[10px] — should not be in the DOM
      const { container } = setup({ steps: [{ text: 'Kook de pasta.' }] })
      expect(container.querySelector('.font-mono.text-bordeaux\\/55')).toBeNull()
    })
  })
})
