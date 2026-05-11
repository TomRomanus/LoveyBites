import type { Recipe, IngredientNode as TreeNode } from '@/features/recipe/types/recipe'

export type { TreeNode }

export type FlatStep = {
  text: string
  sectionTitle?: string
  ingredientRefs?: string[]
  ingredientAmounts?: Record<string, string>
  globalIndex: number
}

export type CookTab = 'step' | 'ingredients' | 'overview'

export type CookingScreenProps = {
  recipe: Recipe
  scaledIngredients: TreeNode[]
  selectedPortions: number
  onPortionsChange: (p: number) => void
  checked: Set<string>
  onToggle: (path: string) => void
  onClose: () => void
}
