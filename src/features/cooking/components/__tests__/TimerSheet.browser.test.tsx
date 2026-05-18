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
  beforeEach(() => vi.clearAllMocks())

  describe('visibility', () => {
    it('does not render when sheetOpen is false', () => {
      setup()
      expect(screen.queryByText('Timers')).toBeNull()
    })

    it('renders when sheetOpen is true', async () => {
      const getControls = setup()
      getControls().openSheet()
      expect(await screen.findByText('Timers')).toBeInTheDocument()
    })

    it('shows empty state when there are no timers', async () => {
      const getControls = setup()
      getControls().openSheet()
      expect(await screen.findByText('Geen actieve timers')).toBeInTheDocument()
    })

    it('closes when the backdrop is clicked', async () => {
      const getControls = setup()
      getControls().openSheet()
      await screen.findByText('Timers')
      await userEvent.click(document.querySelector('.bg-ink\\/50')!)
      expect(screen.queryByText('Timers')).toBeNull()
    })
  })

  describe('running timer', () => {
    it('shows the timer label and countdown', async () => {
      const getControls = setup()
      getControls().startTimer('deeg rijzen', 600)
      getControls().openSheet()
      expect(await screen.findByText('deeg rijzen')).toBeInTheDocument()
      expect(await screen.findByText('10:00')).toBeInTheDocument()
    })

    it('shows the pause button for a running timer', async () => {
      const getControls = setup()
      getControls().startTimer('pasta', 600)
      getControls().openSheet()
      expect(await screen.findByRole('button', { name: 'Timer pauzeren' })).toBeInTheDocument()
    })
  })

  describe('paused timer', () => {
    it('shows the resume button after pausing', async () => {
      const getControls = setup()
      getControls().startTimer('pasta', 600)
      getControls().openSheet()
      await userEvent.click(await screen.findByRole('button', { name: 'Timer pauzeren' }))
      expect(await screen.findByRole('button', { name: 'Timer hervatten' })).toBeInTheDocument()
    })

    it('shows the pause button again after resuming', async () => {
      const getControls = setup()
      getControls().startTimer('pasta', 600)
      getControls().openSheet()
      await userEvent.click(await screen.findByRole('button', { name: 'Timer pauzeren' }))
      await userEvent.click(await screen.findByRole('button', { name: 'Timer hervatten' }))
      expect(await screen.findByRole('button', { name: 'Timer pauzeren' })).toBeInTheDocument()
    })
  })

  describe('finished timer', () => {
    it('shows 0:00 for a finished timer', async () => {
      const getControls = setup()
      getControls().startTimer('ei', 0)
      getControls().openSheet()
      expect(await screen.findByText('0:00')).toBeInTheDocument()
    })

    it('does not show pause or resume for a finished timer', async () => {
      const getControls = setup()
      getControls().startTimer('ei', 0)
      getControls().openSheet()
      await screen.findByText('0:00')
      expect(screen.queryByRole('button', { name: 'Timer pauzeren' })).toBeNull()
      expect(screen.queryByRole('button', { name: 'Timer hervatten' })).toBeNull()
    })
  })

  describe('dismiss', () => {
    it('removes the timer when dismiss is clicked', async () => {
      const getControls = setup()
      getControls().startTimer('ei koken', 360)
      getControls().openSheet()
      await userEvent.click(await screen.findByRole('button', { name: 'Timer verwijderen' }))
      expect(screen.queryByText('ei koken')).toBeNull()
    })

    it('shows empty state after all timers are dismissed', async () => {
      const getControls = setup()
      getControls().startTimer('pasta', 600)
      getControls().openSheet()
      await userEvent.click(await screen.findByRole('button', { name: 'Timer verwijderen' }))
      expect(await screen.findByText('Geen actieve timers')).toBeInTheDocument()
    })
  })

  describe('cook mode return', () => {
    it('shows Terug naar kookmodus button when cookModeReturn is registered and cook mode is not active', async () => {
      const getControls = setup()
      getControls().startTimer('pasta', 600)
      getControls().registerCookModeReturn(vi.fn())
      getControls().openSheet()
      expect(await screen.findByRole('button', { name: /terug naar kookmodus/i })).toBeInTheDocument()
    })

    it('does not show the button when there are no timers', async () => {
      const getControls = setup()
      getControls().registerCookModeReturn(vi.fn())
      getControls().openSheet()
      await screen.findByText('Timers')
      expect(screen.queryByRole('button', { name: /terug naar kookmodus/i })).toBeNull()
    })
  })
})
