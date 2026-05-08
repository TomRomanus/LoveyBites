import {
  collection,
  doc,
  getDocs,
  addDoc,
  deleteDoc,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { MealPlanEntry, MealPlanEntryInput } from '../types/recipe'

const mealPlanCol = collection(db, 'mealPlan')

export async function getMealPlanEntries(
  startDate: string,
  endDate: string
): Promise<MealPlanEntry[]> {
  // Use orderBy-only (no where filters) to avoid the Firestore emulator's
  // cold-start hang on range queries. Client-side filtering is fine for the
  // small meal-plan collection.
  const q = query(mealPlanCol, orderBy('date'))
  const snapshot = await getDocs(q)
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }) as MealPlanEntry)
    .filter((e) => e.date >= startDate && e.date <= endDate)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      return (a.createdAt?.toMillis() ?? 0) - (b.createdAt?.toMillis() ?? 0)
    })
}

export async function createMealPlanEntry(data: MealPlanEntryInput): Promise<string> {
  const ref = await addDoc(mealPlanCol, {
    ...data,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function deleteMealPlanEntry(id: string): Promise<void> {
  await deleteDoc(doc(db, 'mealPlan', id))
}
