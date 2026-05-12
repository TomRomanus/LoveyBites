import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import CookingCommentSheet from '../CookingCommentSheet'

type Props = React.ComponentProps<typeof CookingCommentSheet>

function setup(overrides: Partial<Props> = {}) {
  const defaults: Props = {
    open: true,
    stepNumber: 2,
    comment: undefined,
    onSave: vi.fn(),
    onDelete: vi.fn(),
    onClose: vi.fn(),
  }
  const props = { ...defaults, ...overrides }
  return { ...render(<CookingCommentSheet {...props} />), props }
}

describe('CookingCommentSheet', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('when closed', () => {
    it('renders nothing', () => {
      const { container } = setup({ open: false })
      expect(container).toBeEmptyDOMElement()
    })
  })

  describe('when open', () => {
    it('shows the step number label', () => {
      setup({ stepNumber: 3 })
      expect(screen.getByText('Stap 3')).toBeInTheDocument()
    })

    it('shows empty textarea when there is no comment', () => {
      setup({ comment: undefined })
      expect(screen.getByRole('textbox')).toHaveValue('')
    })

    it('prefills the textarea with an existing comment', () => {
      setup({ comment: 'Ca. 8 min voor al dente' })
      expect(screen.getByRole('textbox')).toHaveValue('Ca. 8 min voor al dente')
    })

    it('calls onDelete and onClose when the delete button is clicked', async () => {
      const onDelete = vi.fn()
      const onClose = vi.fn()
      setup({ comment: 'Notitie', onDelete, onClose })
      await userEvent.click(screen.getByRole('button', { name: /verwijderen/i }))
      expect(onDelete).toHaveBeenCalledOnce()
      expect(onClose).toHaveBeenCalledOnce()
    })

    it('calls onSave with the textarea value and onClose when the backdrop is clicked', async () => {
      const onSave = vi.fn()
      const onClose = vi.fn()
      setup({ comment: 'Bestaande tekst', onSave, onClose })
      await userEvent.click(screen.getByTestId('comment-backdrop'))
      expect(onSave).toHaveBeenCalledWith('Bestaande tekst')
      expect(onClose).toHaveBeenCalledOnce()
    })

    it('calls onSave with updated text after typing', async () => {
      const onSave = vi.fn()
      const onClose = vi.fn()
      setup({ comment: undefined, onSave, onClose })
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Nieuwe notitie' } })
      await userEvent.click(screen.getByTestId('comment-backdrop'))
      expect(onSave).toHaveBeenCalledWith('Nieuwe notitie')
    })

    it('resets textarea value to the comment prop when reopened', async () => {
      const { rerender } = setup({ open: false, comment: 'Oud' })
      rerender(
        <CookingCommentSheet
          open={true}
          stepNumber={1}
          comment="Oud"
          onSave={vi.fn()}
          onDelete={vi.fn()}
          onClose={vi.fn()}
        />,
      )
      expect(screen.getByRole('textbox')).toHaveValue('Oud')
    })
  })
})
