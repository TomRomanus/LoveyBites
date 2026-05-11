import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import ShoppingSection from '../ShoppingSection'

function setup(props: Partial<React.ComponentProps<typeof ShoppingSection>> = {}) {
  const defaults = {
    label: 'Stamppot',
    days: ['2026-05-11', '2026-05-12'],
    ingredients: ['200g aardappelen', '100g gehakt'],
    checkedKeys: new Set<string>(),
    sectionIndex: 0,
    onToggle: vi.fn(),
  }
  const merged = { ...defaults, ...props }
  return { ...render(<ShoppingSection {...merged} />), merged }
}

describe('ShoppingSection', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the recipe label text', () => {
    setup()
    expect(screen.getByText('Stamppot')).toBeInTheDocument()
  })

  it('renders days separated by dots', () => {
    setup()
    expect(screen.getByText('2026-05-11 · 2026-05-12')).toBeInTheDocument()
  })

  it('renders each ingredient', () => {
    setup()
    expect(screen.getByText('200g aardappelen')).toBeInTheDocument()
    expect(screen.getByText('100g gehakt')).toBeInTheDocument()
  })

  it('clicking an ingredient row calls onToggle with the correct key', async () => {
    const onToggle = vi.fn()
    setup({ onToggle, sectionIndex: 0 })
    // First ingredient is index 0, so key = "0-0"
    const buttons = screen.getAllByRole('button')
    await userEvent.click(buttons[0])
    expect(onToggle).toHaveBeenCalledWith('0-0')
  })

  it('clicking the second ingredient row calls onToggle with key "0-1"', async () => {
    const onToggle = vi.fn()
    setup({ onToggle, sectionIndex: 0 })
    const buttons = screen.getAllByRole('button')
    await userEvent.click(buttons[1])
    expect(onToggle).toHaveBeenCalledWith('0-1')
  })

  it('uses sectionIndex in the key when calling onToggle', async () => {
    const onToggle = vi.fn()
    setup({ onToggle, sectionIndex: 2 })
    const buttons = screen.getAllByRole('button')
    await userEvent.click(buttons[0])
    expect(onToggle).toHaveBeenCalledWith('2-0')
  })

  it('ingredient row is checked when key is in checkedKeys', () => {
    setup({ checkedKeys: new Set(['0-0']) })
    // The checked state applies opacity-50 class on the flex-1 span
    const firstBtn = screen.getAllByRole('button')[0]
    const styledSpan = firstBtn.querySelector('span.flex-1')
    expect(styledSpan?.className).toContain('opacity-50')
  })

  it('ingredient row is unchecked when key is not in checkedKeys', () => {
    setup({ checkedKeys: new Set() })
    const firstBtn = screen.getAllByRole('button')[0]
    const styledSpan = firstBtn.querySelector('span.flex-1')
    expect(styledSpan?.className).not.toContain('opacity-50')
  })
})
