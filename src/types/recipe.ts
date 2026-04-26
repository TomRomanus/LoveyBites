import type { Timestamp } from 'firebase/firestore'

export interface IngredientLeaf {
  kind: 'leaf'
  text: string
}

export interface IngredientGroup {
  kind: 'group'
  title: string
  children: IngredientNode[]
}

export type IngredientNode = IngredientLeaf | IngredientGroup

export interface Recipe {
  id: string
  title: string
  description: string
  ingredients: IngredientNode[]
  steps: IngredientNode[]
  tags: string[]
  imageUrl: string
  rating?: number
  createdAt: Timestamp
  updatedAt: Timestamp
  createdBy: string
}

export type RecipeInput = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>
