import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import RecipeFormHeader from '../RecipeFormHeader'

type Props = React.ComponentProps<typeof RecipeFormHeader>

function setup(overrides: Partial<Props> = {}) {
  const defaults: Props = {
    isEdit: false,
    mode: null,
    saving: false,
    title: 'Recept',
    onBack: vi.fn(),
  }
  const props = { ...defaults, ...overrides }
  return {
    ...render(
      <MemoryRouter>
        <RecipeFormHeader {...props} />
      </MemoryRouter>
    ),
    onBack: props.onBack,
  }
}

describe('RecipeFormHeader', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('display', () => {
    it('shows the title text', () => {
      setup({ title: 'Nieuw recept' })
      expect(screen.getByText('Nieuw recept')).toBeInTheDocument()
    })

    it('renders a Link when mode is null and isEdit is false', () => {
      setup({ mode: null, isEdit: false })
      const closeEl = screen.getByTestId('form-close-btn')
      expect(closeEl.tagName).toBe('A')
      expect(closeEl).toHaveAttribute('href', '/')
    })

    it('renders a button when mode is set', () => {
      setup({ mode: 'url', isEdit: false })
      const closeEl = screen.getByTestId('form-close-btn')
      expect(closeEl.tagName).toBe('BUTTON')
    })

    it('renders a button when isEdit is true', () => {
      setup({ mode: null, isEdit: true })
      const closeEl = screen.getByTestId('form-close-btn')
      expect(closeEl.tagName).toBe('BUTTON')
    })

    it('does not render a submit button when isEdit is false', () => {
      setup({ isEdit: false })
      expect(screen.queryByRole('button', { name: /submit/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { hidden: false })).not.toBeInTheDocument()
    })

    it('renders an enabled submit button when isEdit is true and saving is false', () => {
      setup({ isEdit: true, saving: false })
      const buttons = screen.getAllByRole('button')
      const submitButton = buttons.find((b) => b.getAttribute('type') === 'submit')
      expect(submitButton).toBeInTheDocument()
      expect(submitButton).not.toBeDisabled()
    })

    it('renders a disabled submit button when isEdit is true and saving is true', () => {
      setup({ isEdit: true, saving: true })
      const buttons = screen.getAllByRole('button')
      const submitButton = buttons.find((b) => b.getAttribute('type') === 'submit')
      expect(submitButton).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })
  })

  describe('interactions', () => {
    it('calls onBack when close button is clicked with mode set', async () => {
      const onBack = vi.fn()
      setup({ mode: 'url', onBack })
      await userEvent.click(screen.getByTestId('form-close-btn'))
      expect(onBack).toHaveBeenCalledOnce()
    })

    it('calls onBack when close button is clicked with isEdit true', async () => {
      const onBack = vi.fn()
      setup({ isEdit: true, onBack })
      await userEvent.click(screen.getByTestId('form-close-btn'))
      expect(onBack).toHaveBeenCalledOnce()
    })
  })
})
