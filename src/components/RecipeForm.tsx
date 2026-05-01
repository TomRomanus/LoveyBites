import { useState } from 'react'
import type { RecipeInput, IngredientNode } from '../types/recipe'
import IngredientEditor, { pruneEmpty } from './IngredientEditor'
import SourceEditor from './SourceEditor'
import AutoGrowTextarea from './AutoGrowTextarea'

interface Props {
  initial?: Partial<RecipeInput>
  onSubmit: (data: RecipeInput) => Promise<void>
  submitLabel: string
}

function ensureIngredientIds(nodes: IngredientNode[]): IngredientNode[] {
  return nodes.map((node) => {
    if (node.kind === 'leaf') {
      return node.id ? node : { ...node, id: crypto.randomUUID() }
    }
    return { ...node, children: ensureIngredientIds(node.children) }
  })
}

function collectIngredientOptions(nodes: IngredientNode[]): Array<{ id: string; text: string }> {
  const options: Array<{ id: string; text: string }> = []
  for (const node of nodes) {
    if (node.kind === 'leaf' && node.id && node.text.trim()) {
      options.push({ id: node.id, text: node.text.trim() })
    } else if (node.kind === 'group') {
      options.push(...collectIngredientOptions(node.children))
    }
  }
  return options
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
  const [form, setForm] = useState<RecipeInput>(() => {
    const base = { ...emptyInput(), ...initial }
    return { ...base, ingredients: ensureIngredientIds(base.ingredients) }
  })
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

  const inputClass = 'w-full border border-stone-200 rounded-2xl px-4 py-3 text-sm text-stone-700 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-clay-500 focus:border-transparent transition'
  const labelClass = 'block text-sm font-medium text-stone-600 mb-1.5'

  const ingredientOptions = collectIngredientOptions(form.ingredients)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
          {error}
        </p>
      )}

      <div>
        <label className={labelClass}>Titel *</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setField('title', e.target.value)}
          className={inputClass}
          placeholder="bijv. Oma's lasagne"
        />
      </div>

      <div>
        <label className={labelClass}>Beschrijving</label>
        <AutoGrowTextarea
          value={form.description}
          onChange={(e) => setField('description', e.target.value)}
          rows={2}
          className={`${inputClass} resize-none`}
          placeholder="Een korte notitie over dit recept"
        />
      </div>

      <div>
        <label className={labelClass}>Porties</label>
        <input
          type="number"
          min={1}
          max={100}
          value={form.portions ?? 4}
          onChange={(e) => setField('portions', Math.max(1, parseInt(e.target.value) || 1))}
          className="w-24 border border-stone-200 rounded-2xl px-4 py-3 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-clay-500 focus:border-transparent transition"
        />
      </div>

      <div>
        <label className={labelClass}>Ingrediënten</label>
        <IngredientEditor
          nodes={form.ingredients}
          onChange={(v) => setField('ingredients', ensureIngredientIds(v))}
          commonSections={['Deeg', 'Vulling', 'Marinade', 'Coating', 'Saus', 'Glazuur']}
        />
      </div>

      <div>
        <label className={labelClass}>Stappen</label>
        <IngredientEditor
          nodes={form.steps}
          onChange={(v) => setField('steps', v)}
          labels={stepLabels}
          commonSections={['Voorbereiding', 'Bereiding', 'Assembleren']}
          ingredientOptions={ingredientOptions}
          leafMultiline
        />
      </div>

      <div>
        <label className={labelClass}>Bronnen</label>
        <SourceEditor
          sources={form.sources ?? []}
          onChange={(v) => setField('sources', v)}
        />
      </div>

      <div>
        <label className={labelClass}>Tags</label>
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          className={inputClass}
          placeholder="diner, snel, italiaans (kommagescheiden)"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-clay-500 hover:bg-clay-600 disabled:bg-clay-300 text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm"
      >
        {saving ? 'Opslaan…' : submitLabel}
      </button>
    </form>
  )
}
