import type { Timestamp } from 'firebase/firestore'

export interface Recipe {
  id: string
  title: string
  description: string
  ingredients: string[]
  steps: string[]
  tags: string[]
  imageUrl: string
  createdAt: Timestamp
  updatedAt: Timestamp
  createdBy: string
}

export type RecipeInput = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>
