import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import RecipeForm from '../components/RecipeForm'
import RecipeImport from '../components/RecipeImport'
import RecipeTextImport from '../components/RecipeTextImport'
import RecipePhotoImport from '../components/RecipePhotoImport'
import { createRecipe, updateRecipe, getRecipe } from '../services/recipes'
import type { RecipeInput } from '../types/recipe'

type Mode = 'url' | 'text' | 'photo' | 'manual'

const MODES: { id: Mode; label: string; description: string; icon: React.ReactNode }[] = [
  {
    id: 'url',
    label: 'Importeer via link',
    description: 'Plak een link van een receptenwebsite of TikTok',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
  {
    id: 'text',
    label: 'Typ of plak een recept',
    description: 'Schrijf het recept op zoals je het kent',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    id: 'photo',
    label: 'Foto van een recept',
    description: 'Maak een foto van een receptenboek of geschreven recept',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: 'manual',
    label: 'Handmatig invullen',
    description: 'Vul het recept zelf stap voor stap in',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
]

const isImportMode = (m: Mode | null): m is 'url' | 'text' | 'photo' =>
  m === 'url' || m === 'text' || m === 'photo'

function ImportStepper({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center gap-0">
      {/* Step 1 */}
      <div className="flex items-center gap-2">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${step === 1 ? 'bg-clay-500 text-white' : 'bg-clay-100 text-clay-500'}`}>
          {step > 1 ? (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          ) : '1'}
        </div>
        <span className={`text-xs font-medium ${step === 1 ? 'text-stone-700' : 'text-stone-400'}`}>Importeren</span>
      </div>
      {/* Connector */}
      <div className="flex-1 h-px bg-stone-200 mx-3 min-w-6" />
      {/* Step 2 */}
      <div className="flex items-center gap-2">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${step === 2 ? 'bg-clay-500 text-white' : 'bg-stone-100 text-stone-400'}`}>
          2
        </div>
        <span className={`text-xs font-medium ${step === 2 ? 'text-stone-700' : 'text-stone-400'}`}>Bewerken</span>
      </div>
    </div>
  )
}

export default function NewRecipePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [mode, setMode] = useState<Mode | null>(null)
  const [extracted, setExtracted] = useState(false)
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

  function handleSelectMode(m: Mode) {
    setMode(m)
    setExtracted(false)
  }

  function handleBack() {
    setMode(null)
    setExtracted(false)
  }

  function handleExtracted(data: Partial<RecipeInput>) {
    setInitial(data)
    setFormKey((k) => k + 1)
    setExtracted(true)
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

  const showForm = mode === 'manual' || extracted
  const showStepper = isImportMode(mode)

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        {mode !== null && !isEdit ? (
          <button onClick={handleBack} className="text-clay-400 hover:text-clay-600 text-xl w-8 flex items-center justify-center">
            ←
          </button>
        ) : (
          <Link to={id ? `/recipe/${id}` : '/'} className="text-clay-400 hover:text-clay-600 text-xl w-8 flex items-center justify-center">
            ←
          </Link>
        )}
        <h1 className="font-display text-xl font-bold italic text-stone-900">
          {isEdit ? 'Recept bewerken' : 'Nieuw recept'}
        </h1>
      </header>

      {/* Selection screen */}
      {!isEdit && mode === null && (
        <main className="max-w-2xl mx-auto px-4 py-8 space-y-3">
          <p className="text-sm text-stone-500 mb-5">Hoe wil je het recept toevoegen?</p>
          {MODES.map(({ id: modeId, label, description, icon }) => (
            <button
              key={modeId}
              onClick={() => handleSelectMode(modeId)}
              className="w-full flex items-center gap-4 bg-white border border-stone-200 hover:border-clay-300 hover:bg-clay-50 rounded-2xl px-5 py-4 text-left transition-colors group"
            >
              <span className="text-clay-400 group-hover:text-clay-600 transition-colors shrink-0">
                {icon}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-stone-800">{label}</span>
                <span className="block text-xs text-stone-400 mt-0.5">{description}</span>
              </span>
              <span className="text-stone-300 group-hover:text-clay-400 transition-colors text-lg">→</span>
            </button>
          ))}
        </main>
      )}

      {/* Import step */}
      {!isEdit && isImportMode(mode) && !extracted && (
        <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
          <ImportStepper step={1} />
          {mode === 'url' && <RecipeImport onExtracted={handleExtracted} />}
          {mode === 'text' && <RecipeTextImport onExtracted={handleExtracted} />}
          {mode === 'photo' && <RecipePhotoImport onExtracted={handleExtracted} />}
        </main>
      )}

      {/* Edit step */}
      {(isEdit || showForm) && (
        <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
          {showStepper && <ImportStepper step={2} />}
          <RecipeForm
            key={formKey}
            initial={initial}
            onSubmit={handleSubmit}
            submitLabel={isEdit ? 'Wijzigingen opslaan' : 'Recept toevoegen'}
          />
        </main>
      )}
    </div>
  )
}
