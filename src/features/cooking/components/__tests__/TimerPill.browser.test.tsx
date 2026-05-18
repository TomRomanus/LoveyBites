import { render, screen, fireEvent } from '@testing-library/react'
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

  it('shows singular label for one timer', async () => {
    const getControls = setup()
    getControls().startTimer('pasta', 600)
    expect(await screen.findByText('1 timer')).toBeInTheDocument()
  })

  it('shows plural label for multiple timers', async () => {
    const getControls = setup()
    getControls().startTimer('pasta', 600)
    getControls().startTimer('saus', 300)
    expect(await screen.findByText('2 timers')).toBeInTheDocument()
  })

  it('calls openSheet when clicked', async () => {
    const getControls = setup()
    getControls().startTimer('pasta', 600)
    const btn = await screen.findByRole('button')
    fireEvent.click(btn)
    expect(getControls().sheetOpen).toBe(true)
  })
})
