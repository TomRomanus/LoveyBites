import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import IngredientRow from '../IngredientRow'

type Props = React.ComponentProps<typeof IngredientRow>

function setup(overrides: Partial<Props> = {}) {
  const defaults: Props = {
    text: '200g spaghetti',
    isChecked: false,
    onToggle: vi.fn(),
  }
  const props = { ...defaults, ...overrides }
  return {
    ...render(<IngredientRow {...props} />),
    onToggle: props.onToggle as ReturnType<typeof vi.fn>,
  }
}

describe('IngredientRow', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('rendering', () => {
    it('renders the ingredient text', () => {
      setup({ text: '3 eieren' })
      expect(screen.getByText('3 eieren')).toBeInTheDocument()
    })

    it('renders as a button', () => {
      setup()
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  describe('click interaction', () => {
    it('calls onToggle when clicked', async () => {
      const onToggle = vi.fn()
      setup({ onToggle })
      await userEvent.click(screen.getByRole('button'))
      expect(onToggle).toHaveBeenCalledOnce()
    })

    it('calls onToggle with no arguments', async () => {
      const onToggle = vi.fn()
      setup({ onToggle })
      await userEvent.click(screen.getByRole('button'))
      expect(onToggle).toHaveBeenCalledWith()
    })
  })

  describe('light theme (default)', () => {
    it('applies text-ink class when unchecked', () => {
      const { container } = setup({ isChecked: false })
      expect(container.querySelector('.text-ink')).toBeInTheDocument()
    })

    it('applies text-stone class when checked', () => {
      const { container } = setup({ isChecked: true })
      expect(container.querySelector('.text-stone')).toBeInTheDocument()
    })

    it('applies opacity-50 class when checked', () => {
      const { container } = setup({ isChecked: true })
      expect(container.querySelector('.opacity-50')).toBeInTheDocument()
    })

    it('applies bottom border class by default', () => {
      const { container } = setup()
      const btn = container.querySelector('button')!
      expect(btn.className).toContain('border-b')
    })
  })

  describe('dark theme', () => {
    it('applies text-paper class when unchecked', () => {
      const { container } = setup({ theme: 'dark', isChecked: false })
      expect(container.querySelector('.text-paper')).toBeInTheDocument()
    })

    it('applies text-paper/40 class when checked', () => {
      const { container } = setup({ theme: 'dark', isChecked: true })
      expect(container.querySelector('.text-paper\\/40')).toBeInTheDocument()
    })
  })

  describe('noBorder prop', () => {
    it('does not have a border-b class when noBorder is true', () => {
      const { container } = setup({ noBorder: true })
      const btn = container.querySelector('button')!
      expect(btn.className).not.toContain('border-b')
    })
  })
})
