import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { TimerProvider, useCookTimers } from '@/features/cooking/context/TimerContext'
import { TimerSheet } from '../TimerSheet'

function setup() {
  let controls: ReturnType<typeof useCookTimers>
  function Harness() {
    controls = useCookTimers()
    return <TimerSheet />
  }
  render(
    <TimerProvider>
      <Harness />
    </TimerProvider>,
  )
  return () => controls!
}

describe('TimerSheet', () => {
  it('does not render when sheetOpen is false', () => {
    setup()
    expect(screen.queryByText('Timers')).toBeNull()
  })

  it('renders when sheetOpen is true', async () => {
    const getControls = setup()
    getControls().openSheet()
    expect(await screen.findByText('Timers')).toBeInTheDocument()
  })

  it('shows running timer with countdown', async () => {
    const getControls = setup()
    getControls().startTimer('deeg rijzen', 600)
    getControls().openSheet()
    expect(await screen.findByText('deeg rijzen')).toBeInTheDocument()
    expect(await screen.findByText('10:00')).toBeInTheDocument()
  })

  it('shows Klaar! for a finished timer', async () => {
    const getControls = setup()
    getControls().startTimer('pasta', 0)
    getControls().openSheet()
    expect(await screen.findByText('Klaar!', {}, { timeout: 2000 })).toBeInTheDocument()
  })

  it('dismiss button removes the timer', async () => {
    const getControls = setup()
    getControls().startTimer('ei koken', 360)
    getControls().openSheet()
    const dismissBtn = await screen.findByRole('button', { name: /wissen/i })
    await userEvent.click(dismissBtn)
    expect(screen.queryByText('ei koken')).toBeNull()
  })

  it('shows Terug naar kookmodus button when cookModeReturn is set', async () => {
    const getControls = setup()
    getControls().registerCookModeReturn(vi.fn())
    getControls().openSheet()
    expect(await screen.findByRole('button', { name: /terug naar kookmodus/i })).toBeInTheDocument()
  })
})
