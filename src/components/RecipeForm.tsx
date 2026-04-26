import { useState } from 'react'
import type { RecipeInput } from '../types/recipe'
import IngredientEditor, { pruneEmpty } from './IngredientEditor'
import SourceEditor from './SourceEditor'

interface Props {
  initial?: Partial<RecipeInput>
  onSubmit: (data: RecipeInput) => Promise<void>
  submitLabel: string
}

const emptyInput = (): RecipeInput => ({
  title: '',
  description: '',
  portions: 4,
  ingredients: [{ kind: 'leaf', text: '' }],
  steps: [
    { kind: 'group', title: 'Voorbereiding', children: [{ kind: 'leaf', text: '' }] },
    { kind: 'group', title: 'Bereiding', children: [{ kind: 'leaf', text: '' }] },
  ],
  sources: [],
  tags: [],
  imageUrl: '',
  createdBy: 'us',
})

const stepLabels = {
  leafPlaceholder: 'bijv. Verwarm de oven voor op 180°C',
  groupPlaceholder: 'Sectienaam (bijv. Voorbereiding)',
  addLeafInGroup: '+ stap in sectie',
  addLeaf: '+ Stap toevoegen',
  addGroup: '+ Sectie toevoegen',
}

export default function RecipeForm({ initial, onSubmit, submitLabel }: Props) {
  const [form, setForm] = useState<RecipeInput>({ ...emptyInput(), ...initial })
  const [tagInput, setTagInput] = useState((initial?.tags ?? []).join(', '))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function setField<K extends keyof RecipeInput>(key: K, value: RecipeInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
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
      ingredients: pruneEmpty(form.ingredients),
      steps: pruneEmpty(form.steps),
      sources: (form.sources ?? []).filter((s) => s.url.trim()),
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Porties</label>
        <input
          type="number"
          min={1}
          max={100}
          value={form.portions ?? 4}
          onChange={(e) => setField('portions', Math.max(1, parseInt(e.target.value) || 1))}
          className="w-24 border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Ingrediënten</label>
        <IngredientEditor
          nodes={form.ingredients}
          onChange={(v) => setField('ingredients', v)}
          commonSections={['Deeg', 'Vulling', 'Marinade', 'Coating', 'Saus', 'Glazuur']}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Stappen</label>
        <IngredientEditor
          nodes={form.steps}
          onChange={(v) => setField('steps', v)}
          labels={stepLabels}
          commonSections={['Voorbereiding', 'Bereiding', 'Assembleren']}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Bronnen</label>
        <SourceEditor
          sources={form.sources ?? []}
          onChange={(v) => setField('sources', v)}
        />
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
