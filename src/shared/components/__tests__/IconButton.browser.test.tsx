import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import IconButton from '../IconButton'

describe('IconButton', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders a button element', () => {
    render(<IconButton>X</IconButton>)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('renders children', () => {
    render(<IconButton>✕</IconButton>)
    expect(screen.getByText('✕')).toBeInTheDocument()
  })

  it('has type="button" by default', () => {
    render(<IconButton>X</IconButton>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })

  it('accepts type="submit"', () => {
    render(<IconButton type="submit">X</IconButton>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<IconButton onClick={onClick}>X</IconButton>)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('applies custom className', () => {
    const { container } = render(<IconButton className="bg-bordeaux text-cream">X</IconButton>)
    expect(container.querySelector('.bg-bordeaux')).toBeInTheDocument()
  })

  it('forwards data-testid', () => {
    render(<IconButton data-testid="my-icon-btn">X</IconButton>)
    expect(screen.getByTestId('my-icon-btn')).toBeInTheDocument()
  })

  it('applies the base size and shape classes', () => {
    const { container } = render(<IconButton>X</IconButton>)
    const btn = container.querySelector('button')!
    expect(btn.className).toContain('w-10')
    expect(btn.className).toContain('h-10')
    expect(btn.className).toContain('rounded-[20px]')
  })
})
