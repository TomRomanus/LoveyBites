import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchEntriesWithRecipes,
  type EntriesWithRecipes,
} from '@/features/calendar/api/calendarQueries'
import { calendarKeys } from '@/features/calendar/api/queryKeys'
import type { Recipe } from '@/features/recipe/types/recipe'

const EMPTY_RECIPE_MAP = new Map<string, Recipe>()

const useCalendarData = (startISO: string, endISO: string) => {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: calendarKeys.entries(startISO, endISO),
    queryFn: () => fetchEntriesWithRecipes(startISO, endISO),
  })

  const removeEntry = useCallback(
    (id: string) =>
      queryClient.setQueryData<EntriesWithRecipes>(
        calendarKeys.entries(startISO, endISO),
        (old) => (old ? { ...old, entries: old.entries.filter((e) => e.id !== id) } : old),
      ),
    [queryClient, startISO, endISO],
  )

  const reload = useCallback(
    () => queryClient.invalidateQueries({ queryKey: calendarKeys.entries(startISO, endISO) }),
    [queryClient, startISO, endISO],
  )

  return {
    entries: data?.entries ?? [],
    recipeMap: data?.recipeMap ?? EMPTY_RECIPE_MAP,
    loading: isLoading,
    removeEntry,
    reload,
  }
}

export default useCalendarData
