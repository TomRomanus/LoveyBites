import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useQuery } from '@tanstack/react-query'
import { getRecipes } from '@/features/recipe/api/recipes'
import { createMealPlanEntry } from '@/features/calendar/api/mealPlan'
import { useAuth } from '@/features/auth/contexts/AuthContext'
import { extractLeafTexts } from '@/features/recipe/utils/ingredientUtils'
import useAddMeal from '@/features/calendar/components/useAddMeal'
import type { Recipe } from '@/features/recipe/types/recipe'

vi.mock('@tanstack/react-query')
vi.mock('@/features/recipe/api/recipes')
vi.mock('@/features/calendar/api/mealPlan')
vi.mock('@/features/auth/contexts/AuthContext')
vi.mock('@/features/recipe/utils/ingredientUtils')

const MONDAY = new Date('2026-05-11T00:00:00.000Z')

function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: 'r1',
    title: 'Pasta',
    description: 'A pasta dish',
    ingredients: [],
    steps: [],
    tags: [],
    imageUrl: '',
    portions: 2,
    createdAt: null as any,
    updatedAt: null as any,
    createdBy: 'u1',
    ...overrides,
  }
}

function setup(
  props: {
    date?: string
    existingRecipeIds?: string[]
    onClose?: () => void
    onSaved?: () => void
    userUid?: string | null
  } = {},
) {
  const {
    date = '2026-05-11',
    existingRecipeIds = [],
    onClose = vi.fn(),
    onSaved = vi.fn(),
    userUid = 'u1',
  } = props

  vi.mocked(useAuth).mockReturnValue({
    user: userUid ? ({ uid: userUid } as any) : null,
    loading: false,
    signInWithGoogle: vi.fn(),
    signInWithEmail: vi.fn(),
    signUpWithEmail: vi.fn(),
    signOutUser: vi.fn(),
    authError: null,
  })

  return renderHook(() => useAddMeal({ date, existingRecipeIds, onClose, onSaved }))
}

describe('useAddMeal', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(MONDAY)
    vi.clearAllMocks()

    vi.mocked(extractLeafTexts).mockReturnValue([])
    vi.mocked(getRecipes).mockResolvedValue([])
    vi.mocked(createMealPlanEntry).mockResolvedValue('new-id')

    // By default, useQuery returns empty recipes
    vi.mocked(useQuery).mockReturnValue({ data: [] } as any)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('starts with tab="recipe"', () => {
      const { result } = setup()
      expect(result.current.tab).toBe('recipe')
    })

    it('starts with search=""', () => {
      const { result } = setup()
      expect(result.current.search).toBe('')
    })

    it('starts with custom=""', () => {
      const { result } = setup()
      expect(result.current.custom).toBe('')
    })

    it('starts with saving=false', () => {
      const { result } = setup()
      expect(result.current.saving).toBe(false)
    })

    it('starts with selectedId=null', () => {
      const { result } = setup()
      expect(result.current.selectedId).toBeNull()
    })
  })

  describe('handleTabChange', () => {
    it('sets tab to "custom" when called with "custom"', () => {
      const { result } = setup()
      act(() => result.current.handleTabChange('custom'))
      expect(result.current.tab).toBe('custom')
    })

    it('sets tabDir to 1 when switching to custom', () => {
      const { result } = setup()
      act(() => result.current.handleTabChange('custom'))
      expect(result.current.tabDir).toBe(1)
    })

    it('sets tab to "recipe" when called with "recipe"', () => {
      const { result } = setup()
      act(() => result.current.handleTabChange('custom'))
      act(() => result.current.handleTabChange('recipe'))
      expect(result.current.tab).toBe('recipe')
    })

    it('sets tabDir to -1 when switching to recipe', () => {
      const { result } = setup()
      act(() => result.current.handleTabChange('custom'))
      act(() => result.current.handleTabChange('recipe'))
      expect(result.current.tabDir).toBe(-1)
    })
  })

  describe('filtered recipes', () => {
    it('returns all available recipes when search is empty', () => {
      const recipes = [makeRecipe({ id: 'r1' }), makeRecipe({ id: 'r2', title: 'Soup' })]
      vi.mocked(useQuery).mockReturnValue({ data: recipes } as any)
      const { result } = setup()
      expect(result.current.filtered).toHaveLength(2)
    })

    it('excludes recipes in existingRecipeIds', () => {
      const recipes = [makeRecipe({ id: 'r1' }), makeRecipe({ id: 'r2', title: 'Soup' })]
      vi.mocked(useQuery).mockReturnValue({ data: recipes } as any)
      const { result } = setup({ existingRecipeIds: ['r1'] })
      expect(result.current.filtered).toHaveLength(1)
      expect(result.current.filtered[0].id).toBe('r2')
    })

    it('filters by title (case-insensitive)', () => {
      const recipes = [
        makeRecipe({ id: 'r1', title: 'Pasta Carbonara', description: 'An Italian classic' }),
        makeRecipe({ id: 'r2', title: 'Soup', description: 'A hearty broth' }),
      ]
      vi.mocked(useQuery).mockReturnValue({ data: recipes } as any)
      const { result } = setup()
      act(() => result.current.setSearch('pasta'))
      expect(result.current.filtered).toHaveLength(1)
      expect(result.current.filtered[0].id).toBe('r1')
    })

    it('filters by description (case-insensitive)', () => {
      const recipes = [
        makeRecipe({ id: 'r1', description: 'A classic Italian pasta' }),
        makeRecipe({ id: 'r2', description: 'A hearty vegetable soup' }),
      ]
      vi.mocked(useQuery).mockReturnValue({ data: recipes } as any)
      const { result } = setup()
      act(() => result.current.setSearch('italian'))
      expect(result.current.filtered).toHaveLength(1)
      expect(result.current.filtered[0].id).toBe('r1')
    })

    it('filters by ingredients (via extractLeafTexts)', () => {
      const recipes = [makeRecipe({ id: 'r1' }), makeRecipe({ id: 'r2', title: 'Soup' })]
      vi.mocked(useQuery).mockReturnValue({ data: recipes } as any)
      // r1 has "spaghetti" in ingredients, r2 does not
      vi.mocked(extractLeafTexts).mockImplementation((ingredients) => {
        // Distinguish by checking if it's the first or second recipe's ingredients array
        // Both have [], but we can tell by the recipe being processed at the time
        return ingredients === recipes[0].ingredients ? ['spaghetti'] : ['broth']
      })
      const { result } = setup()
      act(() => result.current.setSearch('spaghetti'))
      expect(result.current.filtered).toHaveLength(1)
      expect(result.current.filtered[0].id).toBe('r1')
    })

    it('returns empty array when all recipes are excluded', () => {
      const recipes = [makeRecipe({ id: 'r1' })]
      vi.mocked(useQuery).mockReturnValue({ data: recipes } as any)
      const { result } = setup({ existingRecipeIds: ['r1'] })
      expect(result.current.filtered).toHaveLength(0)
    })
  })

  describe('handleSelectRecipe', () => {
    it('sets selectedId to the given recipe id', async () => {
      vi.mocked(useQuery).mockReturnValue({ data: [makeRecipe()] } as any)
      const { result } = setup()
      await act(async () => {
        await result.current.handleSelectRecipe('r1')
      })
      expect(result.current.selectedId).toBe('r1')
    })

    it('sets saving=true while saving', async () => {
      let resolveFn: (val: string) => void = () => {}
      vi.mocked(createMealPlanEntry).mockReturnValue(
        new Promise((res) => {
          resolveFn = res
        }),
      )
      vi.mocked(useQuery).mockReturnValue({ data: [makeRecipe()] } as any)
      const { result } = setup()
      // Start the action but don't await it so we can inspect mid-flight state
      await act(async () => {
        // Kick off save without awaiting it inside act
        void result.current.handleSelectRecipe('r1')
        // Flush only the synchronous state update (setSaving(true))
        await Promise.resolve()
      })
      expect(result.current.saving).toBe(true)
      // Resolve the pending promise and flush remaining updates
      await act(async () => {
        resolveFn('new-id')
      })
    })

    it('calls createMealPlanEntry with correct args', async () => {
      vi.mocked(useQuery).mockReturnValue({ data: [makeRecipe()] } as any)
      const { result } = setup({ date: '2026-05-11' })
      await act(async () => {
        await result.current.handleSelectRecipe('r1')
      })
      expect(createMealPlanEntry).toHaveBeenCalledWith({
        date: '2026-05-11',
        recipeId: 'r1',
        createdBy: 'u1',
      })
    })

    it('calls onSaved after saving', async () => {
      const onSaved = vi.fn()
      vi.mocked(useQuery).mockReturnValue({ data: [makeRecipe()] } as any)
      const { result } = setup({ onSaved })
      await act(async () => {
        await result.current.handleSelectRecipe('r1')
      })
      expect(onSaved).toHaveBeenCalledOnce()
    })

    it('sets saving=false after operation completes', async () => {
      vi.mocked(useQuery).mockReturnValue({ data: [makeRecipe()] } as any)
      const { result } = setup()
      await act(async () => {
        await result.current.handleSelectRecipe('r1')
      })
      expect(result.current.saving).toBe(false)
    })

    it('is a no-op when user is null', async () => {
      vi.mocked(useQuery).mockReturnValue({ data: [makeRecipe()] } as any)
      const { result } = setup({ userUid: null })
      await act(async () => {
        await result.current.handleSelectRecipe('r1')
      })
      expect(createMealPlanEntry).not.toHaveBeenCalled()
    })
  })

  describe('handleSaveCustom', () => {
    it('is a no-op when custom is empty', async () => {
      const { result } = setup()
      await act(async () => {
        await result.current.handleSaveCustom()
      })
      expect(createMealPlanEntry).not.toHaveBeenCalled()
    })

    it('is a no-op when custom is whitespace only', async () => {
      const { result } = setup()
      act(() => result.current.setCustom('   '))
      await act(async () => {
        await result.current.handleSaveCustom()
      })
      expect(createMealPlanEntry).not.toHaveBeenCalled()
    })

    it('is a no-op when user is null', async () => {
      const { result } = setup({ userUid: null })
      act(() => result.current.setCustom('My custom meal'))
      await act(async () => {
        await result.current.handleSaveCustom()
      })
      expect(createMealPlanEntry).not.toHaveBeenCalled()
    })

    it('calls createMealPlanEntry with customDescription', async () => {
      const { result } = setup({ date: '2026-05-11' })
      act(() => result.current.setCustom('My custom meal'))
      await act(async () => {
        await result.current.handleSaveCustom()
      })
      expect(createMealPlanEntry).toHaveBeenCalledWith({
        date: '2026-05-11',
        customDescription: 'My custom meal',
        createdBy: 'u1',
      })
    })

    it('trims whitespace from custom description', async () => {
      const { result } = setup({ date: '2026-05-11' })
      act(() => result.current.setCustom('  My custom meal  '))
      await act(async () => {
        await result.current.handleSaveCustom()
      })
      expect(createMealPlanEntry).toHaveBeenCalledWith(
        expect.objectContaining({ customDescription: 'My custom meal' }),
      )
    })

    it('calls onSaved after saving custom meal', async () => {
      const onSaved = vi.fn()
      const { result } = setup({ onSaved })
      act(() => result.current.setCustom('My custom meal'))
      await act(async () => {
        await result.current.handleSaveCustom()
      })
      expect(onSaved).toHaveBeenCalledOnce()
    })

    it('sets saving=false after operation completes', async () => {
      const { result } = setup()
      act(() => result.current.setCustom('My custom meal'))
      await act(async () => {
        await result.current.handleSaveCustom()
      })
      expect(result.current.saving).toBe(false)
    })
  })
})
