import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import RecipeIngredients from '../RecipeIngredients'

const defaultSections = [{ section: null, items: ['200g spaghetti', '75g pancetta'] }]

function setup(props: Partial<React.ComponentProps<typeof RecipeIngredients>> = {}) {
  const defaults = {
    sections: defaultSections,
    portions: 2,
    portionDir: null as 'up' | 'down' | null,
    onPortionChange: vi.fn(),
    checked: new Set<string>(),
    onToggle: vi.fn(),
  }
  return {
    ...render(<RecipeIngredients {...defaults} {...props} />),
    onToggle: props.onToggle ?? defaults.onToggle,
    onPortionChange: props.onPortionChange ?? defaults.onPortionChange,
  }
}

describe('RecipeIngredients', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('headings', () => {
    it('renders the "Ingrediënten" heading', () => {
      setup()
      expect(screen.getByRole('heading', { name: 'Ingrediënten' })).toBeInTheDocument()
    })

    it('renders the DEEL I eyebrow label by default', () => {
      setup()
      expect(screen.getByText('DEEL I')).toBeInTheDocument()
    })

    it('renders DEEL II when deel prop is "II"', () => {
      setup({ deel: 'II' })
      expect(screen.getByText('DEEL II')).toBeInTheDocument()
    })
  })

  describe('ingredient items', () => {
    it('renders each ingredient in the section', () => {
      setup()
      expect(screen.getByText('200g spaghetti')).toBeInTheDocument()
      expect(screen.getByText('75g pancetta')).toBeInTheDocument()
    })

    it('renders a section header when section name is provided', () => {
      setup({ sections: [{ section: 'Saus', items: ['100ml room'] }] })
      expect(screen.getByText('Saus')).toBeInTheDocument()
    })

    it('does not render a section header when section is null', () => {
      const { container } = setup({
        sections: [{ section: null, items: ['100ml room'] }],
      })
      const sectionHeaders = container.querySelectorAll('.font-serif.italic.text-\\[14px\\]')
      expect(sectionHeaders).toHaveLength(0)
    })

    it('calls onToggle with the item key when an ingredient is clicked', async () => {
      const onToggle = vi.fn()
      setup({ onToggle })
      await userEvent.click(screen.getByText('200g spaghetti'))
      expect(onToggle).toHaveBeenCalledWith('0-0')
    })
  })

  describe('portion stepper', () => {
    it('renders the current portion count', () => {
      setup({ portions: 4 })
      expect(screen.getByText('4')).toBeInTheDocument()
    })

    it('renders the default portion label', () => {
      setup()
      expect(screen.getByText('pers')).toBeInTheDocument()
    })

    it('renders a custom portionsLabel when provided', () => {
      setup({ portionsLabel: 'stuks' })
      expect(screen.getByText('stuks')).toBeInTheDocument()
    })

    it('calls onPortionChange when the plus button is clicked', async () => {
      const onPortionChange = vi.fn()
      setup({ portions: 2, onPortionChange })
      const buttons = screen.getAllByRole('button')
      // PortionStepper: first button = minus, second = plus; ingredient buttons follow
      await userEvent.click(buttons[1])
      expect(onPortionChange).toHaveBeenCalledWith(3)
    })

    it('calls onPortionChange when the minus button is clicked', async () => {
      const onPortionChange = vi.fn()
      setup({ portions: 2, onPortionChange })
      const buttons = screen.getAllByRole('button')
      await userEvent.click(buttons[0])
      expect(onPortionChange).toHaveBeenCalledWith(1)
    })

    it('does not go below 1 portion when minus is clicked at minimum', async () => {
      const onPortionChange = vi.fn()
      setup({ portions: 1, onPortionChange })
      const buttons = screen.getAllByRole('button')
      expect(buttons[0]).toBeDisabled()
      await userEvent.click(buttons[0])
      expect(onPortionChange).not.toHaveBeenCalled()
    })
  })
})
