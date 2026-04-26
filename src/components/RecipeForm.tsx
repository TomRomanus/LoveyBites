import { useState } from 'react'
import type { RecipeInput } from '../types/recipe'

interface Props {
  initial?: Partial<RecipeInput>
  onSubmit: (data: RecipeInput) => Promise<void>
  submitLabel: string
}

const emptyInput = (): RecipeInput => ({
  title: '',
  description: '',
  ingredients: [''],
  steps: [''],
  tags: [],
  imageUrl: '',
  createdBy: 'us',
})

export default function RecipeForm({ initial, onSubmit, submitLabel }: Props) {
  const [form, setForm] = useState<RecipeInput>({ ...emptyInput(), ...initial })
  const [tagInput, setTagInput] = useState((initial?.tags ?? []).join(', '))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function setField<K extends keyof RecipeInput>(key: K, value: RecipeInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function updateList(key: 'ingredients' | 'steps', index: number, value: string) {
    const next = [...form[key]]
    next[index] = value
    setField(key, next)
  }

  function addRow(key: 'ingredients' | 'steps') {
    setField(key, [...form[key], ''])
  }

  function removeRow(key: 'ingredients' | 'steps', index: number) {
    setField(key, form[key].filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const tags = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    const data: RecipeInput = {
      ...form,
      ingredients: form.ingredients.filter(Boolean),
      steps: form.steps.filter(Boolean),
      tags,
    }
    if (!data.title.trim()) {
      setError('Titel is verplicht.')
      return
    }
    setSaving(true)
    try {
      await onSubmit(data)
    } catch {
      setError('Recept opslaan mislukt. Probeer opnieuw.')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Titel *</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setField('title', e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
          placeholder="bijv. Oma's lasagne"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Beschrijving</label>
        <textarea
          value={form.description}
          onChange={(e) => setField('description', e.target.value)}
          rows={2}
          className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none"
          placeholder="Een korte notitie over dit recept"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Ingrediënten</label>
        <div className="space-y-2">
          {form.ingredients.map((ing, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={ing}
                onChange={(e) => updateList('ingredients', i, e.target.value)}
                className="flex-1 border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
                placeholder={`Ingrediënt ${i + 1}`}
              />
              {form.ingredients.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow('ingredients', i)}
                  className="text-gray-400 hover:text-red-500 px-2"
                  aria-label="Ingrediënt verwijderen"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => addRow('ingredients')}
          className="mt-2 text-sm text-rose-500 hover:text-rose-700 font-medium"
        >
          + Ingrediënt toevoegen
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Stappen</label>
        <div className="space-y-2">
          {form.steps.map((step, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="mt-2.5 text-sm text-gray-400 w-5 shrink-0">{i + 1}.</span>
              <textarea
                value={step}
                onChange={(e) => updateList('steps', i, e.target.value)}
                rows={2}
                className="flex-1 border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none"
                placeholder={`Stap ${i + 1}`}
              />
              {form.steps.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow('steps', i)}
                  className="mt-2 text-gray-400 hover:text-red-500 px-2"
                  aria-label="Stap verwijderen"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => addRow('steps')}
          className="mt-2 text-sm text-rose-500 hover:text-rose-700 font-medium"
        >
          + Stap toevoegen
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
          placeholder="diner, snel, italiaans (kommagescheiden)"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {saving ? 'Opslaan…' : submitLabel}
      </button>
    </form>
  )
}
