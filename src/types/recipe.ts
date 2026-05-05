import type { Timestamp } from 'firebase/firestore'

export interface MealPlanEntry {
  id: string
  date: string
  recipeId?: string
  recipeTitle?: string
  customDescription?: string
  createdAt: Timestamp
  createdBy: string
}

export type MealPlanEntryInput = Omit<MealPlanEntry, 'id' | 'createdAt'>

export interface IngredientLeaf {
  kind: 'leaf'
  text: string
  id?: string
  ingredientRefs?: string[]
}

export interface IngredientGroup {
  kind: 'group'
  title: string
  id?: string
  children: IngredientNode[]
}

export type IngredientNode = IngredientLeaf | IngredientGroup

export interface Source {
  label: string
  url: string
}

export interface Recipe {
  id: string
  title: string
  description: string
  ingredients: IngredientNode[]
  steps: IngredientNode[]
  sources?: Source[]
  tags: string[]
  imageUrl: string
  color?: string
  portions?: number
  portionsLabel?: string
  rating?: number
  createdAt: Timestamp
  updatedAt: Timestamp
  createdBy: string
}

export type RecipeInput = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>
