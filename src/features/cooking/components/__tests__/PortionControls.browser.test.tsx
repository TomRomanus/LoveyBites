import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import PortionControls from '../PortionControls'
import type { Recipe } from '@/features/recipe/types/recipe'

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

type Props = React.ComponentProps<typeof PortionControls>

function setup(overrides: Partial<Props> = {}) {
  const defaults: Props = {
    recipe: BASE_RECIPE,
    selectedPortions: 2,
    portionDir: null,
    onPortionsChange: vi.fn(),
  }
  const props = { ...defaults, ...overrides }
  return { ...render(<PortionControls {...props} />), onPortionsChange: props.onPortionsChange }
}

describe('PortionControls', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('display', () => {
    it('shows the current portions number', () => {
      setup({ selectedPortions: 4 })
      expect(screen.getByText('4')).toBeInTheDocument()
    })

    it('shows the "porties" label', () => {
      setup()
      expect(screen.getByText('porties')).toBeInTheDocument()
    })

    it('shows "pers" as the default portion label', () => {
      setup()
      expect(screen.getByText('pers')).toBeInTheDocument()
    })

    it('shows "stuks" when portionsLabel is "stuks" and selectedPortions is above 1', () => {
      setup({ recipe: { ...BASE_RECIPE, portionsLabel: 'stuks' }, selectedPortions: 2 })
      expect(screen.getByText('stuks')).toBeInTheDocument()
    })

    it('shows "stuk" (singular) when portionsLabel is "stuks" and selectedPortions is 1', () => {
      setup({ recipe: { ...BASE_RECIPE, portionsLabel: 'stuks' }, selectedPortions: 1 })
      expect(screen.getByText('stuk')).toBeInTheDocument()
      expect(screen.queryByText('stuks')).not.toBeInTheDocument()
    })
  })

  describe('plus button', () => {
    it('calls onPortionsChange with selectedPortions + 1', async () => {
      const onPortionsChange = vi.fn()
      const { container } = setup({ selectedPortions: 2, onPortionsChange })
      const [, plusBtn] = container.querySelectorAll('button')
      await userEvent.click(plusBtn)
      expect(onPortionsChange).toHaveBeenCalledWith(3)
    })

    it('increments from 1 correctly', async () => {
      const onPortionsChange = vi.fn()
      const { container } = setup({ selectedPortions: 1, onPortionsChange })
      const [, plusBtn] = container.querySelectorAll('button')
      await userEvent.click(plusBtn)
      expect(onPortionsChange).toHaveBeenCalledWith(2)
    })
  })

  describe('minus button', () => {
    it('calls onPortionsChange with selectedPortions - 1', async () => {
      const onPortionsChange = vi.fn()
      const { container } = setup({ selectedPortions: 3, onPortionsChange })
      const [minusBtn] = container.querySelectorAll('button')
      await userEvent.click(minusBtn)
      expect(onPortionsChange).toHaveBeenCalledWith(2)
    })

    it('is disabled when selectedPortions is 1', () => {
      const { container } = setup({ selectedPortions: 1 })
      const [minusBtn] = container.querySelectorAll('button')
      expect(minusBtn).toBeDisabled()
    })

    it('is enabled when selectedPortions is above 1', () => {
      const { container } = setup({ selectedPortions: 2 })
      const [minusBtn] = container.querySelectorAll('button')
      expect(minusBtn).not.toBeDisabled()
    })
  })
})
