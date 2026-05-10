import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { startOfWeek, format } from 'date-fns'
import AddToCalendarModal from '../index'
import { getMealPlanEntries, createMealPlanEntry } from '@/features/calendar/api/mealPlan'
import { getRecipes } from '@/features/recipe/api/recipes'
import { useAuth } from '@/features/auth/contexts/AuthContext'

vi.mock('@/features/calendar/api/mealPlan')
vi.mock('@/features/recipe/api/recipes')
vi.mock('@/features/auth/contexts/AuthContext')

const mockRecipe = { id: 'r1', title: 'Pasta Carbonara' }

function setup(props: Partial<React.ComponentProps<typeof AddToCalendarModal>> = {}) {
  const defaults = {
    recipe: mockRecipe,
    onClose: vi.fn(),
  }
  const merged = { ...defaults, ...props }
  return { ...render(<AddToCalendarModal {...merged} />), onClose: merged.onClose }
}

describe('AddToCalendarModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getMealPlanEntries).mockResolvedValue([])
    vi.mocked(getRecipes).mockResolvedValue([])
    vi.mocked(createMealPlanEntry).mockResolvedValue('new-entry-id')
    vi.mocked(useAuth).mockReturnValue({
      user: { uid: 'u1' } as ReturnType<typeof useAuth>['user'],
      loading: false,
      signInWithGoogle: vi.fn(),
      signInWithEmail: vi.fn(),
      signUpWithEmail: vi.fn(),
      signOutUser: vi.fn(),
      authError: null,
    })
  })

  describe('headings and labels', () => {
    it('renders the "Toevoegen aan menu" heading', async () => {
      setup()
      await waitFor(() => {
        expect(screen.getByText('Toevoegen aan menu')).toBeInTheDocument()
      })
    })

    it('renders the recipe title in the eyebrow', async () => {
      setup()
      await waitFor(() => {
        expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument()
      })
    })

    it('renders the hint text at the bottom', async () => {
      setup()
      await waitFor(() => {
        expect(screen.getByText(/klik om toe te voegen/i)).toBeInTheDocument()
      })
    })
  })

  describe('week grid', () => {
    it('renders 7 day cells', async () => {
      setup()
      await waitFor(() => {
        // 7 day cells + 2 nav buttons = 9 buttons total
        const buttons = screen.getAllByRole('button')
        expect(buttons.length).toBeGreaterThanOrEqual(7)
      })
    })

    it('renders previous week and next week buttons', async () => {
      setup()
      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        expect(buttons[0]).toBeInTheDocument() // prev
        expect(buttons[1]).toBeInTheDocument() // next
      })
    })
  })

  describe('week navigation', () => {
    it('clicking next week changes the week label', async () => {
      setup()
      await waitFor(() => screen.getByText('Toevoegen aan menu'))
      const weekLabelBefore = document.body.querySelector(
        '.text-\\[14px\\].font-medium',
      )?.textContent
      const buttons = screen.getAllByRole('button')
      await userEvent.click(buttons[1]) // next week button
      const weekLabelAfter = document.body.querySelector(
        '.text-\\[14px\\].font-medium',
      )?.textContent
      expect(weekLabelAfter).not.toBe(weekLabelBefore)
    })

    it('clicking previous week changes the week label', async () => {
      setup()
      await waitFor(() => screen.getByText('Toevoegen aan menu'))
      const weekLabelBefore = document.body.querySelector(
        '.text-\\[14px\\].font-medium',
      )?.textContent
      const buttons = screen.getAllByRole('button')
      await userEvent.click(buttons[0]) // prev week button
      const weekLabelAfter = document.body.querySelector(
        '.text-\\[14px\\].font-medium',
      )?.textContent
      expect(weekLabelAfter).not.toBe(weekLabelBefore)
    })
  })

  describe('adding a recipe to a day', () => {
    it('calls createMealPlanEntry when a day cell is clicked', async () => {
      setup()
      await waitFor(() => screen.getByText('Toevoegen aan menu'))
      // day buttons start at index 2 (after prev/next nav buttons)
      const buttons = screen.getAllByRole('button')
      const dayButtons = buttons.slice(2)
      await userEvent.click(dayButtons[0])
      expect(createMealPlanEntry).toHaveBeenCalledOnce()
    })

    it('passes the correct recipeId and date to createMealPlanEntry', async () => {
      const expectedDate = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
      setup()
      await waitFor(() => screen.getByText('Toevoegen aan menu'))
      const buttons = screen.getAllByRole('button')
      await userEvent.click(buttons[2]) // first day cell
      expect(createMealPlanEntry).toHaveBeenCalledWith(
        expect.objectContaining({ recipeId: 'r1', date: expectedDate }),
      )
    })
  })
})
