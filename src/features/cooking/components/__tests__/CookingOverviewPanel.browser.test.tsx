import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import CookingOverviewPanel from '../CookingOverviewPanel'
import type { FlatStep } from '@/features/cooking/types/cooking'
import { TimerProvider, useCookTimers } from '@/features/cooking/context/TimerContext'

const STEPS: FlatStep[] = [
  { text: 'Kook de pasta', globalIndex: 0 },
  { text: 'Maak de saus', sectionTitle: 'De saus', globalIndex: 1 },
  { text: 'Serveer het gerecht', globalIndex: 2 },
]

type Props = React.ComponentProps<typeof CookingOverviewPanel>

function setup(overrides: Partial<Props> = {}) {
  const defaults: Props = {
    steps: STEPS,
    currentIndex: 0,
    ingredientMap: new Map<string, string>(),
    onGoTo: vi.fn(),
  }
  const props = { ...defaults, ...overrides }
  return { ...render(<TimerProvider><CookingOverviewPanel {...props} /></TimerProvider>), onGoTo: props.onGoTo }
}

describe('CookingOverviewPanel', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('rendering', () => {
    it('renders all step texts', () => {
      setup()
      expect(screen.getByText('Kook de pasta')).toBeInTheDocument()
      expect(screen.getByText('Maak de saus')).toBeInTheDocument()
      expect(screen.getByText('Serveer het gerecht')).toBeInTheDocument()
    })

    it('renders sequential step numbers starting at 1', () => {
      setup()
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('renders the header instruction text', () => {
      setup()
      expect(screen.getByText('TIK EEN STAP AAN OM ERNAAR TE SPRINGEN')).toBeInTheDocument()
    })

    it('renders section titles from steps', () => {
      setup()
      expect(screen.getByText('De saus')).toBeInTheDocument()
    })

    it('does not render a section title when none is present', () => {
      const steps: FlatStep[] = [{ text: 'Stap zonder sectie', globalIndex: 0 }]
      setup({ steps })
      expect(screen.queryByText('De saus')).not.toBeInTheDocument()
    })

    it('renders step ingredient names from the ingredientMap', () => {
      const ingredientMap = new Map([['ing-id', 'spaghetti']])
      const stepsWithRefs: FlatStep[] = [
        { text: 'Kook de pasta', ingredientRefs: ['ing-id'], globalIndex: 0 },
      ]
      setup({ steps: stepsWithRefs, ingredientMap })
      expect(screen.getByText('spaghetti')).toBeInTheDocument()
    })

    it('does not render ingredient names when ingredientRefs do not match the map', () => {
      const ingredientMap = new Map<string, string>()
      const stepsWithRefs: FlatStep[] = [
        { text: 'Kook de pasta', ingredientRefs: ['unknown-id'], globalIndex: 0 },
      ]
      setup({ steps: stepsWithRefs, ingredientMap })
      expect(screen.queryByText(/·/)).not.toBeInTheDocument()
    })
  })

  describe('step navigation', () => {
    it('calls onGoTo with index 0 when the first step is clicked', async () => {
      const onGoTo = vi.fn()
      setup({ onGoTo })
      await userEvent.click(screen.getByText('Kook de pasta').closest('button')!)
      expect(onGoTo).toHaveBeenCalledWith(0)
    })

    it('calls onGoTo with the correct index when a middle step is clicked', async () => {
      const onGoTo = vi.fn()
      setup({ onGoTo })
      await userEvent.click(screen.getByText('Maak de saus').closest('button')!)
      expect(onGoTo).toHaveBeenCalledWith(1)
    })

    it('calls onGoTo with the last index when the last step is clicked', async () => {
      const onGoTo = vi.fn()
      setup({ onGoTo })
      await userEvent.click(screen.getByText('Serveer het gerecht').closest('button')!)
      expect(onGoTo).toHaveBeenCalledWith(2)
    })
  })

  describe('comment', () => {
    it('renders the comment for a step that has one', () => {
      const steps: FlatStep[] = [
        { text: 'Kook de pasta', comment: 'Let op het kookpunt', globalIndex: 0 },
      ]
      setup({ steps })
      expect(screen.getByText('Let op het kookpunt')).toBeInTheDocument()
    })

    it('does not render a comment when a step has none', () => {
      setup()
      expect(screen.queryByText(/Let op/)).not.toBeInTheDocument()
    })
  })

  describe('timer buttons', () => {
    function timerSetup(stepText: string) {
      let controls: ReturnType<typeof useCookTimers>
      const steps: FlatStep[] = [{ text: stepText, globalIndex: 0 }]
      function Harness() {
        controls = useCookTimers()
        return (
          <CookingOverviewPanel
            steps={steps}
            currentIndex={0}
            ingredientMap={new Map()}
            onGoTo={vi.fn()}
          />
        )
      }
      render(<TimerProvider><Harness /></TimerProvider>)
      return () => controls!
    }

    it('shows start-timer button when step text contains a time reference', () => {
      timerSetup('Kook 10 minuten op laag vuur')
      expect(screen.getByText('Start 10 min timer')).toBeInTheDocument()
    })

    it('does not show timer buttons when step has no time reference', () => {
      setup()
      expect(screen.queryByText(/timer/i)).toBeNull()
    })

    it('disables the button and shows active label after clicking', async () => {
      timerSetup('Kook 10 minuten op laag vuur')
      await userEvent.click(screen.getByText('Start 10 min timer').closest('button')!)
      const btn = await screen.findByText('10 min timer actief')
      expect(btn.closest('button')).toBeDisabled()
    })

    it('re-enables the button after the timer is dismissed', async () => {
      const getControls = timerSetup('Kook 10 minuten op laag vuur')
      await userEvent.click(screen.getByText('Start 10 min timer').closest('button')!)
      await screen.findByText('10 min timer actief')
      const { timers, dismissTimer } = getControls()
      dismissTimer(timers[0].id)
      expect(await screen.findByText('Start 10 min timer')).not.toBeDisabled()
    })

    it('does not call onGoTo when a timer button is clicked', async () => {
      const onGoTo = vi.fn()
      const steps: FlatStep[] = [{ text: 'Kook 10 minuten op laag vuur', globalIndex: 0 }]
      render(
        <TimerProvider>
          <CookingOverviewPanel steps={steps} currentIndex={0} ingredientMap={new Map()} onGoTo={onGoTo} />
        </TimerProvider>,
      )
      await userEvent.click(screen.getByText('Start 10 min timer').closest('button')!)
      expect(onGoTo).not.toHaveBeenCalled()
    })
  })
})
