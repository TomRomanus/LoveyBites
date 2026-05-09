import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import DeleteConfirmDialog from '../DeleteConfirmDialog'

function setup(props: Partial<React.ComponentProps<typeof DeleteConfirmDialog>> = {}) {
  const defaults = {
    visible: true,
    recipeTitle: 'Pasta Carbonara',
    deleting: false,
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  }
  const merged = { ...defaults, ...props }
  return { ...render(<DeleteConfirmDialog {...merged} />), merged }
}

describe('DeleteConfirmDialog', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('when visible', () => {
    it('renders the Dutch confirmation question', () => {
      setup()
      expect(screen.getByText('Dit recept verwijderen?')).toBeInTheDocument()
    })

    it('shows the recipe title in the body text', () => {
      setup({ recipeTitle: 'Stamppot met worst' })
      expect(screen.getByText(/Stamppot met worst/)).toBeInTheDocument()
    })

    it('renders the cancel button', () => {
      setup()
      expect(screen.getByRole('button', { name: 'Annuleren' })).toBeInTheDocument()
    })

    it('renders the confirm button', () => {
      setup()
      expect(screen.getByRole('button', { name: 'Verwijderen' })).toBeInTheDocument()
    })

    it('calls onCancel when cancel button is clicked', async () => {
      const onCancel = vi.fn()
      setup({ onCancel })
      await userEvent.click(screen.getByRole('button', { name: 'Annuleren' }))
      expect(onCancel).toHaveBeenCalledOnce()
    })

    it('calls onConfirm when confirm button is clicked', async () => {
      const onConfirm = vi.fn()
      setup({ onConfirm })
      await userEvent.click(screen.getByRole('button', { name: 'Verwijderen' }))
      expect(onConfirm).toHaveBeenCalledOnce()
    })
  })

  describe('deleting state', () => {
    it('disables the confirm button while deleting', () => {
      setup({ deleting: true })
      // Dialog portals to body; button contains a spinner so has no accessible text
      const confirmBtn = document.body.querySelector('.lb-btn--primary')
      expect(confirmBtn).toBeDisabled()
    })

    it('renders a spinner instead of the label while deleting', () => {
      setup({ deleting: true })
      // Dialog portals to body
      expect(document.body.querySelector('.lb-spinner')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Verwijderen' })).not.toBeInTheDocument()
    })

    it('enables the confirm button when not deleting', () => {
      setup({ deleting: false })
      expect(screen.getByRole('button', { name: 'Verwijderen' })).not.toBeDisabled()
    })
  })

  describe('when not visible', () => {
    it('does not render the confirmation question', () => {
      setup({ visible: false })
      expect(screen.queryByText('Dit recept verwijderen?')).not.toBeInTheDocument()
    })

    it('does not render the cancel or confirm buttons', () => {
      setup({ visible: false })
      expect(screen.queryByRole('button', { name: 'Annuleren' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Verwijderen' })).not.toBeInTheDocument()
    })
  })
})
