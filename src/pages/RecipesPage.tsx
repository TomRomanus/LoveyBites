import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import RecipeCard from '../components/RecipeCard'
import { getRecipes } from '../services/recipes'
import type { Recipe } from '../types/recipe'

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getRecipes()
      .then(setRecipes)
      .catch(() => setError('Could not load recipes. Check your Firebase config.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-orange-50">
      <header className="bg-white border-b border-rose-100 px-4 py-4">
        <h1 className="text-2xl font-bold text-rose-500 text-center tracking-tight">
          🍴 LoveyBites
        </h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {loading && (
          <p className="text-center text-gray-400 mt-12">Loading recipes…</p>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && recipes.length === 0 && (
          <div className="text-center mt-16">
            <p className="text-4xl mb-3">🍽️</p>
            <p className="text-gray-500 mb-6">No recipes yet — add your first one!</p>
          </div>
        )}

        {!loading && !error && recipes.length > 0 && (
          <div className="grid gap-4">
            {recipes.map((r) => (
              <RecipeCard key={r.id} recipe={r} />
            ))}
          </div>
        )}
      </main>

      <Link
        to="/new"
        className="fixed bottom-6 right-6 bg-rose-500 hover:bg-rose-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl transition-colors"
        aria-label="Add recipe"
      >
        +
      </Link>
    </div>
  )
}
