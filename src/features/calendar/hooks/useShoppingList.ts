import { useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchEntriesWithRecipes } from '@/features/calendar/api/calendarQueries'
import { calendarKeys } from '@/features/calendar/api/queryKeys'
import type { Recipe } from '@/features/recipe/types/recipe'
import { extractLeafTexts } from '@/features/recipe/utils/ingredientUtils'
import { scaleIngredientText } from '@/features/recipe/utils/scaleIngredient'
import { formatEntryDate } from '@/features/calendar/utils/dateUtils'

type ShoppingSection = {
  label: string
  days: string[]
  ingredients: string[]
}

const useShoppingList = (from: string, to: string, visible: boolean) => {
  const { data, isLoading, isFetched } = useQuery({
    queryKey: calendarKeys.entries(from, to),
    queryFn: () => fetchEntriesWithRecipes(from, to),
    enabled: visible,
  })

  const sections = useMemo<ShoppingSection[]>(() => {
    const entries = data?.entries ?? []
    const recipeMap = data?.recipeMap ?? new Map<string, Recipe>()
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
  }, [data])

  const buildCopyText = useCallback(
    () =>
      sections
        .map((s) => {
          const dayStr = s.days.map(formatEntryDate).join(', ')
          return `${s.label} (${dayStr}):\n${s.ingredients.map((i) => `  - ${i}`).join('\n')}`
        })
        .join('\n\n'),
    [sections],
  )

  return { loading: isLoading, fetched: isFetched, sections, buildCopyText }
}

export default useShoppingList
