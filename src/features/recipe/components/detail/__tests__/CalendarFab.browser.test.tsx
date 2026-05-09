import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import CalendarFab from '../CalendarFab'

function setup(props: Partial<React.ComponentProps<typeof CalendarFab>> = {}) {
  const defaults = {
    visible: true,
    onClick: vi.fn(),
  }
  const merged = { ...defaults, ...props }
  return { ...render(<CalendarFab {...merged} />), onClick: merged.onClick }
}

describe('CalendarFab', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('when visible', () => {
    it('renders the FAB button', () => {
      setup()
      expect(screen.getByTestId('calendar-fab')).toBeInTheDocument()
    })

    it('calls onClick when clicked', async () => {
      const onClick = vi.fn()
      setup({ onClick })
      await userEvent.click(screen.getByTestId('calendar-fab'))
      expect(onClick).toHaveBeenCalledOnce()
    })

    it('renders into document.body via portal', () => {
      setup()
      // The FAB is portaled to body, so querying from document works
      expect(document.body.querySelector('[data-testid="calendar-fab"]')).toBeInTheDocument()
    })
  })

  describe('when not visible', () => {
    it('does not render the FAB button', () => {
      setup({ visible: false })
      expect(screen.queryByTestId('calendar-fab')).not.toBeInTheDocument()
    })
  })
})
