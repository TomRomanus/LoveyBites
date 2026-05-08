import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { Recipe, RecipeInput } from '../types/recipe'
import { recipeSchema } from '../types/recipe'

const recipesCol = collection(db, 'recipes')

export const getRecipes = async (): Promise<Recipe[]> => {
  const q = query(recipesCol, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => recipeSchema.parse({ id: d.id, ...d.data() }))
}

export const getRecipe = async (id: string): Promise<Recipe | null> => {
  const snapshot = await getDoc(doc(db, 'recipes', id))
  if (!snapshot.exists()) return null
  return recipeSchema.parse({ id: snapshot.id, ...snapshot.data() })
}

export const createRecipe = async (data: RecipeInput): Promise<string> => {
  const ref = await addDoc(recipesCol, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export const updateRecipe = async (id: string, data: Partial<RecipeInput>): Promise<void> => {
  await updateDoc(doc(db, 'recipes', id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export const deleteRecipe = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'recipes', id))
}
