import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import CalendarNavControls from '../CalendarNavControls'

type Props = React.ComponentProps<typeof CalendarNavControls>

function setup(props: Partial<Props> = {}) {
  const defaults: Props = {
    view: 'week',
    isCurrentPeriod: false,
    onSwitch: vi.fn(),
    onPrev: vi.fn(),
    onNext: vi.fn(),
    onToday: vi.fn(),
  }
  const merged = { ...defaults, ...props }
  return { ...render(<CalendarNavControls {...merged} />), merged }
}

describe('CalendarNavControls', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('tab bar', () => {
    it('renders the "WEEK" tab option', () => {
      setup()
      expect(screen.getByText('WEEK')).toBeInTheDocument()
    })

    it('renders the "MAAND" tab option', () => {
      setup()
      expect(screen.getByText('MAAND')).toBeInTheDocument()
    })

    it('calls onSwitch with "week" when the WEEK tab is clicked', () => {
      const onSwitch = vi.fn()
      setup({ onSwitch })
      fireEvent.click(screen.getByText('WEEK'))
      expect(onSwitch).toHaveBeenCalledWith('week')
    })

    it('calls onSwitch with "month" when the MAAND tab is clicked', () => {
      const onSwitch = vi.fn()
      setup({ onSwitch })
      fireEvent.click(screen.getByText('MAAND'))
      expect(onSwitch).toHaveBeenCalledWith('month')
    })
  })

  describe('navigation buttons', () => {
    it('calls onPrev when the prev button is clicked', async () => {
      const onPrev = vi.fn()
      setup({ onPrev })
      await userEvent.click(screen.getByTestId('prev-period-btn'))
      expect(onPrev).toHaveBeenCalledOnce()
    })

    it('calls onNext when the next button is clicked', async () => {
      const onNext = vi.fn()
      setup({ onNext })
      await userEvent.click(screen.getByTestId('next-period-btn'))
      expect(onNext).toHaveBeenCalledOnce()
    })
  })

  describe('Vandaag button', () => {
    it('calls onToday when the Vandaag button is clicked', async () => {
      const onToday = vi.fn()
      setup({ onToday, isCurrentPeriod: false })
      await userEvent.click(screen.getByText('Vandaag'))
      expect(onToday).toHaveBeenCalledOnce()
    })

    it('is disabled when isCurrentPeriod is true', () => {
      setup({ isCurrentPeriod: true })
      expect(screen.getByText('Vandaag').closest('button')).toBeDisabled()
    })

    it('is not disabled when isCurrentPeriod is false', () => {
      setup({ isCurrentPeriod: false })
      expect(screen.getByText('Vandaag').closest('button')).not.toBeDisabled()
    })
  })
})
