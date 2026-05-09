import type { Timestamp } from 'firebase/firestore'

export type ViewMode = 'week' | 'month'

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
