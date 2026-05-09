import { getMealPlanEntries } from '@/features/calendar/api/mealPlan'
import { getRecipe } from '@/features/recipe/api/recipes'
import type { MealPlanEntry } from '@/features/calendar/types/calendar'
import type { Recipe } from '@/features/recipe/types/recipe'

export type EntriesWithRecipes = { entries: MealPlanEntry[]; recipeMap: Map<string, Recipe> }

export const fetchEntriesWithRecipes = async (
  from: string,
  to: string,
): Promise<EntriesWithRecipes> => {
  const entries = await getMealPlanEntries(from, to)
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
