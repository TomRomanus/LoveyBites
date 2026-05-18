import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { TimerProvider, useCookTimers } from '@/features/cooking/context/TimerContext'
import { TimerPill } from '../TimerPill'

function setup() {
  let controls: ReturnType<typeof useCookTimers>
  function Harness() {
    controls = useCookTimers()
    return <TimerPill />
  }
  render(<TimerProvider><Harness /></TimerProvider>)
  return () => controls!
}

describe('TimerPill', () => {
  it('renders nothing when there are no timers', () => {
    setup()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('renders the pill button when a timer is active', async () => {
    const getControls = setup()
    getControls().startTimer('pasta', 600)
    expect(await screen.findByRole('button', { name: 'Timers openen' })).toBeInTheDocument()
  })

  it('shows the countdown for the soonest running timer', async () => {
    const getControls = setup()
    getControls().startTimer('pasta', 600)
    expect(await screen.findByText('10:00')).toBeInTheDocument()
  })

  it('shows the number of active timers', async () => {
    const getControls = setup()
    getControls().startTimer('pasta', 600)
    getControls().startTimer('saus', 300)
    expect(await screen.findByText('2')).toBeInTheDocument()
  })

  it('opens the timer sheet when clicked', async () => {
    const getControls = setup()
    getControls().startTimer('pasta', 600)
    await userEvent.click(await screen.findByRole('button', { name: 'Timers openen' }))
    await waitFor(() => expect(getControls().sheetOpen).toBe(true))
  })

  it('hides when cook mode is active', async () => {
    const getControls = setup()
    getControls().startTimer('pasta', 600)
    await screen.findByRole('button', { name: 'Timers openen' })
    getControls().registerCookMode()
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Timers openen' })).toBeNull())
  })
})
