import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import CookingIngredientsPanel from '../CookingIngredientsPanel'
import type { Recipe } from '@/features/recipe/types/recipe'
import type { TreeNode } from '@/features/cooking/types/cooking'

const BASE_RECIPE: Recipe = {
  id: 'r1',
  title: 'Pasta',
  description: '',
  ingredients: [],
  steps: [],
  tags: [],
  imageUrl: '',
  createdAt: {} as never,
  updatedAt: {} as never,
  createdBy: 'u1',
}

const SCALED_INGREDIENTS: TreeNode[] = [
  {
    kind: 'group',
    title: 'De pasta',
    children: [
      { kind: 'leaf', text: '200g spaghetti' },
      { kind: 'leaf', text: '1 tl zout' },
    ],
  },
  { kind: 'leaf', text: '2 eieren' },
]

type Props = React.ComponentProps<typeof CookingIngredientsPanel>

function setup(overrides: Partial<Props> = {}) {
  const defaults: Props = {
    recipe: BASE_RECIPE,
    scaledIngredients: SCALED_INGREDIENTS,
    selectedPortions: 2,
    portionDir: null,
    checked: new Set<string>(),
    onPortionsChange: vi.fn(),
    onToggle: vi.fn(),
  }
  const props = { ...defaults, ...overrides }
  return {
    ...render(<CookingIngredientsPanel {...props} />),
    onToggle: props.onToggle,
    onPortionsChange: props.onPortionsChange,
  }
}

describe('CookingIngredientsPanel', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('rendering', () => {
    it('renders the portion controls', () => {
      setup()
      expect(screen.getByText('porties')).toBeInTheDocument()
    })

    it('renders the current portions number', () => {
      setup({ selectedPortions: 4 })
      expect(screen.getByText('4')).toBeInTheDocument()
    })

    it('renders group section titles', () => {
      setup()
      expect(screen.getByText('De pasta')).toBeInTheDocument()
    })

    it('renders leaf ingredients within groups', () => {
      setup()
      expect(screen.getByText('200g spaghetti')).toBeInTheDocument()
      expect(screen.getByText('1 tl zout')).toBeInTheDocument()
    })

    it('renders top-level leaf ingredients', () => {
      setup()
      expect(screen.getByText('2 eieren')).toBeInTheDocument()
    })

    it('renders a flat ingredient list when there are no groups', () => {
      const flatIngredients: TreeNode[] = [
        { kind: 'leaf', text: 'Zout' },
        { kind: 'leaf', text: 'Peper' },
      ]
      setup({ scaledIngredients: flatIngredients })
      expect(screen.getByText('Zout')).toBeInTheDocument()
      expect(screen.getByText('Peper')).toBeInTheDocument()
    })
  })

  describe('ingredient toggle', () => {
    it('calls onToggle with the group-child key when clicked', async () => {
      const onToggle = vi.fn()
      setup({ onToggle })
      // '200g spaghetti' is group 0, child 0 → key '0-0'
      await userEvent.click(screen.getByText('200g spaghetti').closest('button')!)
      expect(onToggle).toHaveBeenCalledWith('0-0')
    })

    it('calls onToggle with the group-child key for the second child', async () => {
      const onToggle = vi.fn()
      setup({ onToggle })
      // '1 tl zout' is group 0, child 1 → key '0-1'
      await userEvent.click(screen.getByText('1 tl zout').closest('button')!)
      expect(onToggle).toHaveBeenCalledWith('0-1')
    })

    it('calls onToggle with the root key for a top-level leaf', async () => {
      const onToggle = vi.fn()
      setup({ onToggle })
      // '2 eieren' is the second top-level node (index 1) → key 'root-1'
      await userEvent.click(screen.getByText('2 eieren').closest('button')!)
      expect(onToggle).toHaveBeenCalledWith('root-1')
    })
  })
})
