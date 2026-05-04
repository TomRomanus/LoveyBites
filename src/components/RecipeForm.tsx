import { useState } from 'react'
import type { RecipeInput, IngredientNode } from '../types/recipe'
import IngredientEditor, { pruneEmpty } from './IngredientEditor'
import SourceEditor from './SourceEditor'
import AutoGrowTextarea from './AutoGrowTextarea'
import { DEFAULT_RECIPE_COLOR } from '../utils/recipeDisplay'

interface Props {
  initial?: Partial<RecipeInput>
  onSubmit: (data: RecipeInput) => Promise<void>
  submitLabel: string
}

function ensureIngredientIds(nodes: IngredientNode[]): IngredientNode[] {
  return nodes.map((node) => {
    if (node.kind === 'leaf') return node.id ? node : { ...node, id: crypto.randomUUID() }
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
  color: DEFAULT_RECIPE_COLOR,
})

const stepLabels = {
  leafPlaceholder: 'bijv. Verwarm de oven voor op 180°C',
  groupPlaceholder: 'Sectienaam (bijv. Voorbereiding)',
  addLeafInGroup: '+ stap in sectie',
  addLeaf: '+ Stap toevoegen',
  addGroup: '+ Sectie toevoegen',
}

const RECIPE_COLORS = ['#6b1f2a', '#8a2733', '#a8324a', '#7a3a3f', '#8c4350', '#5a1a24', '#923548', '#b04054']

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
        <span className="lb-eyebrow">{label}</span>
        {required && <span style={{ color: 'var(--bordeaux)', fontSize: 10 }}>·</span>}
      </div>
      {children}
    </div>
  )
}

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {RECIPE_COLORS.map((c) => (
        <button key={c} type="button" onClick={() => onChange(c)} style={{
          width: 32, height: 32, borderRadius: 16, background: c, border: 0, cursor: 'pointer',
          boxShadow: value === c
            ? '0 0 0 2px var(--paper), 0 0 0 4px var(--ink)'
            : '0 0 0 0.5px rgba(0,0,0,0.1)',
          transition: 'box-shadow 0.15s',
        }} />
      ))}
    </div>
  )
}

function TagsEditor({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [input, setInput] = useState('')

  function add() {
    const v = input.trim().toLowerCase()
    if (v && !tags.includes(v)) onChange([...tags, v])
    setInput('')
  }

  return (
    <div>
      {tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {tags.map((t) => (
            <span key={t} className="lb-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, paddingRight: 6 }}>
              {t}
              <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))}
                style={{ background: 'none', border: 0, color: 'var(--stone)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', padding: 0, lineHeight: 1 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          className="lb-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder="Tag toevoegen (Enter)"
          style={{ flex: 1 }}
        />
        <button type="button" onClick={add} className="lb-btn lb-btn--ghost">
          Toevoegen
        </button>
      </div>
    </div>
  )
}

export default function RecipeForm({ initial, onSubmit, submitLabel }: Props) {
  const [form, setForm] = useState<RecipeInput>(() => {
    const base = { ...emptyInput(), ...initial }
    return { ...base, ingredients: ensureIngredientIds(base.ingredients) }
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function setField<K extends keyof RecipeInput>(key: K, value: RecipeInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const data: RecipeInput = {
      ...form,
      ingredients: pruneEmpty(form.ingredients),
      steps: pruneEmpty(form.steps),
      sources: (form.sources ?? []).filter((s) => s.url.trim()),
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

  const ingredientOptions = collectIngredientOptions(form.ingredients)
  const previewColor = form.color ?? DEFAULT_RECIPE_COLOR

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 20 }}>
      {error && (
        <div style={{ background: 'var(--bordeaux-tint)', color: 'var(--bordeaux)', padding: '10px 14px', borderRadius: 12, fontSize: 13, fontWeight: 500, borderLeft: '3px solid var(--bordeaux)' }}>
          {error}
        </div>
      )}

      {/* Color-block preview */}
      <div className="lb-color-block" style={{ '--block-bg': previewColor, height: 130, borderRadius: 16, padding: '14px 18px' } as React.CSSProperties}>
        <div className="lb-color-block-corner">RECEPT · VOORBEELD</div>
        <div className="lb-color-block-title" style={{ fontSize: 22, lineHeight: 1.05 }}>
          {form.title || <span style={{ opacity: 0.5 }}>Naamloos recept</span>}
        </div>
      </div>

      {/* Basic info */}
      <div className="lb-card" style={{ padding: '16px 16px' }}>
        <Field label="Titel" required>
          <input className="lb-input" type="text" value={form.title}
            onChange={(e) => setField('title', e.target.value)}
            placeholder="Wat gaan we maken?" />
        </Field>
        <div style={{ height: 14 }} />
        <Field label="Beschrijving">
          <AutoGrowTextarea value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            rows={2}
            style={{ width: '100%', background: 'var(--paper-2)', border: 0, borderRadius: 12, padding: '12px 14px', fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--ink)', outline: 'none', resize: 'none', lineHeight: 1.45 }}
            placeholder="Een regel of twee" />
        </Field>
        <div style={{ height: 14 }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span className="lb-eyebrow">PORTIES</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', background: 'var(--paper-2)', borderRadius: 16, padding: 3 }}>
              {(['pers', 'stuks'] as const).map(opt => {
                const active = (form.portionsLabel || 'pers') === opt
                return (
                  <button key={opt} type="button"
                    onClick={() => setField('portionsLabel', opt === 'pers' ? undefined : opt)}
                    style={{
                      padding: '4px 12px', borderRadius: 12, border: 0,
                      background: active ? 'var(--cream-card)' : 'transparent',
                      color: active ? 'var(--ink)' : 'var(--stone)',
                      fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 500,
                      textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer',
                      boxShadow: active ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                      transition: 'background 0.15s, color 0.15s',
                    }}>
                    {opt}
                  </button>
                )
              })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--paper-2)', borderRadius: 16, padding: 3 }}>
              <button type="button" onClick={() => setField('portions', Math.max(1, (form.portions ?? 4) - 1))}
                style={{ width: 30, height: 30, borderRadius: 13, background: 'var(--cream-card)', border: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.06)', cursor: 'pointer' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><path d="M5 12h14" /></svg>
              </button>
              <div style={{ minWidth: 72, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {form.portions ?? 4} {form.portionsLabel || 'pers'}
              </div>
              <button type="button" onClick={() => setField('portions', (form.portions ?? 4) + 1)}
                style={{ width: 30, height: 30, borderRadius: 13, background: 'var(--cream-card)', border: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.06)', cursor: 'pointer' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              </button>
            </div>
          </div>
        </div>
        <div style={{ height: 14 }} />
        <Field label="Kleur">
          <ColorPicker value={previewColor} onChange={(c) => setField('color', c)} />
        </Field>
      </div>

      {/* Ingredients */}
      <div className="lb-card" style={{ padding: '16px 16px' }}>
        <div className="lb-eyebrow" style={{ marginBottom: 12 }}>INGREDIËNTEN</div>
        <IngredientEditor
          nodes={form.ingredients}
          onChange={(v) => setField('ingredients', ensureIngredientIds(v))}
          commonSections={['Deeg', 'Vulling', 'Marinade', 'Coating', 'Saus', 'Glazuur']}
        />
      </div>

      {/* Steps */}
      <div className="lb-card" style={{ padding: '16px 16px' }}>
        <div className="lb-eyebrow" style={{ marginBottom: 12 }}>STAPPEN</div>
        <IngredientEditor
          nodes={form.steps}
          onChange={(v) => setField('steps', v)}
          labels={stepLabels}
          commonSections={['Voorbereiding', 'Bereiding', 'Assembleren']}
          ingredientOptions={ingredientOptions}
          leafMultiline
          ordered
        />
      </div>

      {/* Tags + Sources */}
      <div className="lb-card" style={{ padding: '16px 16px' }}>
        <Field label="Tags">
          <TagsEditor tags={form.tags ?? []} onChange={(v) => setField('tags', v)} />
        </Field>
        <div style={{ height: 14 }} />
        <Field label="Bronnen">
          <SourceEditor sources={form.sources ?? []} onChange={(v) => setField('sources', v)} />
        </Field>
      </div>

      <button type="submit" disabled={saving} className="lb-btn lb-btn--primary" style={{ width: '100%', height: 52, borderRadius: 26, fontSize: 16 }}>
        {saving ? <span className="lb-spinner" style={{ borderColor: 'var(--cream-card)', borderRightColor: 'transparent' }} /> : submitLabel}
      </button>
    </form>
  )
}
