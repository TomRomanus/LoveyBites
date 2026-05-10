import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import AutoGrowTextarea from '../AutoGrowTextarea'

describe('AutoGrowTextarea', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders a textarea', () => {
    render(<AutoGrowTextarea />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('passes through value prop', () => {
    render(<AutoGrowTextarea value="recept tekst" onChange={vi.fn()} />)
    expect(screen.getByRole('textbox')).toHaveValue('recept tekst')
  })

  it('passes through placeholder prop', () => {
    render(<AutoGrowTextarea placeholder="Voer tekst in..." />)
    expect(screen.getByPlaceholderText('Voer tekst in...')).toBeInTheDocument()
  })

  it('passes through className prop', () => {
    render(<AutoGrowTextarea className="my-custom-class" />)
    expect(screen.getByRole('textbox')).toHaveClass('my-custom-class')
  })

  it('calls onChange when typing', async () => {
    const onChange = vi.fn()
    render(<AutoGrowTextarea onChange={onChange} />)
    await userEvent.type(screen.getByRole('textbox'), 'a')
    expect(onChange).toHaveBeenCalled()
  })

  it('has overflow hidden in style', () => {
    render(<AutoGrowTextarea />)
    expect(screen.getByRole('textbox')).toHaveStyle({ overflow: 'hidden' })
  })
})
