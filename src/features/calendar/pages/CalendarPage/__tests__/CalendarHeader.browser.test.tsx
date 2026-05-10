import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import CalendarHeader from '../CalendarHeader'

const MONDAY = new Date('2026-05-11T00:00:00.000Z')

type Props = React.ComponentProps<typeof CalendarHeader>

function setup(props: Partial<Props> = {}) {
  const defaults: Props = {
    view: 'week',
    anchor: MONDAY,
    navDir: 0,
    onShoppingOpen: vi.fn(),
  }
  const merged = { ...defaults, ...props }
  return { ...render(<CalendarHeader {...merged} />), merged }
}

describe('CalendarHeader', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders "HET MENU" eyebrow text', () => {
    setup()
    expect(screen.getByText('HET MENU')).toBeInTheDocument()
  })

  describe('week mode', () => {
    it('renders "Week van" text', () => {
      setup({ view: 'week' })
      expect(screen.getByText(/Week van/)).toBeInTheDocument()
    })

    it('renders the short month name for the anchor', () => {
      setup({ view: 'week', anchor: MONDAY })
      expect(screen.getByText('mei')).toBeInTheDocument()
    })

    it('renders the anchor day number', () => {
      setup({ view: 'week', anchor: MONDAY })
      expect(screen.getByText('11')).toBeInTheDocument()
    })
  })

  describe('month mode', () => {
    it('renders the full month name for the anchor', () => {
      setup({ view: 'month', anchor: MONDAY })
      expect(screen.getByText('mei')).toBeInTheDocument()
    })

    it('renders the year for the anchor', () => {
      setup({ view: 'month', anchor: MONDAY })
      expect(screen.getByText('2026')).toBeInTheDocument()
    })
  })

  describe('shopping button', () => {
    it('renders the shopping list button', () => {
      setup()
      expect(screen.getByTestId('shopping-list-btn')).toBeInTheDocument()
    })

    it('calls onShoppingOpen when the shopping button is clicked', async () => {
      const onShoppingOpen = vi.fn()
      setup({ onShoppingOpen })
      await userEvent.click(screen.getByTestId('shopping-list-btn'))
      expect(onShoppingOpen).toHaveBeenCalledOnce()
    })
  })
})
