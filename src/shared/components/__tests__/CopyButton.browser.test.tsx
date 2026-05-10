import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import CopyButton from '../CopyButton'

type Props = React.ComponentProps<typeof CopyButton>

function setup(overrides: Partial<Props> = {}) {
  const defaults: Props = {
    onCopy: vi.fn().mockResolvedValue(undefined),
  }
  const props = { ...defaults, ...overrides }
  return { ...render(<CopyButton {...props} />), onCopy: props.onCopy }
}

describe('CopyButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('shows "Kopieer" text initially', () => {
      setup()
      expect(screen.getByText('Kopieer')).toBeInTheDocument()
    })

    it('button is clickable', () => {
      setup()
      expect(screen.getByRole('button')).not.toBeDisabled()
    })
  })

  describe('after clicking', () => {
    it('calls onCopy when clicked', async () => {
      const onCopy = vi.fn().mockResolvedValue(undefined)
      setup({ onCopy })
      await userEvent.click(screen.getByRole('button'))
      expect(onCopy).toHaveBeenCalledTimes(1)
    })

    it('shows "Gekopieerd!" after clicking', async () => {
      setup()
      await userEvent.click(screen.getByRole('button'))
      expect(screen.getByText('Gekopieerd!')).toBeInTheDocument()
    })

    it('reverts to "Kopieer" after 1500ms', async () => {
      // Intercept only the component's 1500ms revert timer so the test finishes
      // instantly. All other setTimeout calls (e.g. userEvent internals) pass
      // through to the real implementation so they don't hang.
      const origSetTimeout = window.setTimeout.bind(window)
      let revertFn: (() => void) | undefined
      vi.spyOn(window, 'setTimeout').mockImplementation((fn, delay, ...args) => {
        if (delay === 1500) {
          revertFn = fn as () => void
          return 0 as unknown as ReturnType<typeof setTimeout>
        }
        return origSetTimeout(fn, delay, ...args)
      })
      setup()
      await userEvent.click(screen.getByRole('button'))
      expect(screen.getByText('Gekopieerd!')).toBeInTheDocument()
      act(() => revertFn!())
      expect(screen.getByText('Kopieer')).toBeInTheDocument()
      vi.restoreAllMocks()
    })
  })
})
