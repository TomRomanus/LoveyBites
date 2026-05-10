import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import RecipeEquipmentEditor from '../RecipeEquipmentEditor'

function setup(overrides: Partial<React.ComponentProps<typeof RecipeEquipmentEditor>> = {}) {
  const onChange = vi.fn()
  const props = { equipment: [], onChange, ...overrides }
  return { ...render(<RecipeEquipmentEditor {...props} />), onChange }
}

describe('RecipeEquipmentEditor', () => {
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
      const { onChange } = setup({ equipment: ['Grote kom'] })
      await userEvent.click(screen.getByRole('button', { name: /benodigdheid toevoegen/i }))
      expect(onChange).toHaveBeenCalledWith(['Grote kom', ''])
    })
  })

  describe('existing items', () => {
    const equipment = ['Grote kom', 'Garde']

    it('renders an input for each item', () => {
      setup({ equipment })
      expect(screen.getByDisplayValue('Grote kom')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Garde')).toBeInTheDocument()
    })

    it('text change calls onChange with updated item', () => {
      const { onChange } = setup({ equipment })
      fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: 'Kleine kom' } })
      expect(onChange).toHaveBeenCalledWith(['Kleine kom', 'Garde'])
    })

    it('X button removes that item', async () => {
      const { onChange } = setup({ equipment })
      const removeBtns = screen.getAllByRole('button', { name: /verwijder benodigdheid/i })
      await userEvent.click(removeBtns[0])
      expect(onChange).toHaveBeenCalledWith(['Garde'])
    })
  })
})
