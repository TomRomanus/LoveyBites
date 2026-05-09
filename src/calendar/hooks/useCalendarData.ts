import { useCallback, useEffect, useState } from 'react'
import { getMealPlanEntries } from '../services/mealPlan'
import { getRecipe } from '../../recipe/services/recipes'
import type { MealPlanEntry, Recipe } from '../../recipe/types/recipe'

const useCalendarData = (visibleStartISO: string, visibleEndISO: string) => {
  const [entries, setEntries] = useState<MealPlanEntry[]>([])
  const [recipeMap, setRecipeMap] = useState<Map<string, Recipe>>(new Map())
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const es = await getMealPlanEntries(visibleStartISO, visibleEndISO)
    setEntries(es)
    const ids = [...new Set(es.map((e) => e.recipeId).filter(Boolean) as string[])]
    const pairs = await Promise.all(
      ids.map(async (id) => {
        const r = await getRecipe(id)
        return r ? ([id, r] as [string, Recipe]) : null
      }),
    )
    const map = new Map<string, Recipe>()
    pairs.forEach((p) => p && map.set(p[0], p[1]))
    setRecipeMap(map)
    setLoading(false)
  }, [visibleStartISO, visibleEndISO])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  return { entries, setEntries, recipeMap, loading, reload: load }
}

export default useCalendarData
