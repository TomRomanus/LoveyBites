import type { Timestamp } from 'firebase/firestore'

export type MealPlanEntry = {
  id: string
  date: string
  recipeId?: string
  recipeTitle?: string
  customDescription?: string
  createdAt: Timestamp
  createdBy: string
}

export type MealPlanEntryInput = Omit<MealPlanEntry, 'id' | 'createdAt'>

type IngredientLeaf = {
  kind: 'leaf'
  text: string
  id?: string
  ingredientRefs?: string[]
}

type IngredientGroup = {
  kind: 'group'
  title: string
  id?: string
  children: IngredientNode[]
}

export type IngredientNode = IngredientLeaf | IngredientGroup

export type Source = {
  label: string
  url: string
}

export type Recipe = {
  id: string
  title: string
  description: string
  ingredients: IngredientNode[]
  steps: IngredientNode[]
  sources?: Source[]
  tags: string[]
  imageUrl: string
  portions?: number
  portionsLabel?: 'pers' | 'stuks'
  rating?: number
  createdAt: Timestamp
  updatedAt: Timestamp
  createdBy: string
}

export type RecipeInput = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>
