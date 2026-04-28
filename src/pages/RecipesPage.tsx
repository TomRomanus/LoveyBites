import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import RecipeCard from '../components/RecipeCard'
import { getRecipes } from '../services/recipes'
import type { Recipe } from '../types/recipe'
import { useAuth } from '../contexts/AuthContext'

function UserMenu() {
  const { user, signOutUser } = useAuth()
  if (!user) return null
  return (
    <div className="flex items-center gap-2.5">
      {user.photoURL && (
        <img
          src={user.photoURL}
          alt={user.displayName ?? ''}
          className="w-8 h-8 rounded-full ring-2 ring-stone-200"
          referrerPolicy="no-referrer"
        />
      )}
      <button
        onClick={signOutUser}
        className="text-sm text-stone-400 hover:text-clay-500 transition-colors"
      >
        Uitloggen
      </button>
    </div>
  )
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getRecipes()
      .then(setRecipes)
      .catch(() => setError('Recepten konden niet worden geladen. Controleer je Firebase-configuratie.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="w-20" />
        <h1 className="font-display text-2xl font-bold italic text-stone-900 tracking-tight">
          LoveyBites
        </h1>
        <UserMenu />
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {loading && (
          <p className="text-center text-stone-400 mt-12">Recepten laden…</p>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && recipes.length === 0 && (
          <div className="text-center mt-16">
            <p className="text-4xl mb-3">🍽️</p>
            <p className="text-stone-400 mb-6">Nog geen recepten — voeg je eerste toe!</p>
          </div>
        )}

        {!loading && !error && recipes.length > 0 && (
          <div className="grid gap-3">
            {recipes.map((r) => (
              <RecipeCard key={r.id} recipe={r} />
            ))}
          </div>
        )}
      </main>

      <Link
        to="/new"
        className="fixed bottom-8 right-5 bg-clay-500 hover:bg-clay-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl transition-colors"
        aria-label="Recept toevoegen"
      >
        +
      </Link>
    </div>
  )
}
