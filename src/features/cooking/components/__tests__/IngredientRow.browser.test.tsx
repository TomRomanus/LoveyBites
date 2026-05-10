import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import IngredientRow, { type IngredientRowProps } from '../IngredientRow'

function setup(overrides: Partial<IngredientRowProps> = {}) {
  const defaults: IngredientRowProps = {
    text: '200g spaghetti',
    isChecked: false,
    itemKey: 'key-0',
    selectedPortions: 2,
    portionDir: null,
    onToggle: vi.fn(),
  }
  const props = { ...defaults, ...overrides }
  return { ...render(<IngredientRow {...props} />), onToggle: props.onToggle }
}

describe('IngredientRow', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('rendering', () => {
    it('renders the ingredient text', () => {
      setup({ text: '200g spaghetti' })
      expect(screen.getByText('200g spaghetti')).toBeInTheDocument()
    })

    it('renders as a button', () => {
      setup()
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('applies reduced opacity text class when checked', () => {
      const { container } = setup({ isChecked: true })
      const textSpan = container.querySelector('.text-paper\\/40')
      expect(textSpan).toBeInTheDocument()
    })

    it('applies full text class when not checked', () => {
      const { container } = setup({ isChecked: false })
      const textSpan = container.querySelector('.text-paper\\/40')
      expect(textSpan).not.toBeInTheDocument()
    })
  })

  describe('click interaction', () => {
    it('calls onToggle with the itemKey when clicked', async () => {
      const onToggle = vi.fn()
      setup({ itemKey: 'key-42', onToggle })
      await userEvent.click(screen.getByRole('button'))
      expect(onToggle).toHaveBeenCalledWith('key-42')
    })

    it('calls onToggle exactly once per click', async () => {
      const onToggle = vi.fn()
      setup({ onToggle })
      await userEvent.click(screen.getByRole('button'))
      expect(onToggle).toHaveBeenCalledOnce()
    })

    it('calls onToggle with different itemKeys for different rows', async () => {
      const onToggle = vi.fn()
      const { unmount } = render(
        <IngredientRow
          text="item A"
          isChecked={false}
          itemKey="key-a"
          selectedPortions={2}
          portionDir={null}
          onToggle={onToggle}
        />,
      )
      await userEvent.click(screen.getByRole('button'))
      expect(onToggle).toHaveBeenCalledWith('key-a')
      unmount()
    })
  })
})
