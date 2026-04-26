import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import RecipeForm from '../components/RecipeForm'
import { createRecipe, updateRecipe, getRecipe } from '../services/recipes'
import type { RecipeInput } from '../types/recipe'

export default function NewRecipePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [initial, setInitial] = useState<Partial<RecipeInput> | undefined>(undefined)
  const [loading, setLoading] = useState(isEdit)

  useEffect(() => {
    if (!id) return
    getRecipe(id).then((r) => {
      if (r) setInitial(r)
      setLoading(false)
    })
  }, [id])

  async function handleSubmit(data: RecipeInput) {
    if (id) {
      await updateRecipe(id, data)
      navigate(`/recipe/${id}`)
    } else {
      const newId = await createRecipe(data)
      navigate(`/recipe/${newId}`)
    }
  }

  if (loading) {
    return <p className="text-center text-gray-400 mt-16">Laden…</p>
  }

  return (
    <div className="min-h-screen bg-orange-50">
      <header className="bg-white border-b border-rose-100 px-4 py-4 flex items-center gap-3">
        <Link to={id ? `/recipe/${id}` : '/'} className="text-rose-400 hover:text-rose-600 text-xl">
          ←
        </Link>
        <h1 className="text-lg font-bold text-gray-900">
          {isEdit ? 'Recept bewerken' : 'Nieuw recept'}
        </h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <RecipeForm
          initial={initial}
          onSubmit={handleSubmit}
          submitLabel={isEdit ? 'Wijzigingen opslaan' : 'Recept toevoegen'}
        />
      </main>
    </div>
  )
}
