import type { Recipe } from '@/features/recipe/types/recipe'
import { extractLeafTexts } from '@/features/recipe/utils/ingredientUtils'

export function filterRecipesBySearch(recipes: Recipe[], query: string): Recipe[] {
  if (!query.trim()) return recipes
  const q = query.toLowerCase()
  return recipes.filter((recipe) => {
    if (recipe.title.toLowerCase().includes(q)) return true
    if (recipe.description?.toLowerCase().includes(q)) return true
    return extractLeafTexts(recipe.ingredients).some((t) => t.toLowerCase().includes(q))
  })
}

export function extractUniqueTags(recipes: Recipe[]): string[] {
  return [...new Set(recipes.flatMap((r) => r.tags))].sort((a, b) => a.localeCompare(b))
}
