import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import IngredientItem from '../IngredientItem'

function setup(props: Partial<React.ComponentProps<typeof IngredientItem>> = {}) {
  const defaults = {
    item: '200g spaghetti',
    itemKey: '0-0',
    portions: 2,
    portionDir: null as 'up' | 'down' | null,
    checked: false,
    onToggle: vi.fn(),
  }
  const merged = { ...defaults, ...props }
  return { ...render(<IngredientItem {...merged} />), onToggle: merged.onToggle }
}

describe('IngredientItem', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('content', () => {
    it('renders the ingredient text', () => {
      setup({ item: '3 eieren' })
      expect(screen.getByText('3 eieren')).toBeInTheDocument()
    })
  })

  describe('toggle interaction', () => {
    it('calls onToggle with the itemKey when clicked', async () => {
      const onToggle = vi.fn()
      setup({ onToggle, itemKey: '1-2' })
      await userEvent.click(screen.getByText('200g spaghetti'))
      expect(onToggle).toHaveBeenCalledWith('1-2')
    })

    it('calls onToggle once per click', async () => {
      const onToggle = vi.fn()
      setup({ onToggle })
      await userEvent.click(screen.getByText('200g spaghetti'))
      expect(onToggle).toHaveBeenCalledOnce()
    })
  })

  describe('checked state', () => {
    it('renders the item without reduced opacity when unchecked', () => {
      const { container } = setup({ checked: false })
      const span = container.querySelector('.opacity-100')
      expect(span).toBeInTheDocument()
    })

    it('renders the item with reduced opacity when checked', () => {
      const { container } = setup({ checked: true })
      const span = container.querySelector('.opacity-50')
      expect(span).toBeInTheDocument()
    })

    it('applies text-stone class when checked', () => {
      const { container } = setup({ checked: true })
      const span = container.querySelector('.text-stone')
      expect(span).toBeInTheDocument()
    })

    it('applies text-ink class when unchecked', () => {
      const { container } = setup({ checked: false })
      const span = container.querySelector('.text-ink')
      expect(span).toBeInTheDocument()
    })
  })
})
