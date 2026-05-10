import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import ShoppingIngredientRow from '../ShoppingIngredientRow'

function setup(props: Partial<React.ComponentProps<typeof ShoppingIngredientRow>> = {}) {
  const defaults = { text: '200g bloem', checked: false, onToggle: vi.fn() }
  const merged = { ...defaults, ...props }
  return { ...render(<ShoppingIngredientRow {...merged} />), merged }
}

describe('ShoppingIngredientRow', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the ingredient text', () => {
    setup()
    expect(screen.getByText('200g bloem')).toBeInTheDocument()
  })

  it('renders as a button', () => {
    setup()
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('clicking calls onToggle', async () => {
    const onToggle = vi.fn()
    setup({ onToggle })
    await userEvent.click(screen.getByRole('button'))
    expect(onToggle).toHaveBeenCalledOnce()
  })

  describe('unchecked state', () => {
    it('text has full opacity when checked=false', () => {
      setup({ checked: false })
      // The outer flex-1 span carries the inline style with opacity
      const btn = screen.getByRole('button')
      const styledSpan = btn.querySelector('span.flex-1')
      expect(styledSpan).toHaveStyle({ opacity: '1' })
    })
  })

  describe('checked state', () => {
    it('text has reduced opacity when checked=true', () => {
      setup({ checked: true })
      const btn = screen.getByRole('button')
      const styledSpan = btn.querySelector('span.flex-1')
      expect(styledSpan).toHaveStyle({ opacity: '0.5' })
    })
  })

  it('calls onToggle when using fireEvent.click for internal state changes', () => {
    const onToggle = vi.fn()
    setup({ onToggle })
    fireEvent.click(screen.getByRole('button'))
    expect(onToggle).toHaveBeenCalledOnce()
  })
})
