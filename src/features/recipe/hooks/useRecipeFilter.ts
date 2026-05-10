import { useMemo, useState } from 'react'
import type { Recipe } from '@/features/recipe/types/recipe'
import { extractLeafTexts } from '@/features/recipe/utils/ingredientUtils'

export type SortOption = 'newest' | 'name-asc' | 'name-desc' | 'rating-desc' | 'rating-asc'

export const SORT_LABELS: Record<SortOption, string> = {
  newest: 'Nieuwste eerst',
  'name-asc': 'Naam A → Z',
  'name-desc': 'Naam Z → A',
  'rating-desc': 'Hoogste beoordeling',
  'rating-asc': 'Laagste beoordeling',
}

const useRecipeFilter = (recipes: Recipe[]) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [sort, setSort] = useState<SortOption>('newest')

  const allTags = useMemo(
    () => [...new Set(recipes.flatMap((r) => r.tags))].sort((a, b) => a.localeCompare(b)),
    [recipes],
  )

  const filtered = useMemo(
    () =>
      recipes.filter((recipe) => {
        if (activeTags.length && !activeTags.every((t) => recipe.tags.includes(t))) return false
        if (!searchQuery.trim()) return true
        const q = searchQuery.toLowerCase()
        if (recipe.title.toLowerCase().includes(q)) return true
        if (recipe.description?.toLowerCase().includes(q)) return true
        return extractLeafTexts(recipe.ingredients).some((t) => t.toLowerCase().includes(q))
      }),
    [recipes, searchQuery, activeTags],
  )

  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        switch (sort) {
          case 'name-asc':
            return a.title.localeCompare(b.title)
          case 'name-desc':
            return b.title.localeCompare(a.title)
          case 'rating-desc':
            return (b.rating ?? 0) - (a.rating ?? 0)
          case 'rating-asc':
            return (a.rating ?? 0) - (b.rating ?? 0)
          default:
            return 0
        }
      }),
    [filtered, sort],
  )

  const clearFilters = () => {
    setSearchQuery('')
    setActiveTags([])
  }

  return {
    searchQuery,
    setSearchQuery,
    activeTags,
    setActiveTags,
    sort,
    setSort,
    allTags,
    sorted,
    clearFilters,
  }
}

export default useRecipeFilter
