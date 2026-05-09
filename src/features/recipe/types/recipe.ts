import type { Timestamp } from 'firebase/firestore'
import { z } from 'zod'

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

// ── Zod schemas ────────────────────────────────────────────────────────────────

const ingredientLeafSchema = z.object({
  kind: z.literal('leaf'),
  text: z.string(),
  id: z.string().optional(),
  ingredientRefs: z.array(z.string()).optional(),
})

export const ingredientNodeSchema: z.ZodType<IngredientNode> = z.lazy(() =>
  z.union([
    ingredientLeafSchema,
    z.object({
      kind: z.literal('group'),
      title: z.string(),
      id: z.string().optional(),
      children: z.array(ingredientNodeSchema),
    }),
  ]),
)

const sourceSchema = z.object({ label: z.string(), url: z.string() })

export const recipeSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  ingredients: z.array(ingredientNodeSchema),
  steps: z.array(ingredientNodeSchema),
  sources: z.array(sourceSchema).optional(),
  tags: z.array(z.string()),
  imageUrl: z.string(),
  portions: z.number().optional(),
  portionsLabel: z.enum(['pers', 'stuks']).optional(),
  rating: z.number().optional(),
  createdAt: z.unknown(),
  updatedAt: z.unknown(),
  createdBy: z.string(),
})

export const recipeInputSchema = z.object({
  title: z.string().min(1, 'Titel is verplicht'),
  description: z.string(),
  portions: z.number().optional(),
  portionsLabel: z.enum(['pers', 'stuks']).optional(),
  ingredients: z.array(ingredientNodeSchema),
  steps: z.array(ingredientNodeSchema),
  sources: z.array(sourceSchema).optional(),
  tags: z.array(z.string()),
  imageUrl: z.string(),
  createdBy: z.string(),
})
