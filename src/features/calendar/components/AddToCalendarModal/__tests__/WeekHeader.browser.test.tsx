import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { WeekHeader } from '../WeekHeader'

function setup(props: Partial<React.ComponentProps<typeof WeekHeader>> = {}) {
  const defaults = {
    weekStart: new Date('2026-05-11'),
    weekDir: 'next' as const,
    weekLabel: '11–17 mei 2026',
    onPrevWeek: vi.fn(),
    onNextWeek: vi.fn(),
  }
  const merged = { ...defaults, ...props }
  return { ...render(<WeekHeader {...merged} />), merged }
}

describe('WeekHeader', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('label', () => {
    it('renders the week label', () => {
      setup({ weekLabel: '11–17 mei 2026' })
      expect(screen.getByText('11–17 mei 2026')).toBeInTheDocument()
    })
  })

  describe('navigation buttons', () => {
    it('calls onPrevWeek when the left button is clicked', async () => {
      const onPrevWeek = vi.fn()
      setup({ onPrevWeek })
      const buttons = screen.getAllByRole('button')
      await userEvent.click(buttons[0])
      expect(onPrevWeek).toHaveBeenCalledOnce()
    })

    it('calls onNextWeek when the right button is clicked', async () => {
      const onNextWeek = vi.fn()
      setup({ onNextWeek })
      const buttons = screen.getAllByRole('button')
      await userEvent.click(buttons[1])
      expect(onNextWeek).toHaveBeenCalledOnce()
    })

    it('renders exactly two navigation buttons', () => {
      setup()
      expect(screen.getAllByRole('button')).toHaveLength(2)
    })
  })
})
