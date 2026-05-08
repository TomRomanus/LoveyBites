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

const recipesCol = collection(db, 'recipes')

export async function getRecipes(): Promise<Recipe[]> {
  const q = query(recipesCol, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Recipe)
}

export async function getRecipe(id: string): Promise<Recipe | null> {
  const snapshot = await getDoc(doc(db, 'recipes', id))
  if (!snapshot.exists()) return null
  return { id: snapshot.id, ...snapshot.data() } as Recipe
}

export async function createRecipe(data: RecipeInput): Promise<string> {
  const ref = await addDoc(recipesCol, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateRecipe(id: string, data: Partial<RecipeInput>): Promise<void> {
  await updateDoc(doc(db, 'recipes', id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteRecipe(id: string): Promise<void> {
  await deleteDoc(doc(db, 'recipes', id))
}
