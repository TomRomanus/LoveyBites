import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import TagChip from '../TagChip'

describe('TagChip', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the label text', () => {
    render(<TagChip label="pasta" active={false} />)
    expect(screen.getByText('pasta')).toBeInTheDocument()
  })

  it('renders as a button', () => {
    render(<TagChip label="pasta" active={false} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('has data-active="false" when not active', () => {
    render(<TagChip label="pasta" active={false} />)
    expect(screen.getByRole('button')).toHaveAttribute('data-active', 'false')
  })

  it('has data-active="true" when active', () => {
    render(<TagChip label="pasta" active={true} />)
    expect(screen.getByRole('button')).toHaveAttribute('data-active', 'true')
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<TagChip label="pasta" active={false} onClick={onClick} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('does not call onClick when disabled', async () => {
    const onClick = vi.fn()
    render(<TagChip label="pasta" active={false} disabled onClick={onClick} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('applies cursor-not-allowed class when disabled', () => {
    const { container } = render(<TagChip label="pasta" active={false} disabled />)
    expect(container.querySelector('.cursor-not-allowed')).toBeInTheDocument()
  })

  it('applies cursor-pointer class when not disabled', () => {
    const { container } = render(<TagChip label="pasta" active={false} />)
    expect(container.querySelector('.cursor-pointer')).toBeInTheDocument()
  })

  it('applies the lb-tag class', () => {
    const { container } = render(<TagChip label="pasta" active={false} />)
    expect(container.querySelector('.lb-tag')).toBeInTheDocument()
  })
})
