import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import CookingScreen from '../CookingScreen'
import type { Recipe } from '@/features/recipe/types/recipe'
import type { TreeNode } from '@/features/cooking/types/cooking'

const BASE_RECIPE: Recipe = {
  id: 'r1',
  title: 'Pasta Carbonara',
  description: '',
  ingredients: [],
  steps: [
    { kind: 'leaf', text: 'Kook de pasta' },
    { kind: 'leaf', text: 'Maak de saus' },
    { kind: 'leaf', text: 'Serveer het gerecht' },
  ],
  tags: [],
  imageUrl: '',
  createdAt: {} as never,
  updatedAt: {} as never,
  createdBy: 'u1',
}

const EMPTY_RECIPE: Recipe = { ...BASE_RECIPE, steps: [] }

const SCALED_INGREDIENTS: TreeNode[] = [{ kind: 'leaf', text: '200g spaghetti' }]

type Props = React.ComponentProps<typeof CookingScreen>

function setup(overrides: Partial<Props> = {}) {
  const defaults: Props = {
    recipe: BASE_RECIPE,
    scaledIngredients: SCALED_INGREDIENTS,
    selectedPortions: 2,
    onPortionsChange: vi.fn(),
    checked: new Set<string>(),
    onToggle: vi.fn(),
    onClose: vi.fn(),
  }
  const props = { ...defaults, ...overrides }
  return { ...render(<CookingScreen {...props} />), onClose: props.onClose }
}

describe('CookingScreen', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('empty recipe guard', () => {
    it('renders nothing when the recipe has no steps', () => {
      const { container } = setup({ recipe: EMPTY_RECIPE })
      expect(container.firstChild).toBeNull()
    })
  })

  describe('header', () => {
    it('renders the "Kookmodus" title', () => {
      setup()
      expect(screen.getByText('Kookmodus')).toBeInTheDocument()
    })

    it('renders the close button', () => {
      setup()
      expect(screen.getByTestId('cooking-close-btn')).toBeInTheDocument()
    })

    it('calls onClose when the close button is clicked', async () => {
      const onClose = vi.fn()
      setup({ onClose })
      await userEvent.click(screen.getByTestId('cooking-close-btn'))
      expect(onClose).toHaveBeenCalledOnce()
    })
  })

  describe('tabs', () => {
    it('renders all three tab buttons', () => {
      setup()
      expect(screen.getByRole('button', { name: 'Instructies' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Ingrediënten' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Overzicht' })).toBeInTheDocument()
    })
  })

  describe('step tab (default)', () => {
    it('shows the first step text by default', () => {
      setup()
      expect(screen.getByText('Kook de pasta')).toBeInTheDocument()
    })

    it('shows the step bottom controls by default', () => {
      setup()
      expect(screen.getByText('Volgende stap')).toBeInTheDocument()
    })
  })

  describe('ingredients tab', () => {
    it('shows the ingredients panel when Ingrediënten tab is clicked', async () => {
      setup()
      await userEvent.click(screen.getByRole('button', { name: 'Ingrediënten' }))
      expect(screen.getByText('porties')).toBeInTheDocument()
    })

    it('shows the scaled ingredient text in the ingredients panel', async () => {
      setup()
      await userEvent.click(screen.getByRole('button', { name: 'Ingrediënten' }))
      expect(screen.getByText('200g spaghetti')).toBeInTheDocument()
    })

    it('hides the step bottom controls when on the ingredients tab', async () => {
      setup()
      await userEvent.click(screen.getByRole('button', { name: 'Ingrediënten' }))
      expect(screen.queryByText('Volgende stap')).not.toBeInTheDocument()
    })
  })

  describe('overview tab', () => {
    it('shows the overview panel when Overzicht tab is clicked', async () => {
      setup()
      await userEvent.click(screen.getByRole('button', { name: 'Overzicht' }))
      expect(screen.getByText('TIK EEN STAP AAN OM ERNAAR TE SPRINGEN')).toBeInTheDocument()
    })

    it('lists all steps in the overview', async () => {
      setup()
      await userEvent.click(screen.getByRole('button', { name: 'Overzicht' }))
      expect(screen.getByText('Kook de pasta')).toBeInTheDocument()
      expect(screen.getByText('Maak de saus')).toBeInTheDocument()
      expect(screen.getByText('Serveer het gerecht')).toBeInTheDocument()
    })

    it('hides the step bottom controls when on the overview tab', async () => {
      setup()
      await userEvent.click(screen.getByRole('button', { name: 'Overzicht' }))
      expect(screen.queryByText('Volgende stap')).not.toBeInTheDocument()
    })

    it('switches back to the step tab when a step in the overview is clicked', async () => {
      setup()
      await userEvent.click(screen.getByRole('button', { name: 'Overzicht' }))
      await userEvent.click(screen.getByText('Maak de saus').closest('button')!)
      // Back on step tab: bottom controls are visible again
      expect(screen.getByText('Volgende stap')).toBeInTheDocument()
    })
  })

  describe('step navigation', () => {
    it('shows "Klaar" after navigating to the last step', async () => {
      setup() // 3 steps
      await userEvent.click(screen.getByText('Volgende stap').closest('button')!)
      await userEvent.click(screen.getByText('Volgende stap').closest('button')!)
      expect(screen.getByText('Klaar')).toBeInTheDocument()
    })

    it('disables the previous button on the first step', () => {
      setup()
      const allButtons = screen.getAllByRole('button')
      // Find the prev button: it's the one just before the next/klaar button in bottom controls
      // The prev button is disabled at index 0
      const prevControlBtn = allButtons.find(
        (btn) => btn.disabled && !btn.closest('[data-testid="cooking-close-btn"]'),
      )
      expect(prevControlBtn).toBeDefined()
      expect(prevControlBtn).toBeDisabled()
    })
  })
})
