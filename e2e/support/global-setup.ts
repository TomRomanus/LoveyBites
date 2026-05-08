import { initializeApp, deleteApp } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

export const TEST_EMAIL = 'test@loveybites.test'
export const TEST_PASSWORD = 'TestPassword123!'

export const TEST_RECIPES = [
  {
    id: 'test-pasta-001',
    title: 'Pasta Carbonara',
    description: 'Een klassiek Italiaans gerecht met eieren, kaas en pancetta.',
    tags: ['pasta', 'italiaans'],
    ingredients: [
      { kind: 'leaf', text: '400g spaghetti', id: 'ing1' },
      { kind: 'leaf', text: '150g pancetta', id: 'ing2' },
      { kind: 'leaf', text: '4 eieren', id: 'ing3' },
      { kind: 'leaf', text: '100g Pecorino Romano', id: 'ing4' },
    ],
    steps: [
      { kind: 'leaf', text: 'Kook de spaghetti in gezouten water al dente' },
      { kind: 'leaf', text: 'Bak de pancetta knapperig in een koekenpan' },
      { kind: 'leaf', text: 'Klop de eieren los met geraspte kaas' },
      { kind: 'leaf', text: 'Meng alles voorzichtig buiten het vuur om' },
    ],
    sources: [],
    imageUrl: '',
    color: '#5C4033',
    portions: 4,
    portionsLabel: 'pers',
    rating: 4,
    createdBy: 'test-user-001',
  },
  {
    id: 'test-soup-001',
    title: 'Tomatensoep',
    description: 'Warme klassieke tomatensoep met verse tomaten.',
    tags: ['soep', 'vegetarisch'],
    ingredients: [
      { kind: 'leaf', text: '800g tomaten', id: 'ing1' },
      { kind: 'leaf', text: '1 ui', id: 'ing2' },
      { kind: 'leaf', text: '2 teentjes knoflook', id: 'ing3' },
    ],
    steps: [
      { kind: 'leaf', text: 'Snij de ui en knoflook fijn' },
      { kind: 'leaf', text: 'Fruit de ui glazig' },
      { kind: 'leaf', text: 'Voeg tomaten toe en laat sudderen' },
      { kind: 'leaf', text: 'Mix glad met een staafmixer' },
    ],
    sources: [],
    imageUrl: '',
    color: '#8B2500',
    portions: 4,
    portionsLabel: 'pers',
    rating: 3.5,
    createdBy: 'test-user-001',
  },
  {
    id: 'test-cake-001',
    title: 'Appeltaart',
    description: 'Een traditionele Nederlandse appeltaart.',
    tags: ['dessert', 'bakken'],
    ingredients: [
      { kind: 'leaf', text: '300g bloem', id: 'ing1' },
      { kind: 'leaf', text: '150g boter', id: 'ing2' },
      { kind: 'leaf', text: '5 appels', id: 'ing3' },
      { kind: 'leaf', text: '100g suiker', id: 'ing4' },
    ],
    steps: [
      { kind: 'leaf', text: 'Maak het deeg van bloem, boter en suiker' },
      { kind: 'leaf', text: 'Schil en snij de appels' },
      { kind: 'leaf', text: 'Leg het deeg in de vorm' },
      { kind: 'leaf', text: 'Vul met appels en bak 45 minuten op 175°C' },
    ],
    sources: [],
    imageUrl: '',
    color: '#7B5B3A',
    portions: 8,
    portionsLabel: 'plakjes',
    rating: 4.5,
    createdBy: 'test-user-001',
  },
]

export default async function globalSetup() {
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8181'
  process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9199'

  const app = initializeApp({ projectId: 'demo-loveybites' }, 'test-setup')
  const db = getFirestore(app)
  const authAdmin = getAuth(app)

  // Clear existing data
  const [recipesDocs, mealPlanDocs] = await Promise.all([
    db.collection('recipes').listDocuments(),
    db.collection('mealPlan').listDocuments(),
  ])
  if (recipesDocs.length > 0 || mealPlanDocs.length > 0) {
    const batch = db.batch()
    recipesDocs.forEach((d) => batch.delete(d))
    mealPlanDocs.forEach((d) => batch.delete(d))
    await batch.commit()
  }

  // Create allowed test user
  try {
    await authAdmin.createUser({
      uid: 'test-user-001',
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      emailVerified: true,
    })
  } catch {
    await authAdmin.updateUser('test-user-001', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    })
  }

  // Create a user NOT in the allow-list (for auth rejection test)
  try {
    await authAdmin.createUser({
      uid: 'unauthorized-user-001',
      email: 'unauthorized@example.com',
      password: TEST_PASSWORD,
      emailVerified: true,
    })
  } catch {
    await authAdmin.updateUser('unauthorized-user-001', {
      email: 'unauthorized@example.com',
      password: TEST_PASSWORD,
    })
  }

  // Seed recipes
  const now = Timestamp.now()
  await Promise.all(
    TEST_RECIPES.map((r, i) => {
      const { id, ...data } = r
      return db
        .collection('recipes')
        .doc(id)
        .set({
          ...data,
          // stagger createdAt so default sort order is deterministic
          createdAt: Timestamp.fromMillis(now.toMillis() - i * 1000),
          updatedAt: now,
        })
    }),
  )

  await deleteApp(app)
}
