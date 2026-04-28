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
    <ul className="space-y-2">
      {nodes.map((node, i) => {
        const path = `${pathPrefix}${i}`
        if (node.kind === 'leaf') {
          const isChecked = checked.has(path)
          return (
            <li
              key={path}
              onClick={() => onToggle(path)}
              className="flex items-center gap-3 cursor-pointer select-none py-0.5"
            >
              <span
                className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                  isChecked ? 'bg-clay-500 border-clay-500 text-white' : 'border-stone-300'
                }`}
              >
                {isChecked && <span className="text-xs leading-none">✓</span>}
              </span>
              <span className={isChecked ? 'line-through text-stone-300' : 'text-stone-700'}>
                {node.text}
              </span>
            </li>
          )
        }

        const headingClass =
          depth === 0
            ? 'font-display text-sm font-semibold text-stone-800 mt-5 mb-2 italic'
            : 'text-xs font-semibold text-stone-500 uppercase tracking-wider mt-4 mb-1'

        return (
          <li key={path}>
            {node.title && <p className={headingClass}>{node.title}</p>}
            <div className={depth > 0 ? 'pl-3 border-l border-stone-200' : ''}>
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

function collectIngredientMap(nodes: TreeNode[]): Map<string, string> {
  const map = new Map<string, string>()
  function traverse(ns: TreeNode[]) {
    for (const node of ns) {
      if (node.kind === 'leaf' && node.id) {
        map.set(node.id, node.text)
      } else if (node.kind === 'group') {
        traverse(node.children)
      }
    }
  }
  traverse(nodes)
  return map
}

interface StepListProps {
  nodes: TreeNode[]
  depth: number
  ingredientMap: Map<string, string>
}

function StepList({ nodes, depth, ingredientMap }: StepListProps) {
  let leafCounter = 0
  const headingClass =
    depth === 0
      ? 'font-display text-sm font-semibold text-stone-800 mt-5 mb-2 italic'
      : 'text-xs font-semibold text-stone-500 uppercase tracking-wider mt-4 mb-1'

  return (
    <ol className="space-y-4">
      {nodes.map((node, i) => {
        if (node.kind === 'leaf') {
          leafCounter++
          const num = leafCounter
          const stepIngredients = (node.ingredientRefs ?? [])
            .map((id) => ingredientMap.get(id))
            .filter((t): t is string => t !== undefined)
          return (
            <li key={i}>
              {stepIngredients.length > 0 && (
                <div className="mb-1.5 pl-11 flex flex-wrap gap-1">
                  {stepIngredients.map((text, j) => (
                    <span
                      key={j}
                      className="text-xs bg-clay-50 text-clay-600 border border-clay-200 rounded-full px-2 py-0.5"
                    >
                      {text}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-4">
                <span className="shrink-0 w-7 h-7 bg-clay-100 text-clay-600 rounded-full flex items-center justify-center text-sm font-semibold font-display">
                  {num}
                </span>
                <p className="text-stone-700 pt-0.5 leading-relaxed">{node.text}</p>
              </div>
            </li>
          )
        }

        return (
          <li key={i}>
            {node.title && <p className={headingClass}>{node.title}</p>}
            <div className={depth > 0 ? 'pl-3 border-l border-stone-200' : ''}>
              <StepList nodes={node.children} depth={depth + 1} ingredientMap={ingredientMap} />
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
    return <p className="text-center text-stone-400 mt-16">Laden…</p>
  }

  if (!recipe) {
    return (
      <div className="text-center mt-16">
        <p className="text-stone-500 mb-4">Recept niet gevonden.</p>
        <Link to="/" className="text-clay-500 hover:underline">← Terug naar recepten</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <Link to="/" className="text-clay-400 hover:text-clay-600 text-xl w-8 flex items-center justify-center">←</Link>
        <h1 className="flex-1 font-display text-xl font-bold italic text-stone-900 truncate">{recipe.title}</h1>
        <Link
          to={`/edit/${recipe.id}`}
          className="text-sm text-clay-500 hover:text-clay-700 font-medium"
        >
          Bewerken
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        <div className="space-y-3">
          {recipe.description && (
            <p className="text-stone-500 italic leading-relaxed">{recipe.description}</p>
          )}
          <div>
            <p className="text-xs text-stone-400 mb-1.5 uppercase tracking-wider font-medium">Beoordeling</p>
            <StarRating value={recipe.rating ?? 0} onChange={handleRatingChange} />
          </div>
        </div>

        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {recipe.tags.map((tag) => (
              <span key={tag} className="text-xs bg-clay-50 text-clay-600 px-3 py-1 rounded-full font-medium">
                {tag}
              </span>
            ))}
          </div>
        )}

        {recipe.ingredients.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold italic text-stone-900">Ingrediënten</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedPortions((p) => Math.max(1, p - 1))}
                  className="w-10 h-10 rounded-full border border-stone-300 text-stone-500 hover:border-clay-400 hover:text-clay-500 flex items-center justify-center text-sm font-medium transition-colors"
                  aria-label="Minder porties"
                >−</button>
                <span className="text-sm text-stone-600 min-w-[4.5rem] text-center">
                  {selectedPortions} {selectedPortions === 1 ? 'portie' : 'porties'}
                </span>
                <button
                  onClick={() => setSelectedPortions((p) => p + 1)}
                  className="w-10 h-10 rounded-full border border-stone-300 text-stone-500 hover:border-clay-400 hover:text-clay-500 flex items-center justify-center text-sm font-medium transition-colors"
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
            <h2 className="font-display text-xl font-semibold italic text-stone-900 mb-4">Stappen</h2>
            <StepList
              nodes={recipe.steps}
              depth={0}
              ingredientMap={collectIngredientMap(
                scaleIngredients(recipe.ingredients, selectedPortions / (recipe.portions ?? 4))
              )}
            />
          </section>
        )}

        {(recipe.sources ?? []).length > 0 && (
          <section>
            <h2 className="font-display text-xl font-semibold italic text-stone-900 mb-3">Bronnen</h2>
            <ul className="space-y-3">
              {(recipe.sources ?? []).map((source, i) => {
                const isImage = /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(source.url)
                return (
                  <li key={i}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-clay-500 hover:text-clay-700 underline text-sm break-all"
                    >
                      {source.label.trim() || source.url}
                    </a>
                    {isImage && (
                      <img
                        src={source.url}
                        alt={source.label || source.url}
                        className="mt-2 w-full max-h-48 rounded-2xl object-cover border border-stone-200"
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
          className="text-sm text-stone-400 hover:text-red-500 disabled:opacity-50 transition-colors"
        >
          {deleting ? 'Verwijderen…' : 'Recept verwijderen'}
        </button>
      </main>
    </div>
  )
}
