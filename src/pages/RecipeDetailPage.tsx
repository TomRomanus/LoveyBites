import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getRecipe, deleteRecipe } from '../services/recipes'
import type { Recipe } from '../types/recipe'

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!id) return
    getRecipe(id)
      .then(setRecipe)
      .finally(() => setLoading(false))
  }, [id])

  function toggleCheck(i: number) {
    setChecked((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  async function handleDelete() {
    if (!id || !confirm('Delete this recipe?')) return
    setDeleting(true)
    await deleteRecipe(id)
    navigate('/')
  }

  if (loading) {
    return <p className="text-center text-gray-400 mt-16">Loading…</p>
  }

  if (!recipe) {
    return (
      <div className="text-center mt-16">
        <p className="text-gray-500 mb-4">Recipe not found.</p>
        <Link to="/" className="text-rose-500 hover:underline">← Back to recipes</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-orange-50">
      <header className="bg-white border-b border-rose-100 px-4 py-4 flex items-center gap-3">
        <Link to="/" className="text-rose-400 hover:text-rose-600 text-xl">←</Link>
        <h1 className="flex-1 text-lg font-bold text-gray-900 truncate">{recipe.title}</h1>
        <Link
          to={`/edit/${recipe.id}`}
          className="text-sm text-rose-500 hover:text-rose-700 font-medium"
        >
          Edit
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {recipe.description && (
          <p className="text-gray-600 italic">{recipe.description}</p>
        )}

        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {recipe.tags.map((tag) => (
              <span key={tag} className="text-xs bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}

        {recipe.ingredients.length > 0 && (
          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-3">Ingredients</h2>
            <ul className="space-y-2">
              {recipe.ingredients.map((ing, i) => (
                <li
                  key={i}
                  onClick={() => toggleCheck(i)}
                  className="flex items-center gap-3 cursor-pointer select-none"
                >
                  <span
                    className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                      checked.has(i)
                        ? 'bg-rose-400 border-rose-400 text-white'
                        : 'border-gray-300'
                    }`}
                  >
                    {checked.has(i) && '✓'}
                  </span>
                  <span className={checked.has(i) ? 'line-through text-gray-400' : 'text-gray-700'}>
                    {ing}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {recipe.steps.length > 0 && (
          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-3">Steps</h2>
            <ol className="space-y-4">
              {recipe.steps.map((step, i) => (
                <li key={i} className="flex gap-4">
                  <span className="shrink-0 w-7 h-7 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    {i + 1}
                  </span>
                  <p className="text-gray-700 pt-0.5">{step}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-sm text-red-400 hover:text-red-600 disabled:opacity-50 transition-colors"
        >
          {deleting ? 'Deleting…' : 'Delete recipe'}
        </button>
      </main>
    </div>
  )
}
