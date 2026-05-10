import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import CookingHeader from '../CookingHeader'

function setup(onClose = vi.fn()) {
  return { ...render(<CookingHeader onClose={onClose} />), onClose }
}

describe('CookingHeader', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the "Kookmodus" title', () => {
    setup()
    expect(screen.getByText('Kookmodus')).toBeInTheDocument()
  })

  it('renders a close button', () => {
    setup()
    expect(screen.getByTestId('cooking-close-btn')).toBeInTheDocument()
  })

  it('calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn()
    setup(onClose)
    await userEvent.click(screen.getByTestId('cooking-close-btn'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('does not call onClose before the button is clicked', () => {
    const onClose = vi.fn()
    setup(onClose)
    expect(onClose).not.toHaveBeenCalled()
  })
})
