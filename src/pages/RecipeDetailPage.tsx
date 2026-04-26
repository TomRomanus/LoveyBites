import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getRecipe, deleteRecipe, updateRecipe } from '../services/recipes'
import type { Recipe, IngredientNode as TreeNode } from '../types/recipe'
import { scaleIngredients } from '../utils/scaleIngredient'
import StarRating from '../components/StarRating'

interface IngredientListProps {
  nodes: TreeNode[]
  pathPrefix: string
  depth: number
  checked: Set<string>
  onToggle: (path: string) => void
}

function IngredientList({ nodes, pathPrefix, depth, checked, onToggle }: IngredientListProps) {
  return (
    <ul className="space-y-1">
      {nodes.map((node, i) => {
        const path = `${pathPrefix}${i}`
        if (node.kind === 'leaf') {
          const isChecked = checked.has(path)
          return (
            <li
              key={path}
              onClick={() => onToggle(path)}
              className="flex items-center gap-3 cursor-pointer select-none"
            >
              <span
                className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                  isChecked ? 'bg-rose-400 border-rose-400 text-white' : 'border-gray-300'
                }`}
              >
                {isChecked && '✓'}
              </span>
              <span className={isChecked ? 'line-through text-gray-400' : 'text-gray-700'}>
                {node.text}
              </span>
            </li>
          )
        }

        const headingClass =
          depth === 0
            ? 'text-sm font-semibold text-gray-800 mt-4 mb-1'
            : 'text-xs font-semibold text-gray-600 uppercase tracking-wide mt-3 mb-0.5'

        return (
          <li key={path}>
            {node.title && <p className={headingClass}>{node.title}</p>}
            <div className={depth > 0 ? 'pl-3 border-l border-gray-200' : ''}>
              <IngredientList
                nodes={node.children}
                pathPrefix={`${path}.`}
                depth={depth + 1}
                checked={checked}
                onToggle={onToggle}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

interface StepListProps {
  nodes: TreeNode[]
  depth: number
}

function StepList({ nodes, depth }: StepListProps) {
  // Number only the leaf nodes within this level
  let leafCounter = 0
  const headingClass =
    depth === 0
      ? 'text-sm font-semibold text-gray-800 mt-4 mb-2'
      : 'text-xs font-semibold text-gray-600 uppercase tracking-wide mt-3 mb-1'

  return (
    <ol className="space-y-3">
      {nodes.map((node, i) => {
        if (node.kind === 'leaf') {
          leafCounter++
          const num = leafCounter
          return (
            <li key={i} className="flex gap-4">
              <span className="shrink-0 w-7 h-7 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-sm font-semibold">
                {num}
              </span>
              <p className="text-gray-700 pt-0.5">{node.text}</p>
            </li>
          )
        }

        return (
          <li key={i}>
            {node.title && <p className={headingClass}>{node.title}</p>}
            <div className={depth > 0 ? 'pl-3 border-l border-gray-200' : ''}>
              <StepList nodes={node.children} depth={depth + 1} />
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [selectedPortions, setSelectedPortions] = useState(4)

  useEffect(() => {
    if (recipe) setSelectedPortions(recipe.portions ?? 4)
  }, [recipe])

  useEffect(() => {
    if (!id) return
    getRecipe(id)
      .then(setRecipe)
      .finally(() => setLoading(false))
  }, [id])

  function toggleCheck(path: string) {
    setChecked((prev) => {
      const next = new Set(prev)
      next.has(path) ? next.delete(path) : next.add(path)
      return next
    })
  }

  async function handleRatingChange(rating: number) {
    if (!id || !recipe) return
    await updateRecipe(id, { rating })
    setRecipe({ ...recipe, rating })
  }

  async function handleDelete() {
    if (!id || !confirm('Dit recept verwijderen?')) return
    setDeleting(true)
    await deleteRecipe(id)
    navigate('/')
  }

  if (loading) {
    return <p className="text-center text-gray-400 mt-16">Laden…</p>
  }

  if (!recipe) {
    return (
      <div className="text-center mt-16">
        <p className="text-gray-500 mb-4">Recept niet gevonden.</p>
        <Link to="/" className="text-rose-500 hover:underline">← Terug naar recepten</Link>
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
          Bewerken
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        <div className="space-y-2">
          {recipe.description && (
            <p className="text-gray-600 italic">{recipe.description}</p>
          )}
          <div>
            <p className="text-xs text-gray-400 mb-1">Beoordeling</p>
            <StarRating value={recipe.rating ?? 0} onChange={handleRatingChange} />
          </div>
        </div>

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
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-800">Ingrediënten</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedPortions((p) => Math.max(1, p - 1))}
                  className="w-7 h-7 rounded-full border border-gray-300 text-gray-500 hover:border-rose-400 hover:text-rose-500 flex items-center justify-center text-sm font-medium transition-colors"
                  aria-label="Minder porties"
                >−</button>
                <span className="text-sm text-gray-700 min-w-[4rem] text-center">
                  {selectedPortions} {selectedPortions === 1 ? 'portie' : 'porties'}
                </span>
                <button
                  onClick={() => setSelectedPortions((p) => p + 1)}
                  className="w-7 h-7 rounded-full border border-gray-300 text-gray-500 hover:border-rose-400 hover:text-rose-500 flex items-center justify-center text-sm font-medium transition-colors"
                  aria-label="Meer porties"
                >+</button>
              </div>
            </div>
            <IngredientList
              nodes={scaleIngredients(recipe.ingredients, selectedPortions / (recipe.portions ?? 4))}
              pathPrefix=""
              depth={0}
              checked={checked}
              onToggle={toggleCheck}
            />
          </section>
        )}

        {recipe.steps.length > 0 && (
          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-3">Stappen</h2>
            <StepList nodes={recipe.steps} depth={0} />
          </section>
        )}

        {(recipe.sources ?? []).length > 0 && (
          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-3">Bronnen</h2>
            <ul className="space-y-3">
              {(recipe.sources ?? []).map((source, i) => {
                const isImage = /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(source.url)
                return (
                  <li key={i}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-rose-500 hover:text-rose-700 underline text-sm break-all"
                    >
                      {source.label.trim() || source.url}
                    </a>
                    {isImage && (
                      <img
                        src={source.url}
                        alt={source.label || source.url}
                        className="mt-2 max-h-40 rounded-lg object-cover border border-gray-200"
                      />
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-sm text-red-400 hover:text-red-600 disabled:opacity-50 transition-colors"
        >
          {deleting ? 'Verwijderen…' : 'Recept verwijderen'}
        </button>
      </main>
    </div>
  )
}
