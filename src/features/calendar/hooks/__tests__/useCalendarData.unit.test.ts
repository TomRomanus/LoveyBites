import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchEntriesWithRecipes } from '@/features/calendar/api/calendarQueries'
import { calendarKeys } from '@/features/calendar/api/queryKeys'
import useCalendarData from '@/features/calendar/hooks/useCalendarData'
import type { MealPlanEntry } from '@/features/calendar/types/calendar'
import type { Recipe } from '@/features/recipe/types/recipe'

vi.mock('@tanstack/react-query')
vi.mock('@/features/calendar/api/calendarQueries')

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
    createdAt: null as any,
    updatedAt: null as any,
    createdBy: 'u1',
    ...overrides,
  }
}

describe('useCalendarData', () => {
  let mockSetQueryData: ReturnType<typeof vi.fn>
  let mockInvalidateQueries: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(MONDAY)
    vi.clearAllMocks()

    mockSetQueryData = vi.fn()
    mockInvalidateQueries = vi.fn()

    vi.mocked(useQueryClient).mockReturnValue({
      setQueryData: mockSetQueryData,
      invalidateQueries: mockInvalidateQueries,
    } as any)

    vi.mocked(fetchEntriesWithRecipes).mockResolvedValue({
      entries: [],
      recipeMap: new Map(),
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('loading state', () => {
    it('returns loading=true when isLoading is true', () => {
      vi.mocked(useQuery).mockReturnValue({ data: undefined, isLoading: true } as any)
      const { result } = renderHook(() => useCalendarData('2026-05-11', '2026-05-17'))
      expect(result.current.loading).toBe(true)
    })

    it('returns empty entries when loading', () => {
      vi.mocked(useQuery).mockReturnValue({ data: undefined, isLoading: true } as any)
      const { result } = renderHook(() => useCalendarData('2026-05-11', '2026-05-17'))
      expect(result.current.entries).toEqual([])
    })

    it('returns empty recipeMap when loading', () => {
      vi.mocked(useQuery).mockReturnValue({ data: undefined, isLoading: true } as any)
      const { result } = renderHook(() => useCalendarData('2026-05-11', '2026-05-17'))
      expect(result.current.recipeMap.size).toBe(0)
    })
  })

  describe('data present', () => {
    it('returns loading=false when not loading', () => {
      const entry = makeEntry()
      const recipe = makeRecipe()
      const recipeMap = new Map([['r1', recipe]])
      vi.mocked(useQuery).mockReturnValue({
        data: { entries: [entry], recipeMap },
        isLoading: false,
      } as any)
      const { result } = renderHook(() => useCalendarData('2026-05-11', '2026-05-17'))
      expect(result.current.loading).toBe(false)
    })

    it('returns entries from data', () => {
      const entry = makeEntry()
      const recipeMap = new Map<string, Recipe>()
      vi.mocked(useQuery).mockReturnValue({
        data: { entries: [entry], recipeMap },
        isLoading: false,
      } as any)
      const { result } = renderHook(() => useCalendarData('2026-05-11', '2026-05-17'))
      expect(result.current.entries).toEqual([entry])
    })

    it('returns recipeMap from data', () => {
      const recipe = makeRecipe()
      const recipeMap = new Map([['r1', recipe]])
      vi.mocked(useQuery).mockReturnValue({
        data: { entries: [], recipeMap },
        isLoading: false,
      } as any)
      const { result } = renderHook(() => useCalendarData('2026-05-11', '2026-05-17'))
      expect(result.current.recipeMap.get('r1')).toEqual(recipe)
    })
  })

  describe('data undefined', () => {
    it('returns empty entries when data is undefined', () => {
      vi.mocked(useQuery).mockReturnValue({ data: undefined, isLoading: false } as any)
      const { result } = renderHook(() => useCalendarData('2026-05-11', '2026-05-17'))
      expect(result.current.entries).toEqual([])
    })

    it('returns empty recipeMap when data is undefined', () => {
      vi.mocked(useQuery).mockReturnValue({ data: undefined, isLoading: false } as any)
      const { result } = renderHook(() => useCalendarData('2026-05-11', '2026-05-17'))
      expect(result.current.recipeMap.size).toBe(0)
    })
  })

  describe('removeEntry', () => {
    it('calls queryClient.setQueryData with the correct key', () => {
      const entry1 = makeEntry({ id: 'e1' })
      const entry2 = makeEntry({ id: 'e2', date: '2026-05-12' })
      const recipeMap = new Map<string, Recipe>()
      vi.mocked(useQuery).mockReturnValue({
        data: { entries: [entry1, entry2], recipeMap },
        isLoading: false,
      } as any)
      const { result } = renderHook(() => useCalendarData('2026-05-11', '2026-05-17'))
      act(() => {
        result.current.removeEntry('e1')
      })
      expect(mockSetQueryData).toHaveBeenCalledWith(
        calendarKeys.entries('2026-05-11', '2026-05-17'),
        expect.any(Function),
      )
    })

    it('filter function removes the specified entry', () => {
      const entry1 = makeEntry({ id: 'e1' })
      const entry2 = makeEntry({ id: 'e2', date: '2026-05-12' })
      const recipeMap = new Map<string, Recipe>()
      vi.mocked(useQuery).mockReturnValue({
        data: { entries: [entry1, entry2], recipeMap },
        isLoading: false,
      } as any)
      const { result } = renderHook(() => useCalendarData('2026-05-11', '2026-05-17'))
      act(() => {
        result.current.removeEntry('e1')
      })
      const filterFn = mockSetQueryData.mock.calls[0][1]
      const filtered = filterFn({ entries: [entry1, entry2], recipeMap })
      expect(filtered.entries).toHaveLength(1)
      expect(filtered.entries[0].id).toBe('e2')
    })

    it('filter function returns undefined when old data is undefined', () => {
      vi.mocked(useQuery).mockReturnValue({ data: undefined, isLoading: false } as any)
      const { result } = renderHook(() => useCalendarData('2026-05-11', '2026-05-17'))
      act(() => {
        result.current.removeEntry('e1')
      })
      const filterFn = mockSetQueryData.mock.calls[0][1]
      expect(filterFn(undefined)).toBeUndefined()
    })
  })

  describe('reload', () => {
    it('calls queryClient.invalidateQueries with the entries key', () => {
      vi.mocked(useQuery).mockReturnValue({ data: undefined, isLoading: false } as any)
      const { result } = renderHook(() => useCalendarData('2026-05-11', '2026-05-17'))
      act(() => {
        result.current.reload()
      })
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: calendarKeys.entries('2026-05-11', '2026-05-17'),
      })
    })
  })
})
