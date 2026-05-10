import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import CookingStepsPanel from '../CookingStepsPanel'
import type { FlatStep } from '@/features/cooking/types/cooking'

const STEPS: FlatStep[] = [
  { text: 'Kook de pasta', globalIndex: 0 },
  { text: 'Maak de saus', sectionTitle: 'De saus', globalIndex: 1 },
  { text: 'Serveer het gerecht', globalIndex: 2 },
]

type Props = React.ComponentProps<typeof CookingStepsPanel>

function setup(overrides: Partial<Props> = {}) {
  const defaults: Props = {
    steps: STEPS,
    currentIndex: 0,
    stepDir: null,
    currentIngredients: [],
    onGoTo: vi.fn(),
  }
  const props = { ...defaults, ...overrides }
  return { ...render(<CookingStepsPanel {...props} />), onGoTo: props.onGoTo }
}

describe('CookingStepsPanel', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('current step', () => {
    it('renders the current step text', () => {
      setup({ currentIndex: 0 })
      expect(screen.getByText('Kook de pasta')).toBeInTheDocument()
    })

    it('renders the section title when the current step has one', () => {
      setup({ currentIndex: 1 })
      expect(screen.getByText('De saus')).toBeInTheDocument()
    })

    it('does not render a section title when the current step has none', () => {
      setup({ currentIndex: 0 })
      expect(screen.queryByText('De saus')).not.toBeInTheDocument()
    })

    it('renders joined ingredient names when currentIngredients is non-empty', () => {
      setup({ currentIndex: 0, currentIngredients: ['spaghetti', 'zout'] })
      expect(screen.getByText('spaghetti · zout')).toBeInTheDocument()
    })

    it('does not render ingredient names when currentIngredients is empty', () => {
      setup({ currentIndex: 0, currentIngredients: [] })
      expect(screen.queryByText(/·/)).not.toBeInTheDocument()
    })

    it('renders a single ingredient name without a separator', () => {
      setup({ currentIndex: 0, currentIngredients: ['spaghetti'] })
      expect(screen.getByText('spaghetti')).toBeInTheDocument()
      expect(screen.queryByText(/·/)).not.toBeInTheDocument()
    })
  })

  describe('previous step preview', () => {
    it('does not show the prev label on the first step', () => {
      setup({ currentIndex: 0 })
      expect(screen.queryByText('← Vorige')).not.toBeInTheDocument()
    })

    it('shows the prev label when not on the first step', () => {
      setup({ currentIndex: 1 })
      expect(screen.getByText('← Vorige')).toBeInTheDocument()
    })

    it('shows the previous step text when not on the first step', () => {
      setup({ currentIndex: 1 })
      expect(screen.getByText('Kook de pasta')).toBeInTheDocument()
    })

    it('calls onGoTo with currentIndex - 1 when the prev button is clicked', async () => {
      const onGoTo = vi.fn()
      setup({ currentIndex: 1, onGoTo })
      await userEvent.click(screen.getByText('← Vorige').closest('button')!)
      expect(onGoTo).toHaveBeenCalledWith(0)
    })
  })

  describe('next step preview', () => {
    it('does not show the next label on the last step', () => {
      setup({ currentIndex: 2 })
      expect(screen.queryByText('Volgende →')).not.toBeInTheDocument()
    })

    it('shows the next label when not on the last step', () => {
      setup({ currentIndex: 0 })
      expect(screen.getByText('Volgende →')).toBeInTheDocument()
    })

    it('shows the next step text when not on the last step', () => {
      setup({ currentIndex: 0 })
      expect(screen.getByText('Maak de saus')).toBeInTheDocument()
    })

    it('calls onGoTo with currentIndex + 1 when the next button is clicked', async () => {
      const onGoTo = vi.fn()
      setup({ currentIndex: 0, onGoTo })
      await userEvent.click(screen.getByText('Volgende →').closest('button')!)
      expect(onGoTo).toHaveBeenCalledWith(1)
    })
  })
})
