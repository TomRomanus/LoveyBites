import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useAddToCalendar } from '../useAddToCalendar'
import {
  getMealPlanEntries,
  createMealPlanEntry,
  deleteMealPlanEntry,
} from '@/features/calendar/api/mealPlan'
import { getRecipes } from '@/features/recipe/api/recipes'
import { useAuth } from '@/features/auth/contexts/AuthContext'
import type { MealPlanEntry } from '@/features/calendar/types/calendar'

vi.mock('@/features/calendar/api/mealPlan')
vi.mock('@/features/recipe/api/recipes')
vi.mock('@/features/auth/contexts/AuthContext')

// Pin to a Monday so startOfWeek(today) === today and dates are deterministic
const MONDAY = new Date('2026-05-11T00:00:00.000Z')

const mockRecipe = { id: 'r1', title: 'Pasta Carbonara' }

function makeEntry(overrides: Partial<MealPlanEntry> = {}): MealPlanEntry {
  return { id: 'e1', date: '2026-05-11', recipeId: 'r1', createdAt: null, createdBy: 'u1', ...overrides }
}

function setup(userUid: string | null = 'u1') {
  vi.mocked(useAuth).mockReturnValue({
    user: userUid ? ({ uid: userUid } as ReturnType<typeof useAuth>['user']) : null,
    loading: false,
    signInWithGoogle: vi.fn(),
    signInWithEmail: vi.fn(),
    signUpWithEmail: vi.fn(),
    signOutUser: vi.fn(),
    authError: null,
  })
  return renderHook(() => useAddToCalendar({ recipe: mockRecipe }))
}

// Flush pending promise callbacks (microtasks) without advancing fake timers
const flushPromises = () => act(async () => {})

describe('useAddToCalendar', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(MONDAY)
    vi.clearAllMocks()
    vi.mocked(getMealPlanEntries).mockResolvedValue([])
    vi.mocked(getRecipes).mockResolvedValue([])
    vi.mocked(createMealPlanEntry).mockResolvedValue('new-entry-id')
    vi.mocked(deleteMealPlanEntry).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('starts with empty entries and no saving state', () => {
      const { result } = setup()
      expect(result.current.entries).toEqual([])
      expect(result.current.saving).toBeNull()
      expect(result.current.recentlySaved.size).toBe(0)
    })

    it('exposes 7 days in the current week', () => {
      const { result } = setup()
      expect(result.current.days).toHaveLength(7)
    })

    it('weekDir starts as "next"', () => {
      const { result } = setup()
      expect(result.current.weekDir).toBe('next')
    })

    it('fetches meal plan entries on mount', async () => {
      setup()
      await flushPromises()
      expect(getMealPlanEntries).toHaveBeenCalledOnce()
    })
  })

  describe('week navigation', () => {
    it('goToNextWeek advances weekStart by 7 days', () => {
      const { result } = setup()
      const initial = result.current.weekStart
      act(() => result.current.goToNextWeek())
      const diff = result.current.weekStart.getTime() - initial.getTime()
      expect(diff).toBe(7 * 24 * 60 * 60 * 1000)
    })

    it('goToNextWeek sets weekDir to "next"', () => {
      const { result } = setup()
      act(() => result.current.goToPrevWeek())
      act(() => result.current.goToNextWeek())
      expect(result.current.weekDir).toBe('next')
    })

    it('goToPrevWeek moves weekStart back 7 days', () => {
      const { result } = setup()
      const initial = result.current.weekStart
      act(() => result.current.goToPrevWeek())
      const diff = initial.getTime() - result.current.weekStart.getTime()
      expect(diff).toBe(7 * 24 * 60 * 60 * 1000)
    })

    it('goToPrevWeek sets weekDir to "prev"', () => {
      const { result } = setup()
      act(() => result.current.goToPrevWeek())
      expect(result.current.weekDir).toBe('prev')
    })

    it('refetches entries when the week changes', async () => {
      const { result } = setup()
      await flushPromises()
      expect(getMealPlanEntries).toHaveBeenCalledTimes(1)
      act(() => result.current.goToNextWeek())
      await flushPromises()
      expect(getMealPlanEntries).toHaveBeenCalledTimes(2)
    })
  })

  describe('weekLabel', () => {
    it('returns a non-empty label string', () => {
      const { result } = setup()
      expect(result.current.weekLabel.length).toBeGreaterThan(0)
    })

    it('includes the year', () => {
      const { result } = setup()
      expect(result.current.weekLabel).toContain('2026')
    })
  })

  describe('entriesForDay', () => {
    it('returns only entries matching the given day', async () => {
      vi.mocked(getMealPlanEntries).mockResolvedValue([
        makeEntry({ date: '2026-05-11' }),
        makeEntry({ id: 'e2', date: '2026-05-12' }),
      ])
      const { result } = setup()
      await flushPromises()
      const entries = result.current.entriesForDay(new Date('2026-05-11T00:00:00.000Z'))
      expect(entries).toHaveLength(1)
      expect(entries[0].id).toBe('e1')
    })

    it('returns an empty array when no entries match the day', async () => {
      vi.mocked(getMealPlanEntries).mockResolvedValue([makeEntry({ date: '2026-05-12' })])
      const { result } = setup()
      await flushPromises()
      const entries = result.current.entriesForDay(new Date('2026-05-11T00:00:00.000Z'))
      expect(entries).toHaveLength(0)
    })
  })

  describe('handleDayClick', () => {
    it('creates an entry when none exists for the recipe on that day', async () => {
      const { result } = setup()
      await act(async () => {
        await result.current.handleDayClick(new Date('2026-05-11T00:00:00.000Z'))
      })
      expect(createMealPlanEntry).toHaveBeenCalledWith(
        expect.objectContaining({ date: '2026-05-11', recipeId: 'r1' }),
      )
    })

    it('adds the new entry to local state', async () => {
      const { result } = setup()
      await act(async () => {
        await result.current.handleDayClick(new Date('2026-05-11T00:00:00.000Z'))
      })
      expect(result.current.entries.some((e) => e.date === '2026-05-11')).toBe(true)
    })

    it('marks the day as recently saved', async () => {
      const { result } = setup()
      await act(async () => {
        await result.current.handleDayClick(new Date('2026-05-11T00:00:00.000Z'))
      })
      expect(result.current.recentlySaved.has('2026-05-11')).toBe(true)
    })

    it('clears recentlySaved after 950 ms', async () => {
      const { result } = setup()
      await act(async () => {
        await result.current.handleDayClick(new Date('2026-05-11T00:00:00.000Z'))
      })
      act(() => vi.advanceTimersByTime(950))
      expect(result.current.recentlySaved.has('2026-05-11')).toBe(false)
    })

    it('deletes an existing entry when the recipe is already on that day', async () => {
      vi.mocked(getMealPlanEntries).mockResolvedValue([makeEntry({ date: '2026-05-11' })])
      const { result } = setup()
      await flushPromises()
      expect(result.current.entries).toHaveLength(1)
      await act(async () => {
        await result.current.handleDayClick(new Date('2026-05-11T00:00:00.000Z'))
      })
      expect(deleteMealPlanEntry).toHaveBeenCalledWith('e1')
      expect(result.current.entries).toHaveLength(0)
    })

    it('does nothing when user is not logged in', async () => {
      const { result } = setup(null)
      await act(async () => {
        await result.current.handleDayClick(new Date('2026-05-11T00:00:00.000Z'))
      })
      expect(createMealPlanEntry).not.toHaveBeenCalled()
      expect(deleteMealPlanEntry).not.toHaveBeenCalled()
    })

    it('clears saving after the operation completes', async () => {
      const { result } = setup()
      await act(async () => {
        await result.current.handleDayClick(new Date('2026-05-11T00:00:00.000Z'))
      })
      expect(result.current.saving).toBeNull()
    })
  })
})
