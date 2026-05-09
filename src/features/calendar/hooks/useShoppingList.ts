import { useEffect, useMemo, useState } from 'react'
import { getMealPlanEntries } from '@/features/calendar/api/mealPlan'
import { getRecipe } from '@/features/recipe/api/recipes'
import type { MealPlanEntry, Recipe } from '@/features/recipe/types/recipe'
import { extractLeafTexts } from '@/features/recipe/utils/ingredientUtils'
import { scaleIngredientText } from '@/features/recipe/utils/scaleIngredient'
import { formatEntryDate } from '@/features/calendar/utils/calendarUtils'

type ShoppingSection = {
  label: string
  days: string[]
  ingredients: string[]
}

const useShoppingList = (from: string, to: string, visible: boolean) => {
  const [entries, setEntries] = useState<MealPlanEntry[]>([])
  const [recipeMap, setRecipeMap] = useState<Map<string, Recipe>>(new Map())
  const [loading, setLoading] = useState(false)
  const [fetched, setFetched] = useState(false)

  useEffect(() => {
    if (!visible) return
    const fetch = async () => {
      setLoading(true)
      setFetched(false)
      setEntries([])
      setRecipeMap(new Map())
      try {
        const es = await getMealPlanEntries(from, to)
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
      } finally {
        setLoading(false)
        setFetched(true)
      }
    }
    const t = setTimeout(fetch, 350)
    return () => clearTimeout(t)
  }, [from, to, visible])

  const sections = useMemo<ShoppingSection[]>(() => {
    const sectionsMap = new Map<
      string,
      { label: string; days: string[]; baseIngredients: string[]; count: number; portions: number }
    >()
    entries.forEach((entry) => {
      if (!entry.recipeId) return
      const recipe = recipeMap.get(entry.recipeId)
      if (!recipe) return
      const existing = sectionsMap.get(entry.recipeId)
      if (existing) {
        existing.days.push(entry.date)
        existing.count += 1
      } else {
        sectionsMap.set(entry.recipeId, {
          label: recipe.title,
          days: [entry.date],
          baseIngredients: extractLeafTexts(recipe.ingredients),
          count: 1,
          portions: recipe.portions ?? 2,
        })
      }
    })
    return [...sectionsMap.values()].map((s) => ({
      label: s.label,
      days: s.days,
      ingredients: s.baseIngredients.map((i) => scaleIngredientText(i, (2 * s.count) / s.portions)),
    }))
  }, [entries, recipeMap])

  const buildCopyText = () =>
    sections
      .map((s) => {
        const dayStr = s.days.map(formatEntryDate).join(', ')
        return `${s.label} (${dayStr}):\n${s.ingredients.map((i) => `  - ${i}`).join('\n')}`
      })
      .join('\n\n')

  return { loading, fetched, sections, buildCopyText }
}

export default useShoppingList
