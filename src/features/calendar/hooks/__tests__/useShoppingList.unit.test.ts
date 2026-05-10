import { renderHook } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useQuery } from '@tanstack/react-query'
import { fetchEntriesWithRecipes } from '@/features/calendar/api/calendarQueries'
import { extractLeafTexts } from '@/features/recipe/utils/ingredientUtils'
import { scaleIngredientText } from '@/features/recipe/utils/scaleIngredient'
import useShoppingList from '@/features/calendar/hooks/useShoppingList'
import type { MealPlanEntry } from '@/features/calendar/types/calendar'
import type { Recipe } from '@/features/recipe/types/recipe'

vi.mock('@tanstack/react-query')
vi.mock('@/features/calendar/api/calendarQueries')
vi.mock('@/features/recipe/utils/ingredientUtils')
vi.mock('@/features/recipe/utils/scaleIngredient')

const MONDAY = new Date('2026-05-11T00:00:00.000Z')

function makeEntry(overrides: Partial<MealPlanEntry> = {}): MealPlanEntry {
  return {
    id: 'e1',
    date: '2026-05-11',
    recipeId: 'r1',
    createdAt: null,
    createdBy: 'u1',
    ...overrides,
  }
}

function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: 'r1',
    title: 'Pasta',
    description: '',
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

describe('useShoppingList', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(MONDAY)
    vi.clearAllMocks()

    vi.mocked(extractLeafTexts).mockReturnValue([])
    vi.mocked(scaleIngredientText).mockImplementation((text) => text)
    vi.mocked(fetchEntriesWithRecipes).mockResolvedValue({
      entries: [],
      recipeMap: new Map(),
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('when visible=false', () => {
    it('query is disabled (useQuery receives enabled=false)', () => {
      vi.mocked(useQuery).mockReturnValue({ data: undefined, isLoading: false, isFetched: false } as any)
      renderHook(() => useShoppingList('2026-05-11', '2026-05-17', false))
      expect(vi.mocked(useQuery)).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: false }),
      )
    })
  })

  describe('when visible=true', () => {
    it('query is enabled', () => {
      vi.mocked(useQuery).mockReturnValue({ data: undefined, isLoading: false, isFetched: false } as any)
      renderHook(() => useShoppingList('2026-05-11', '2026-05-17', true))
      expect(vi.mocked(useQuery)).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: true }),
      )
    })
  })

  describe('loading state', () => {
    it('returns loading=true when isLoading is true', () => {
      vi.mocked(useQuery).mockReturnValue({ data: undefined, isLoading: true, isFetched: false } as any)
      const { result } = renderHook(() => useShoppingList('2026-05-11', '2026-05-17', true))
      expect(result.current.loading).toBe(true)
    })

    it('returns empty sections when loading', () => {
      vi.mocked(useQuery).mockReturnValue({ data: undefined, isLoading: true, isFetched: false } as any)
      const { result } = renderHook(() => useShoppingList('2026-05-11', '2026-05-17', true))
      expect(result.current.sections).toEqual([])
    })

    it('returns fetched=false when not yet fetched', () => {
      vi.mocked(useQuery).mockReturnValue({ data: undefined, isLoading: true, isFetched: false } as any)
      const { result } = renderHook(() => useShoppingList('2026-05-11', '2026-05-17', true))
      expect(result.current.fetched).toBe(false)
    })
  })

  describe('sections building', () => {
    it('builds a section for each recipe with entries', () => {
      const recipe = makeRecipe({ id: 'r1', title: 'Pasta', portions: 2 })
      const entry = makeEntry({ id: 'e1', date: '2026-05-11', recipeId: 'r1' })
      const recipeMap = new Map([['r1', recipe]])
      vi.mocked(extractLeafTexts).mockReturnValue(['200g spaghetti'])
      vi.mocked(scaleIngredientText).mockImplementation((text) => text)
      vi.mocked(useQuery).mockReturnValue({
        data: { entries: [entry], recipeMap },
        isLoading: false,
        isFetched: true,
      } as any)
      const { result } = renderHook(() => useShoppingList('2026-05-11', '2026-05-17', true))
      expect(result.current.sections).toHaveLength(1)
      expect(result.current.sections[0].label).toBe('Pasta')
    })

    it('includes the day ISO string in the section days array', () => {
      const recipe = makeRecipe({ id: 'r1', portions: 2 })
      const entry = makeEntry({ id: 'e1', date: '2026-05-11', recipeId: 'r1' })
      const recipeMap = new Map([['r1', recipe]])
      vi.mocked(useQuery).mockReturnValue({
        data: { entries: [entry], recipeMap },
        isLoading: false,
        isFetched: true,
      } as any)
      const { result } = renderHook(() => useShoppingList('2026-05-11', '2026-05-17', true))
      expect(result.current.sections[0].days).toContain('2026-05-11')
    })

    it('includes scaled ingredients in the section', () => {
      const recipe = makeRecipe({ id: 'r1', portions: 2 })
      const entry = makeEntry({ id: 'e1', recipeId: 'r1' })
      const recipeMap = new Map([['r1', recipe]])
      vi.mocked(extractLeafTexts).mockReturnValue(['200g pasta'])
      vi.mocked(scaleIngredientText).mockReturnValue('200g pasta scaled')
      vi.mocked(useQuery).mockReturnValue({
        data: { entries: [entry], recipeMap },
        isLoading: false,
        isFetched: true,
      } as any)
      const { result } = renderHook(() => useShoppingList('2026-05-11', '2026-05-17', true))
      expect(result.current.sections[0].ingredients).toContain('200g pasta scaled')
    })

    it('excludes entries without recipeId', () => {
      const entry = makeEntry({ id: 'e1', recipeId: undefined, customDescription: 'Custom meal' })
      vi.mocked(useQuery).mockReturnValue({
        data: { entries: [entry], recipeMap: new Map() },
        isLoading: false,
        isFetched: true,
      } as any)
      const { result } = renderHook(() => useShoppingList('2026-05-11', '2026-05-17', true))
      expect(result.current.sections).toHaveLength(0)
    })

    it('excludes entries referencing unknown recipes', () => {
      const entry = makeEntry({ id: 'e1', recipeId: 'unknown-id' })
      vi.mocked(useQuery).mockReturnValue({
        data: { entries: [entry], recipeMap: new Map() },
        isLoading: false,
        isFetched: true,
      } as any)
      const { result } = renderHook(() => useShoppingList('2026-05-11', '2026-05-17', true))
      expect(result.current.sections).toHaveLength(0)
    })

    it('merges days when the same recipe appears multiple times', () => {
      const recipe = makeRecipe({ id: 'r1', portions: 2 })
      const entry1 = makeEntry({ id: 'e1', date: '2026-05-11', recipeId: 'r1' })
      const entry2 = makeEntry({ id: 'e2', date: '2026-05-13', recipeId: 'r1' })
      const recipeMap = new Map([['r1', recipe]])
      vi.mocked(useQuery).mockReturnValue({
        data: { entries: [entry1, entry2], recipeMap },
        isLoading: false,
        isFetched: true,
      } as any)
      const { result } = renderHook(() => useShoppingList('2026-05-11', '2026-05-17', true))
      expect(result.current.sections).toHaveLength(1)
      expect(result.current.sections[0].days).toContain('2026-05-11')
      expect(result.current.sections[0].days).toContain('2026-05-13')
    })

    it('scales ingredients by 2*count/portions when same recipe appears twice', () => {
      const recipe = makeRecipe({ id: 'r1', portions: 2 })
      const entry1 = makeEntry({ id: 'e1', date: '2026-05-11', recipeId: 'r1' })
      const entry2 = makeEntry({ id: 'e2', date: '2026-05-13', recipeId: 'r1' })
      const recipeMap = new Map([['r1', recipe]])
      vi.mocked(extractLeafTexts).mockReturnValue(['100g pasta'])
      vi.mocked(scaleIngredientText).mockImplementation((text, ratio) => `${text} x${ratio}`)
      vi.mocked(useQuery).mockReturnValue({
        data: { entries: [entry1, entry2], recipeMap },
        isLoading: false,
        isFetched: true,
      } as any)
      const { result } = renderHook(() => useShoppingList('2026-05-11', '2026-05-17', true))
      // count=2, portions=2 → ratio = (2*2)/2 = 2
      expect(scaleIngredientText).toHaveBeenCalledWith('100g pasta', 2)
    })

    it('returns empty sections when data has no entries', () => {
      vi.mocked(useQuery).mockReturnValue({
        data: { entries: [], recipeMap: new Map() },
        isLoading: false,
        isFetched: true,
      } as any)
      const { result } = renderHook(() => useShoppingList('2026-05-11', '2026-05-17', true))
      expect(result.current.sections).toEqual([])
    })
  })

  describe('buildCopyText', () => {
    it('produces recipe title with day labels and ingredients', () => {
      const recipe = makeRecipe({ id: 'r1', title: 'Pasta', portions: 2 })
      const entry = makeEntry({ id: 'e1', date: '2026-05-11', recipeId: 'r1' })
      const recipeMap = new Map([['r1', recipe]])
      vi.mocked(extractLeafTexts).mockReturnValue(['200g spaghetti'])
      vi.mocked(scaleIngredientText).mockReturnValue('200g spaghetti')
      vi.mocked(useQuery).mockReturnValue({
        data: { entries: [entry], recipeMap },
        isLoading: false,
        isFetched: true,
      } as any)
      const { result } = renderHook(() => useShoppingList('2026-05-11', '2026-05-17', true))
      const copyText = result.current.buildCopyText()
      // Should contain recipe title
      expect(copyText).toContain('Pasta')
      // Should contain a day label (formatEntryDate of 2026-05-11 => "MAA 11-05" in Dutch)
      expect(copyText).toContain('MAA 11-05')
      // Should contain the ingredient
      expect(copyText).toContain('200g spaghetti')
    })

    it('formats sections as "Title (day):\\n  - ingredient"', () => {
      const recipe = makeRecipe({ id: 'r1', title: 'Soup', portions: 2 })
      const entry = makeEntry({ id: 'e1', date: '2026-05-11', recipeId: 'r1' })
      const recipeMap = new Map([['r1', recipe]])
      vi.mocked(extractLeafTexts).mockReturnValue(['carrots'])
      vi.mocked(scaleIngredientText).mockReturnValue('carrots')
      vi.mocked(useQuery).mockReturnValue({
        data: { entries: [entry], recipeMap },
        isLoading: false,
        isFetched: true,
      } as any)
      const { result } = renderHook(() => useShoppingList('2026-05-11', '2026-05-17', true))
      const copyText = result.current.buildCopyText()
      // formatEntryDate('2026-05-11') => 'MAA 11-05' in Dutch
      expect(copyText).toContain('Soup (MAA 11-05):')
      expect(copyText).toContain('  - carrots')
    })

    it('returns empty string when sections are empty', () => {
      vi.mocked(useQuery).mockReturnValue({
        data: { entries: [], recipeMap: new Map() },
        isLoading: false,
        isFetched: true,
      } as any)
      const { result } = renderHook(() => useShoppingList('2026-05-11', '2026-05-17', true))
      expect(result.current.buildCopyText()).toBe('')
    })

    it('separates multiple sections with double newline', () => {
      const recipe1 = makeRecipe({ id: 'r1', title: 'Pasta', portions: 2 })
      const recipe2 = makeRecipe({ id: 'r2', title: 'Soup', portions: 2 })
      const entry1 = makeEntry({ id: 'e1', date: '2026-05-11', recipeId: 'r1' })
      const entry2 = makeEntry({ id: 'e2', date: '2026-05-12', recipeId: 'r2' })
      const recipeMap = new Map([['r1', recipe1], ['r2', recipe2]])
      vi.mocked(extractLeafTexts).mockReturnValue(['item'])
      vi.mocked(scaleIngredientText).mockImplementation((text) => text)
      vi.mocked(useQuery).mockReturnValue({
        data: { entries: [entry1, entry2], recipeMap },
        isLoading: false,
        isFetched: true,
      } as any)
      const { result } = renderHook(() => useShoppingList('2026-05-11', '2026-05-17', true))
      const copyText = result.current.buildCopyText()
      expect(copyText).toContain('\n\n')
    })
  })
})
