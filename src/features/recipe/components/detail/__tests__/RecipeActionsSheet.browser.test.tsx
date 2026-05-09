import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import RecipeActionsSheet from '../RecipeActionsSheet'

function setup(props: Partial<React.ComponentProps<typeof RecipeActionsSheet>> = {}) {
  const defaults = {
    visible: true,
    onEdit: vi.fn(),
    onDeleteRequest: vi.fn(),
    onClose: vi.fn(),
  }
  const merged = { ...defaults, ...props }
  return { ...render(<RecipeActionsSheet {...merged} />), merged }
}

describe('RecipeActionsSheet', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('when visible', () => {
    it('renders the edit button', () => {
      setup()
      expect(screen.getByRole('button', { name: /recept bewerken/i })).toBeInTheDocument()
    })

    it('renders the delete button', () => {
      setup()
      expect(screen.getByRole('button', { name: /recept verwijderen/i })).toBeInTheDocument()
    })

    it('calls onEdit when the edit button is clicked', async () => {
      const onEdit = vi.fn()
      setup({ onEdit })
      await userEvent.click(screen.getByRole('button', { name: /recept bewerken/i }))
      expect(onEdit).toHaveBeenCalledOnce()
    })

    it('calls onDeleteRequest when the delete button is clicked', async () => {
      const onDeleteRequest = vi.fn()
      setup({ onDeleteRequest })
      await userEvent.click(screen.getByRole('button', { name: /recept verwijderen/i }))
      expect(onDeleteRequest).toHaveBeenCalledOnce()
    })
  })

  describe('when not visible', () => {
    it('does not render the edit button', () => {
      setup({ visible: false })
      expect(screen.queryByRole('button', { name: /recept bewerken/i })).not.toBeInTheDocument()
    })

    it('does not render the delete button', () => {
      setup({ visible: false })
      expect(screen.queryByRole('button', { name: /recept verwijderen/i })).not.toBeInTheDocument()
    })
  })
})
