import { expect, Page } from '@playwright/test'
import { initializeApp, deleteApp } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { TEST_RECIPES } from './global-setup'

export async function waitForData(page: Page, detachTimeout = 20_000) {
  await page
    .locator('.lb-skeleton')
    .first()
    .waitFor({ state: 'visible', timeout: 5_000 })
    .catch(() => {})
  await expect(page.locator('.lb-skeleton')).toHaveCount(0, { timeout: detachTimeout })
}

export function locateCloseButton(page: Page) {
  return page
    .locator('button')
    .filter({
      has: page.locator('svg path[d*="M18 6L6 18"]'),
    })
    .first()
}

export async function resetMealPlan() {
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8181'
  const app = initializeApp({ projectId: 'demo-loveybites' }, 'reset-' + Date.now())
  const db = getFirestore(app)
  const docs = await db.collection('mealPlan').listDocuments()
  if (docs.length > 0) {
    const batch = db.batch()
    docs.forEach((d) => batch.delete(d))
    await batch.commit()
  }
  await deleteApp(app)
}

export async function reseedRecipes() {
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8181'
  const app = initializeApp({ projectId: 'demo-loveybites' }, 'reseed-' + Date.now())
  const db = getFirestore(app)
  const docs = await db.collection('recipes').listDocuments()
  const batch = db.batch()
  docs.forEach((d) => batch.delete(d))
  const now = Timestamp.now()
  TEST_RECIPES.forEach((r, i) => {
    const { id, ...data } = r
    batch.set(db.collection('recipes').doc(id), {
      ...data,
      createdAt: Timestamp.fromMillis(now.toMillis() - i * 1000),
      updatedAt: now,
    })
  })
  await batch.commit()
  await deleteApp(app)
}

export async function deleteAllRecipes() {
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8181'
  const app = initializeApp({ projectId: 'demo-loveybites' }, 'delete-all-recipes-' + Date.now())
  const db = getFirestore(app)
  const docs = await db.collection('recipes').listDocuments()
  if (docs.length > 0) {
    const batch = db.batch()
    docs.forEach((d) => batch.delete(d))
    await batch.commit()
  }
  await deleteApp(app)
}

export async function seedMealPlanEntry(recipeId: string, date?: string) {
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8181'
  const app = initializeApp({ projectId: 'demo-loveybites' }, 'seed-meal-' + Date.now())
  const db = getFirestore(app)
  const today = new Date()
  const isoDate =
    date ??
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  await db.collection('mealPlan').add({ recipeId, date: isoDate })
  await deleteApp(app)
}

export async function resetSignupUser() {
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8181'
  process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9199'
  const app = initializeApp({ projectId: 'demo-loveybites' }, 'signup-reset-' + Date.now())
  const adminAuth = getAuth(app)
  try {
    const user = await adminAuth.getUserByEmail('signup@loveybites.test')
    await adminAuth.deleteUser(user.uid)
  } catch {
    // User doesn't exist, that's fine
  }
  await deleteApp(app)
}
