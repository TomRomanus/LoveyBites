import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import CookingTabs from '../CookingTabs'
import type { CookTab } from '@/features/cooking/types/cooking'

function setup(tab: CookTab = 'step', onTabChange = vi.fn()) {
  return { ...render(<CookingTabs tab={tab} onTabChange={onTabChange} />), onTabChange }
}

describe('CookingTabs', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('rendering', () => {
    it('renders all three tab buttons', () => {
      setup()
      expect(screen.getByRole('button', { name: 'Instructies' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Ingrediënten' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Overzicht' })).toBeInTheDocument()
    })

    it('renders the active tab with full opacity color', () => {
      setup('step')
      expect(screen.getByRole('button', { name: 'Instructies' })).toHaveStyle({
        color: '#f8f4ed',
      })
    })

    it('renders inactive tabs with reduced opacity color', () => {
      setup('step')
      expect(screen.getByRole('button', { name: 'Ingrediënten' })).toHaveStyle({
        color: 'rgba(248,244,237,0.5)',
      })
      expect(screen.getByRole('button', { name: 'Overzicht' })).toHaveStyle({
        color: 'rgba(248,244,237,0.5)',
      })
    })

    it('shows the ingredients tab as active when tab is "ingredients"', () => {
      setup('ingredients')
      expect(screen.getByRole('button', { name: 'Ingrediënten' })).toHaveStyle({
        color: '#f8f4ed',
      })
    })

    it('shows the overview tab as active when tab is "overview"', () => {
      setup('overview')
      expect(screen.getByRole('button', { name: 'Overzicht' })).toHaveStyle({
        color: '#f8f4ed',
      })
    })
  })

  describe('tab switching', () => {
    it('calls onTabChange with "step" when Instructies is clicked', async () => {
      const onTabChange = vi.fn()
      setup('ingredients', onTabChange)
      await userEvent.click(screen.getByRole('button', { name: 'Instructies' }))
      expect(onTabChange).toHaveBeenCalledWith('step')
    })

    it('calls onTabChange with "ingredients" when Ingrediënten is clicked', async () => {
      const onTabChange = vi.fn()
      setup('step', onTabChange)
      await userEvent.click(screen.getByRole('button', { name: 'Ingrediënten' }))
      expect(onTabChange).toHaveBeenCalledWith('ingredients')
    })

    it('calls onTabChange with "overview" when Overzicht is clicked', async () => {
      const onTabChange = vi.fn()
      setup('step', onTabChange)
      await userEvent.click(screen.getByRole('button', { name: 'Overzicht' }))
      expect(onTabChange).toHaveBeenCalledWith('overview')
    })

    it('calls onTabChange exactly once per click', async () => {
      const onTabChange = vi.fn()
      setup('step', onTabChange)
      await userEvent.click(screen.getByRole('button', { name: 'Overzicht' }))
      expect(onTabChange).toHaveBeenCalledOnce()
    })
  })
})
