import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import RecipeForm from '../components/RecipeForm'
import RecipeImport from '../components/RecipeImport'
import { createRecipe, updateRecipe, getRecipe } from '../services/recipes'
import type { RecipeInput } from '../types/recipe'

export default function NewRecipePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [initial, setInitial] = useState<Partial<RecipeInput> | undefined>(undefined)
  const [formKey, setFormKey] = useState(0)
  const [loading, setLoading] = useState(isEdit)

  useEffect(() => {
    if (!id) return
    getRecipe(id).then((r) => {
      if (r) setInitial(r)
      setLoading(false)
    })
  }, [id])

  function handleExtracted(data: Partial<RecipeInput>) {
    setInitial(data)
    setFormKey((k) => k + 1)
  }

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
    return <p className="text-center text-stone-400 mt-16">Laden…</p>
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <Link to={id ? `/recipe/${id}` : '/'} className="text-clay-400 hover:text-clay-600 text-xl w-8 flex items-center justify-center">
          ←
        </Link>
        <h1 className="font-display text-xl font-bold italic text-stone-900">
          {isEdit ? 'Recept bewerken' : 'Nieuw recept'}
        </h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {!isEdit && <RecipeImport onExtracted={handleExtracted} />}
        <RecipeForm
          key={formKey}
          initial={initial}
          onSubmit={handleSubmit}
          submitLabel={isEdit ? 'Wijzigingen opslaan' : 'Recept toevoegen'}
        />
      </main>
    </div>
  )
}
