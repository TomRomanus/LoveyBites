import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { RecipeInput, IngredientNode } from '../types/recipe'
import IngredientEditor, { pruneEmpty } from './IngredientEditor'
import SourceEditor from './SourceEditor'
import AutoGrowTextarea from './AutoGrowTextarea'
import { DEFAULT_RECIPE_COLOR } from '../utils/recipeDisplay'

interface Props {
  initial?: Partial<RecipeInput>
  onSubmit: (data: RecipeInput) => Promise<void>
  onSavingChange?: (saving: boolean) => void
  existingTags?: string[]
}

function ensureIngredientIds(nodes: IngredientNode[]): IngredientNode[] {
  return nodes.map((node) => {
    if (node.kind === 'leaf') return node.id ? node : { ...node, id: crypto.randomUUID() }
    return { ...node, id: node.id ?? crypto.randomUUID(), children: ensureIngredientIds(node.children) }
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
  ingredients: [{ kind: 'leaf', text: '', id: crypto.randomUUID() }],
  steps: [
    { kind: 'group', title: 'Voorbereiding', id: crypto.randomUUID(), children: [{ kind: 'leaf', text: '', id: crypto.randomUUID() }] },
    { kind: 'group', title: 'Bereiding', id: crypto.randomUUID(), children: [{ kind: 'leaf', text: '', id: crypto.randomUUID() }] },
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
  addLeafInGroup: 'stap in sectie',
  addLeaf: 'stap toevoegen',
  addGroup: 'sectie toevoegen',
}

const sectionCard: React.CSSProperties = {
  border: '0.5px solid rgba(31,29,26,0.14)',
  borderRadius: 13,
  padding: '16px 16px',
  background: 'transparent',
}

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

function TagsEditor({ tags, onChange, existingTags = [] }: { tags: string[]; onChange: (tags: string[]) => void; existingTags?: string[] }) {
  const [input, setInput] = useState('')
  const [focused, setFocused] = useState(false)

  function add() {
    const v = input.trim().toLowerCase()
    if (v && !tags.includes(v)) onChange([...tags, v])
    setInput('')
  }

  function addSuggestion(t: string) {
    if (!tags.includes(t)) onChange([...tags, t])
    setInput('')
  }

  const suggestions = input.trim()
    ? existingTags.filter((t) => !tags.includes(t) && t.toLowerCase().includes(input.toLowerCase())).slice(0, 8)
    : []

  const chipStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    background: 'transparent', border: '0.5px solid rgba(31,29,26,0.20)',
    borderRadius: 20, padding: '4px 8px 4px 10px',
    fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 500,
    letterSpacing: '0.1em', textTransform: 'uppercase',
    color: 'var(--ink-2)',
  }

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', minHeight: 32 }}>
        <AnimatePresence mode="popLayout">
          {tags.map((t) => (
            <motion.span
              key={t}
              layout
              initial={{ scale: 0.75, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.75, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              style={chipStyle}
            >
              {t}
              <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))}
                style={{ background: 'none', border: 0, color: 'var(--stone)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', padding: 0, lineHeight: 1 }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); add() }}
          placeholder="+ TAG"
          size={Math.max(input.length + 1, 5)}
          style={{
            flex: '0 0 auto',
            background: 'transparent', border: '1px dashed var(--stone-2)', borderRadius: 20, outline: 'none',
            fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'var(--ink-2)',
            padding: '5px 11px',
          }}
        />
      </div>
      <AnimatePresence>
        {focused && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 3 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0 2px', lineHeight: 2 }}
          >
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.1em', color: 'var(--stone-2)', paddingRight: 2 }}>+</span>
            <AnimatePresence mode="popLayout">
              {suggestions.map((t, i) => (
                <motion.span
                  key={t}
                  layout
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.85, opacity: 0, transition: { duration: 0.1 } }}
                  transition={{ type: 'spring', stiffness: 380, damping: 28, delay: i * 0.035 }}
                  style={{ display: 'inline-flex', alignItems: 'center' }}
                >
                  <span
                    onMouseDown={(e) => { e.preventDefault(); addSuggestion(t) }}
                    style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--stone)', cursor: 'pointer', padding: '0 4px', borderRadius: 4 }}
                  >{t}</span>
                  {i < suggestions.length - 1 && <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--stone-2)' }}> · </span>}
                </motion.span>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function RecipeForm({ initial, onSubmit, onSavingChange, existingTags }: Props) {
  const [form, setForm] = useState<RecipeInput>(() => {
    const base = { ...emptyInput(), ...initial }
    return {
      ...base,
      ingredients: ensureIngredientIds(base.ingredients),
      steps: ensureIngredientIds(base.steps),
    }
  })
  const [error, setError] = useState<string | null>(null)
  const [portionDir, setPortionDir] = useState<'up' | 'down' | null>(null)
  const [labelDir, setLabelDir] = useState<'up' | 'down' | null>(null)
  const [isReordering, setIsReordering] = useState(false)

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
    onSavingChange?.(true)
    try {
      await onSubmit(data)
    } catch {
      setError('Recept opslaan mislukt. Probeer opnieuw.')
      onSavingChange?.(false)
    }
  }

  const ingredientOptions = collectIngredientOptions(form.ingredients)
  const portionsValue = form.portions ?? 4

  return (
    <form id="recipe-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 8 }}>
      {error && (
        <div style={{ background: 'var(--bordeaux-tint)', color: 'var(--bordeaux)', padding: '10px 14px', borderRadius: 12, fontSize: 13, fontWeight: 500, borderLeft: '3px solid var(--bordeaux)' }}>
          {error}
        </div>
      )}

      {/* Basic info */}
      <div style={sectionCard}>
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
            placeholder="Beschrijf het gerecht" />
        </Field>
        <div style={{ height: 14 }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span className="lb-eyebrow">PORTIES</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Pers/stuks toggle with sliding pill */}
            <div style={{ position: 'relative', display: 'flex', background: 'var(--paper-2)', borderRadius: 18, padding: 3, height: 36 }}>
              {(['pers', 'stuks'] as const).map(opt => {
                const active = (form.portionsLabel || 'pers') === opt
                return (
                  <button key={opt} type="button"
                    onClick={() => { setLabelDir(opt === 'stuks' ? 'up' : 'down'); setField('portionsLabel', opt === 'pers' ? undefined : opt) }}
                    style={{
                      position: 'relative', zIndex: 1,
                      height: 30, padding: '0 12px', borderRadius: 14, border: 0,
                      display: 'flex', alignItems: 'center',
                      background: 'transparent',
                      color: active ? 'var(--ink)' : 'var(--stone)',
                      fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 500,
                      textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer',
                      transition: 'color 0.15s',
                    }}>
                    {active && (
                      <motion.div
                        layoutId="portions-label-pill"
                        style={{
                          position: 'absolute', inset: 0, borderRadius: 14,
                          background: 'var(--cream-card)',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                          zIndex: -1,
                        }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    {opt}
                  </button>
                )
              })}
            </div>
            {/* Portion stepper with animated number */}
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--paper-2)', borderRadius: 18, padding: 3, height: 36 }}>
              <button type="button"
                onClick={() => { setPortionDir('down'); setField('portions', Math.max(1, portionsValue - 1)) }}
                style={{ width: 30, height: 30, borderRadius: 14, background: 'var(--cream-card)', border: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.06)', cursor: 'pointer' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><path d="M5 12h14" /></svg>
              </button>
              <div style={{ minWidth: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                <div style={{ overflow: 'hidden', position: 'relative' }}>
                  <AnimatePresence mode="popLayout" custom={portionDir}>
                    <motion.span
                      key={portionsValue}
                      custom={portionDir}
                      variants={{
                        enter: (d: 'up' | 'down' | null) => ({ y: d === 'up' ? 10 : d === 'down' ? -10 : 0, opacity: 0 }),
                        center: { y: 0, opacity: 1 },
                        exit: (d: 'up' | 'down' | null) => ({ y: d === 'up' ? -10 : d === 'down' ? 10 : 0, opacity: 0 }),
                      }}
                      initial="enter" animate="center" exit="exit"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      style={{ display: 'block' }}
                    >
                      {portionsValue}
                    </motion.span>
                  </AnimatePresence>
                </div>
                <div style={{ overflow: 'hidden', position: 'relative' }}>
                  <AnimatePresence mode="popLayout" custom={labelDir}>
                    <motion.span
                      key={form.portionsLabel || 'pers'}
                      custom={labelDir}
                      variants={{
                        enter: (d: 'up' | 'down' | null) => ({ y: d === 'up' ? 10 : d === 'down' ? -10 : 0, opacity: 0 }),
                        center: { y: 0, opacity: 1 },
                        exit: (d: 'up' | 'down' | null) => ({ y: d === 'up' ? -10 : d === 'down' ? 10 : 0, opacity: 0 }),
                      }}
                      initial="enter" animate="center" exit="exit"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      style={{ display: 'block' }}
                    >
                      {form.portionsLabel || 'pers'}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </div>
              <button type="button"
                onClick={() => { setPortionDir('up'); setField('portions', portionsValue + 1) }}
                style={{ width: 30, height: 30, borderRadius: 14, background: 'var(--cream-card)', border: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.06)', cursor: 'pointer' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Ingredients */}
      <div style={sectionCard}>
        <div className="lb-eyebrow" style={{ marginBottom: 12 }}>INGREDIËNTEN</div>
        <IngredientEditor
          nodes={form.ingredients}
          onChange={(v) => setField('ingredients', ensureIngredientIds(v))}
          commonSections={['Deeg', 'Vulling', 'Marinade', 'Coating', 'Saus', 'Glazuur']}
          reordering={isReordering}
        />
      </div>

      {/* Steps */}
      <div style={sectionCard}>
        <div className="lb-eyebrow" style={{ marginBottom: 12 }}>INSTRUCTIES</div>
        <IngredientEditor
          nodes={form.steps}
          onChange={(v) => setField('steps', ensureIngredientIds(v))}
          labels={stepLabels}
          commonSections={['Voorbereiding', 'Bereiding', 'Assembleren']}
          ingredientOptions={ingredientOptions}
          leafMultiline
          ordered
          reordering={isReordering}
        />
      </div>

      {/* Tags + Sources */}
      <div style={sectionCard}>
        <Field label="Tags">
          <TagsEditor tags={form.tags ?? []} onChange={(v) => setField('tags', v)} existingTags={existingTags} />
        </Field>
        <div style={{ height: 18 }} />
        <Field label="Bronnen">
          <SourceEditor sources={form.sources ?? []} onChange={(v) => setField('sources', v)} />
        </Field>
      </div>
      {createPortal(
        <button
          type="button"
          onClick={() => setIsReordering(r => !r)}
          aria-label={isReordering ? 'Klaar met sorteren' : 'Volgorde aanpassen'}
          style={{
            position: 'fixed',
            bottom: 'max(28px, env(safe-area-inset-bottom))',
            right: 22,
            width: 44,
            height: 44,
            borderRadius: 22,
            background: isReordering ? 'var(--bordeaux-tint)' : 'var(--cream-card)',
            border: isReordering
              ? '0.5px solid rgba(107,31,42,0.22)'
              : '0.5px solid rgba(31,29,26,0.18)',
            boxShadow: isReordering
              ? '0 1px 4px rgba(107,31,42,0.10)'
              : '0 1px 4px rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 90,
            transition: 'background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease',
          }}
        >
          {isReordering ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--bordeaux)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--stone)" strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l4-4 4 4M7 5v14M17 3v14m0 0l-4-4m4 4l4-4" />
            </svg>
          )}
        </button>,
        document.body
      )}
    </form>
  )
}
