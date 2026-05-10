import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
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
    vi.useFakeTimers()
    vi.clearAllMocks()
  })
  afterEach(() => vi.useRealTimers())

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
      setup()
      await userEvent.click(screen.getByRole('button'))
      expect(screen.getByText('Gekopieerd!')).toBeInTheDocument()
      act(() => {
        vi.advanceTimersByTime(1500)
      })
      expect(screen.getByText('Kopieer')).toBeInTheDocument()
    })
  })
})
