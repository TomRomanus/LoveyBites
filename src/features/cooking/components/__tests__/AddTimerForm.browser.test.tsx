import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach } from 'vitest'
import { TimerProvider, useCookTimers } from '@/features/cooking/context/TimerContext'
import { AddTimerForm } from '../AddTimerForm'

function setup() {
  let controls: ReturnType<typeof useCookTimers>
  function Harness() {
    controls = useCookTimers()
    return <AddTimerForm />
  }
  render(<TimerProvider><Harness /></TimerProvider>)
  return () => controls!
}

describe('AddTimerForm', () => {
  beforeEach(() => {})

  describe('initial state', () => {
    it('shows the Timer toevoegen button', () => {
      setup()
      expect(screen.getByRole('button', { name: 'Timer toevoegen' })).toBeInTheDocument()
    })

    it('does not show the form fields initially', () => {
      setup()
      expect(screen.queryByRole('button', { name: 'Start' })).toBeNull()
      expect(screen.queryByPlaceholderText('Naam (optioneel)')).toBeNull()
    })
  })

  describe('opening the form', () => {
    it('shows form fields after clicking Timer toevoegen', async () => {
      setup()
      await userEvent.click(screen.getByRole('button', { name: 'Timer toevoegen' }))
      expect(await screen.findByPlaceholderText('Naam (optioneel)')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Annuleer' })).toBeInTheDocument()
    })
  })

  describe('chevron spinners', () => {
    async function openForm() {
      const getControls = setup()
      await userEvent.click(screen.getByRole('button', { name: 'Timer toevoegen' }))
      await screen.findByRole('button', { name: 'Start' })
      return getControls
    }

    it('increments minutes when min verhogen is clicked', async () => {
      const getControls = await openForm()
      await userEvent.click(screen.getByRole('button', { name: 'min verhogen' }))
      await userEvent.click(screen.getByRole('button', { name: 'Start' }))
      await waitFor(() => expect(getControls().timers).toHaveLength(1))
      expect(getControls().timers[0].durationSecs).toBe(60)
    })

    it('increments hours when uur verhogen is clicked', async () => {
      const getControls = await openForm()
      await userEvent.click(screen.getByRole('button', { name: 'uur verhogen' }))
      await userEvent.click(screen.getByRole('button', { name: 'Start' }))
      await waitFor(() => expect(getControls().timers).toHaveLength(1))
      expect(getControls().timers[0].durationSecs).toBe(3600)
    })

    it('carries minutes to hours at 60 minutes', async () => {
      const getControls = await openForm()
      // Click min verhogen 60 times would be slow; use the context directly isn't possible,
      // so we increment hour manually and verify the time display.
      // Instead, just verify the carry: set 59 min then add 1 → should become 1h 0min
      for (let i = 0; i < 60; i++) {
        await userEvent.click(screen.getByRole('button', { name: 'min verhogen' }))
      }
      await userEvent.click(screen.getByRole('button', { name: 'Start' }))
      await waitFor(() => expect(getControls().timers).toHaveLength(1))
      expect(getControls().timers[0].durationSecs).toBe(3600)
    })

    it('does not go below 0 when sec verlagen is clicked at 0', async () => {
      const getControls = await openForm()
      await userEvent.click(screen.getByRole('button', { name: 'sec verlagen' }))
      // Only seconds changed (clamped to 0), no minutes or hours affected
      await userEvent.click(screen.getByRole('button', { name: 'min verhogen' }))
      await userEvent.click(screen.getByRole('button', { name: 'Start' }))
      await waitFor(() => expect(getControls().timers).toHaveLength(1))
      expect(getControls().timers[0].durationSecs).toBe(60) // 1 min, 0 sec
    })
  })

  describe('starting a timer', () => {
    it('starts a timer with auto-generated label when no label is given', async () => {
      const getControls = setup()
      await userEvent.click(screen.getByRole('button', { name: 'Timer toevoegen' }))
      await screen.findByRole('button', { name: 'Start' })
      await userEvent.click(screen.getByRole('button', { name: 'min verhogen' }))
      await userEvent.click(screen.getByRole('button', { name: 'min verhogen' }))
      await userEvent.click(screen.getByRole('button', { name: 'Start' }))
      await waitFor(() => expect(getControls().timers).toHaveLength(1))
      expect(getControls().timers[0].label).toBe('2 min')
    })

    it('starts a timer with the custom label when provided', async () => {
      const getControls = setup()
      await userEvent.click(screen.getByRole('button', { name: 'Timer toevoegen' }))
      await screen.findByRole('button', { name: 'Start' })
      await userEvent.click(screen.getByRole('button', { name: 'min verhogen' }))
      await userEvent.type(screen.getByPlaceholderText('Naam (optioneel)'), 'pasta')
      await userEvent.click(screen.getByRole('button', { name: 'Start' }))
      await waitFor(() => expect(getControls().timers).toHaveLength(1))
      expect(getControls().timers[0].label).toBe('pasta')
    })

    it('does not start a timer when total time is 0', async () => {
      const getControls = setup()
      await userEvent.click(screen.getByRole('button', { name: 'Timer toevoegen' }))
      await screen.findByRole('button', { name: 'Start' })
      await userEvent.click(screen.getByRole('button', { name: 'Start' }))
      expect(getControls().timers).toHaveLength(0)
    })

    it('submits on Enter key in the label input', async () => {
      const getControls = setup()
      await userEvent.click(screen.getByRole('button', { name: 'Timer toevoegen' }))
      await screen.findByRole('button', { name: 'Start' })
      await userEvent.click(screen.getByRole('button', { name: 'sec verhogen' }))
      await userEvent.type(screen.getByPlaceholderText('Naam (optioneel)'), '{Enter}')
      await waitFor(() => expect(getControls().timers).toHaveLength(1))
    })
  })

  describe('cancel', () => {
    it('hides the form and shows Timer toevoegen again', async () => {
      setup()
      await userEvent.click(screen.getByRole('button', { name: 'Timer toevoegen' }))
      await screen.findByRole('button', { name: 'Annuleer' })
      await userEvent.click(screen.getByRole('button', { name: 'Annuleer' }))
      expect(await screen.findByRole('button', { name: 'Timer toevoegen' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Start' })).toBeNull()
    })

    it('resets the values after cancel', async () => {
      const getControls = setup()
      await userEvent.click(screen.getByRole('button', { name: 'Timer toevoegen' }))
      await screen.findByRole('button', { name: 'Start' })
      await userEvent.click(screen.getByRole('button', { name: 'min verhogen' }))
      await userEvent.click(screen.getByRole('button', { name: 'Annuleer' }))
      // Re-open and try to start with no input — should not create a timer
      await userEvent.click(screen.getByRole('button', { name: 'Timer toevoegen' }))
      await screen.findByRole('button', { name: 'Start' })
      await userEvent.click(screen.getByRole('button', { name: 'Start' }))
      expect(getControls().timers).toHaveLength(0)
    })
  })
})
