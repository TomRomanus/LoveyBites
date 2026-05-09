import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getMealPlanEntries } from '@/features/calendar/api/mealPlan'
import { getRecipe } from '@/features/recipe/api/recipes'
import { calendarKeys } from '@/features/calendar/api/queryKeys'
import type { MealPlanEntry } from '@/features/calendar/types/calendar'
import type { Recipe } from '@/features/recipe/types/recipe'

type CalendarData = { entries: MealPlanEntry[]; recipeMap: Map<string, Recipe> }

const fetchCalendarData = async (startISO: string, endISO: string): Promise<CalendarData> => {
  const entries = await getMealPlanEntries(startISO, endISO)
  const ids = [...new Set(entries.map((e) => e.recipeId).filter(Boolean) as string[])]
  const pairs = await Promise.all(
    ids.map(async (id) => {
      const r = await getRecipe(id)
      return r ? ([id, r] as [string, Recipe]) : null
    }),
  )
  const recipeMap = new Map<string, Recipe>()
  pairs.forEach((p) => p && recipeMap.set(p[0], p[1]))
  return { entries, recipeMap }
}

const useCalendarData = (startISO: string, endISO: string) => {
  const queryClient = useQueryClient()
  const key = calendarKeys.entries(startISO, endISO)

  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: () => fetchCalendarData(startISO, endISO),
  })

  const removeEntry = (id: string) =>
    queryClient.setQueryData<CalendarData>(key, (old) =>
      old ? { ...old, entries: old.entries.filter((e) => e.id !== id) } : old,
    )

  const reload = () => queryClient.invalidateQueries({ queryKey: key })

  return {
    entries: data?.entries ?? [],
    recipeMap: data?.recipeMap ?? new Map<string, Recipe>(),
    loading: isLoading,
    removeEntry,
    reload,
  }
}

export default useCalendarData
