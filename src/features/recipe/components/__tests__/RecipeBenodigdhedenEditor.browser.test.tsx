import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import RecipeBenodigdhedenEditor from '../RecipeBenodigdhedenEditor'

function setup(overrides: Partial<React.ComponentProps<typeof RecipeBenodigdhedenEditor>> = {}) {
  const onChange = vi.fn()
  const props = { benodigdheden: [], onChange, ...overrides }
  return { ...render(<RecipeBenodigdhedenEditor {...props} />), onChange }
}

describe('RecipeBenodigdhedenEditor', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('empty state', () => {
    it('renders the add button', () => {
      setup()
      expect(screen.getByRole('button', { name: /benodigdheid toevoegen/i })).toBeInTheDocument()
    })
  })

  describe('adding items', () => {
    it('add button calls onChange with an empty string appended', async () => {
      const { onChange } = setup()
      await userEvent.click(screen.getByRole('button', { name: /benodigdheid toevoegen/i }))
      expect(onChange).toHaveBeenCalledWith([''])
    })

    it('appends to existing items', async () => {
      const { onChange } = setup({ benodigdheden: ['Grote kom'] })
      await userEvent.click(screen.getByRole('button', { name: /benodigdheid toevoegen/i }))
      expect(onChange).toHaveBeenCalledWith(['Grote kom', ''])
    })
  })

  describe('existing items', () => {
    const benodigdheden = ['Grote kom', 'Garde']

    it('renders an input for each item', () => {
      setup({ benodigdheden })
      expect(screen.getByDisplayValue('Grote kom')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Garde')).toBeInTheDocument()
    })

    it('text change calls onChange with updated item', () => {
      const { onChange } = setup({ benodigdheden })
      fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: 'Kleine kom' } })
      expect(onChange).toHaveBeenCalledWith(['Kleine kom', 'Garde'])
    })

    it('X button removes that item', async () => {
      const { onChange } = setup({ benodigdheden })
      const removeBtns = screen.getAllByRole('button', { name: /verwijder benodigdheid/i })
      await userEvent.click(removeBtns[0])
      expect(onChange).toHaveBeenCalledWith(['Garde'])
    })
  })
})
