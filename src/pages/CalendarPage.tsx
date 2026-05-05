import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { getMealPlanEntries, deleteMealPlanEntry, createMealPlanEntry } from '../services/mealPlan'
import { getRecipes, getRecipe } from '../services/recipes'
import type { MealPlanEntry, Recipe, IngredientNode } from '../types/recipe'
import { useAuth } from '../contexts/AuthContext'
import { DEFAULT_RECIPE_COLOR } from '../utils/recipeDisplay'

const titleVariants = {
  enter: (dir: number) => ({
    opacity: 0,
    x: dir === 2 ? 60 : dir === -2 ? -60 : 0,
    y: dir === 1 ? 16 : dir === -1 ? -16 : 0,
    transition: { duration: 0.18, ease: [0.2, 0, 0, 1] },
  }),
  center: {
    opacity: 1, x: 0, y: 0,
    transition: { duration: 0.22, ease: [0.2, 0, 0, 1] },
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir === 2 ? -60 : dir === -2 ? 60 : 0,
    y: dir === 1 ? -16 : dir === -1 ? 16 : 0,
    transition: { duration: 0.14, ease: [0.4, 0, 1, 1] },
  }),
}

const pageVariants = {
  enter: (dir: number) => ({
    opacity: 0,
    x: dir === 0 ? 0 : dir > 0 ? 28 : -28,
    scale: dir === 0 ? 0.97 : 1,
  }),
  center: {
    opacity: 1, x: 0, scale: 1,
    transition: { duration: 0.22, ease: [0.2, 0, 0, 1] },
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir === 0 ? 0 : dir > 0 ? -28 : 28,
    scale: dir === 0 ? 0.97 : 1,
    transition: { duration: 0.16, ease: [0.4, 0, 1, 1] },
  }),
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function toISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function startOfWeek(d: Date): Date {
  const r = new Date(d)
  const day = r.getDay()
  const diff = day === 0 ? -6 : 1 - day
  r.setDate(r.getDate() + diff)
  r.setHours(0, 0, 0, 0)
  return r
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function weekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

function calendarGrid(monthStart: Date): Date[] {
  const gridStart = startOfWeek(monthStart)
  const end = endOfMonth(monthStart)
  const endWeekStart = startOfWeek(end)
  const gridEnd = addDays(endWeekStart, 6)
  const days: Date[] = []
  let cur = gridStart
  while (cur <= gridEnd) {
    days.push(new Date(cur))
    cur = addDays(cur, 1)
  }
  return days
}

function extractLeafTexts(nodes: IngredientNode[]): string[] {
  return nodes.flatMap(n =>
    n.kind === 'leaf' ? [n.text] : extractLeafTexts(n.children)
  )
}

// Monday-first grid header labels
const NL_DAYS_GRID = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']
// Indexed by d.getDay() (0 = Sunday)
const NL_DAYS_SHORT = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za']
const NL_DAYS_LONG = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag']
const NL_MONTHS = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december']
const NL_MONTHS_SHORT = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']

// ── Shopping List Sheet ───────────────────────────────────────────────────────

interface ShoppingListSheetProps {
  defaultStart: string
  defaultEnd: string
  onClose: () => void
}

function ShoppingListSheet({ defaultStart, defaultEnd, onClose }: ShoppingListSheetProps) {
  const [from, setFrom] = useState(defaultStart)
  const [to, setTo] = useState(defaultEnd)
  const [entries, setEntries] = useState<MealPlanEntry[]>([])
  const [recipeMap, setRecipeMap] = useState<Map<string, Recipe>>(new Map())
  const [loading, setLoading] = useState(false)
  const [fetched, setFetched] = useState(false)
  const [copied, setCopied] = useState(false)

  async function fetchIngredients() {
    setLoading(true)
    setFetched(false)
    try {
      const es = await getMealPlanEntries(from, to)
      setEntries(es)
      const ids = [...new Set(es.map(e => e.recipeId).filter(Boolean) as string[])]
      const pairs = await Promise.all(ids.map(async id => {
        const r = await getRecipe(id)
        return r ? ([id, r] as [string, Recipe]) : null
      }))
      const map = new Map<string, Recipe>()
      pairs.forEach(p => p && map.set(p[0], p[1]))
      setRecipeMap(map)
    } finally {
      setLoading(false)
      setFetched(true)
    }
  }

  useEffect(() => { fetchIngredients() }, [])

  const sections: { label: string; day: string; ingredients: string[]; isCustom?: boolean; description?: string }[] = []
  entries.forEach(entry => {
    if (entry.recipeId) {
      const recipe = recipeMap.get(entry.recipeId)
      if (recipe) {
        sections.push({
          label: recipe.title,
          day: entry.date,
          ingredients: extractLeafTexts(recipe.ingredients),
        })
      }
    } else if (entry.customDescription) {
      sections.push({ label: entry.date, day: entry.date, isCustom: true, description: entry.customDescription, ingredients: [] })
    }
  })

  function buildCopyText() {
    return sections.map(s => {
      if (s.isCustom) return `${s.day}\n  ${s.description}`
      return `${s.label} (${s.day}):\n${s.ingredients.map(i => `  - ${i}`).join('\n')}`
    }).join('\n\n')
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(buildCopyText())
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <>
      <motion.div
        className="lb-sheet-backdrop" style={{ animation: 'none' }}
        variants={{
          hidden: { opacity: 0, transition: { duration: 0.2 } },
          visible: { opacity: 1, transition: { duration: 0.24 } },
        }}
        initial="hidden" animate="visible" exit="hidden"
        onClick={onClose}
      />
      <motion.div
        className="lb-sheet" style={{ animation: 'none', paddingBottom: 30, height: '88%' }}
        variants={{
          hidden: { y: '100%', transition: { type: 'tween', duration: 0.22, ease: [0.4, 0, 1, 1] } },
          visible: { y: 0, transition: { type: 'spring', stiffness: 300, damping: 32 } },
        }}
        initial="hidden" animate="visible" exit="hidden"
      >
        <div className="lb-sheet-grabber" />
        <div style={{ padding: '12px 22px 0' }}>
          <div className="lb-eyebrow">BOODSCHAPPENLIJST</div>
          <h3 className="lb-display" style={{ margin: '4px 0 0', fontSize: 26 }}>
            Wat we <b>nodig hebben</b>
          </h3>
        </div>
        <div style={{ padding: '14px 22px 0', display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <div className="lb-eyebrow" style={{ marginBottom: 4 }}>VAN</div>
            <input className="lb-input" type="date" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="lb-eyebrow" style={{ marginBottom: 4 }}>TOT</div>
            <input className="lb-input" type="date" value={to} onChange={e => setTo(e.target.value)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button onClick={fetchIngredients} disabled={loading} className="lb-btn lb-btn--ghost lb-btn--small" style={{ height: 46 }}>
              {loading ? '…' : 'Laden'}
            </button>
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '14px 22px' }}>
          {loading && (
            <div style={{ textAlign: 'center', color: 'var(--stone)', fontFamily: 'var(--serif)', fontStyle: 'italic', padding: 30 }}>Laden…</div>
          )}
          {fetched && !loading && sections.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--stone)', fontFamily: 'var(--serif)', fontStyle: 'italic', padding: 30 }}>
              Geen geplande recepten in deze periode.
            </div>
          )}
          {!loading && sections.map((s, i) => (
            <div key={i} style={{ marginBottom: 16, paddingBottom: 14, borderBottom: '0.5px solid var(--line-soft)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.day}</div>
              <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16, fontWeight: 500, marginTop: 2, marginBottom: 6, color: 'var(--bordeaux)' }}>{s.label}</div>
              {s.isCustom ? (
                <div style={{ fontSize: 14, color: 'var(--ink-2)', fontStyle: 'italic' }}>{s.description}</div>
              ) : (
                s.ingredients.map((x, j) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, padding: '4px 0' }}>
                    <span style={{ color: 'var(--bordeaux)', fontFamily: 'var(--serif)' }}>·</span>
                    <span>{x}</span>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
        {fetched && sections.length > 0 && (
          <div style={{ padding: '0 22px 14px' }}>
            <button onClick={handleCopy} className="lb-btn lb-btn--primary" style={{ width: '100%' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              {copied ? 'Gekopieerd!' : 'Kopieer naar klembord'}
            </button>
          </div>
        )}
      </motion.div>
    </>
  )
}

// ── Day Detail Sheet ──────────────────────────────────────────────────────────

interface DayDetailSheetProps {
  date: Date
  entries: MealPlanEntry[]
  recipeMap: Map<string, Recipe>
  onDelete: (id: string) => void
  onAdd: () => void
  onClose: () => void
}

function DayDetailSheet({ date, entries, recipeMap, onDelete, onAdd, onClose }: DayDetailSheetProps) {
  const nav = useNavigate()
  return (
    <>
      <motion.div
        className="lb-sheet-backdrop" style={{ animation: 'none' }}
        variants={{
          hidden: { opacity: 0, transition: { duration: 0.2 } },
          visible: { opacity: 1, transition: { duration: 0.24 } },
        }}
        initial="hidden" animate="visible" exit="hidden"
        onClick={onClose}
      />
      <motion.div
        className="lb-sheet" style={{ animation: 'none', paddingBottom: 30 }}
        variants={{
          hidden: { y: '100%', transition: { type: 'tween', duration: 0.22, ease: [0.4, 0, 1, 1] } },
          visible: { y: 0, transition: { type: 'spring', stiffness: 300, damping: 32 } },
        }}
        initial="hidden" animate="visible" exit="hidden"
      >
        <div className="lb-sheet-grabber" />
        <div style={{ padding: '12px 22px 0' }}>
          <div className="lb-eyebrow">{NL_DAYS_LONG[date.getDay()].toUpperCase()}</div>
          <h3 className="lb-display" style={{ margin: '4px 0 0', fontSize: 26 }}>
            {NL_MONTHS[date.getMonth()]} <b>{date.getDate()}</b>
          </h3>
        </div>
        <div style={{ padding: '16px 22px', overflow: 'auto', flex: 1, minHeight: 0 }}>
          {entries.length === 0 ? (
            <div style={{ padding: '20px 0', color: 'var(--stone)', fontStyle: 'italic', fontFamily: 'var(--serif)', textAlign: 'center' }}>
              Nog niets gepland.
            </div>
          ) : entries.map(e => {
            const recipe = recipeMap.get(e.recipeId ?? '')
            return (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '0.5px solid var(--line-soft)' }}>
                {recipe ? (
                  <div className="lb-color-block" style={{ '--block-bg': recipe.color ?? DEFAULT_RECIPE_COLOR, width: 48, height: 48, borderRadius: 10, padding: 0 } as React.CSSProperties} />
                ) : (
                  <div style={{ width: 48, height: 48, borderRadius: 10, background: 'var(--paper-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--stone)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"><path d="M5 6h14M5 12h14M5 18h9" /></svg>
                  </div>
                )}
                <div onClick={() => recipe && nav(`/recipe/${recipe.id}`)}
                  style={{ flex: 1, fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16, cursor: recipe ? 'pointer' : 'default' }}>
                  {recipe ? recipe.title : e.customDescription}
                </div>
                <button onClick={() => onDelete(e.id)} style={{ background: 'none', border: 0, color: 'var(--stone)', padding: 8, cursor: 'pointer' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                  </svg>
                </button>
              </div>
            )
          })}
          <button onClick={onAdd} className="lb-btn lb-btn--ghost" style={{ width: '100%', marginTop: 14 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            Maaltijd toevoegen
          </button>
        </div>
      </motion.div>
    </>
  )
}

// ── Add Meal Sheet ────────────────────────────────────────────────────────────

interface AddMealSheetProps {
  date: string
  onClose: () => void
  onSaved: () => void
}

function AddMealSheet({ date, onClose, onSaved }: AddMealSheetProps) {
  const { user } = useAuth()
  const [tab, setTab] = useState<'recipe' | 'custom'>('recipe')
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [search, setSearch] = useState('')
  const [custom, setCustom] = useState('')
  const [saving, setSaving] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => { getRecipes().then(setRecipes) }, [])
  useEffect(() => { if (tab === 'recipe') searchRef.current?.focus() }, [tab])

  const filtered = search.trim()
    ? recipes.filter(r => r.title.toLowerCase().includes(search.toLowerCase()))
    : recipes

  const dateObj = new Date(date + 'T00:00:00')

  async function handleSelectRecipe(recipeId: string) {
    if (!user) return
    setSaving(true)
    try {
      await createMealPlanEntry({ date, recipeId, createdBy: user.uid })
      onSaved()
    } finally { setSaving(false) }
  }

  async function handleSaveCustom() {
    if (!user || !custom.trim()) return
    setSaving(true)
    try {
      await createMealPlanEntry({ date, customDescription: custom.trim(), createdBy: user.uid })
      onSaved()
    } finally { setSaving(false) }
  }

  return (
    <>
      <motion.div
        className="lb-sheet-backdrop" style={{ animation: 'none' }}
        variants={{
          hidden: { opacity: 0, transition: { duration: 0.2 } },
          visible: { opacity: 1, transition: { duration: 0.24 } },
        }}
        initial="hidden" animate="visible" exit="hidden"
        onClick={onClose}
      />
      <motion.div
        className="lb-sheet" style={{ animation: 'none', paddingBottom: 30, height: '78%' }}
        variants={{
          hidden: { y: '100%', transition: { type: 'tween', duration: 0.22, ease: [0.4, 0, 1, 1] } },
          visible: { y: 0, transition: { type: 'spring', stiffness: 300, damping: 32 } },
        }}
        initial="hidden" animate="visible" exit="hidden"
      >
        <div className="lb-sheet-grabber" />
        <div style={{ padding: '12px 22px 0' }}>
          <div className="lb-eyebrow">{NL_DAYS_LONG[dateObj.getDay()]}, {NL_MONTHS_SHORT[dateObj.getMonth()]} {dateObj.getDate()}</div>
          <h3 className="lb-display" style={{ margin: '4px 0 14px', fontSize: 24 }}>
            Maaltijd <b>toevoegen</b>
          </h3>
        </div>
        <div style={{ padding: '0 22px 12px' }}>
          <LayoutGroup>
          <div style={{ display: 'flex', background: 'var(--paper-2)', padding: 3, borderRadius: 12 }}>
            {([['recipe', 'Uit boek'], ['custom', 'Eigen tekst']] as const).map(([v, l]) => (
              <button key={v} onClick={() => setTab(v)} style={{
                position: 'relative', flex: 1, height: 32, borderRadius: 9, border: 0,
                background: 'transparent',
                fontSize: 13, fontWeight: 500, color: tab === v ? 'var(--ink)' : 'var(--stone)',
                fontFamily: 'var(--sans)', cursor: 'pointer',
              }}>
                {tab === v && (
                  <motion.div
                    layoutId="meal-sheet-pill"
                    style={{ position: 'absolute', inset: 0, borderRadius: 9, background: 'var(--cream-card)', zIndex: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span style={{ position: 'relative', zIndex: 1 }}>{l}</span>
              </button>
            ))}
          </div>
          </LayoutGroup>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '6px 22px 0' }}>
          {tab === 'recipe' && (
            <>
              <input ref={searchRef} className="lb-input" placeholder="Zoek recept" value={search}
                onChange={e => setSearch(e.target.value)} style={{ marginBottom: 14 }} />
              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--stone)', fontFamily: 'var(--serif)', fontStyle: 'italic', padding: 20 }}>
                  Geen recepten gevonden
                </div>
              )}
              {filtered.map(r => (
                <button key={r.id} onClick={() => handleSelectRecipe(r.id)} disabled={saving} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                  background: 'transparent', border: 0, borderBottom: '0.5px solid var(--line-soft)',
                  width: '100%', textAlign: 'left', cursor: 'pointer',
                }}>
                  <div className="lb-color-block" style={{ '--block-bg': r.color ?? DEFAULT_RECIPE_COLOR, width: 42, height: 42, borderRadius: 8, padding: 0 } as React.CSSProperties} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, fontWeight: 500 }}>{r.title}</div>
                    {r.tags.length > 0 && <div style={{ fontSize: 11, color: 'var(--stone)' }}>{r.tags.slice(0, 2).join(' · ')}</div>}
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--stone)" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>
              ))}
            </>
          )}
          {tab === 'custom' && (
            <>
              <input className="lb-input" autoFocus placeholder="bv. Afhalen, Restjes, Uit eten" value={custom}
                onChange={e => setCustom(e.target.value)} />
              <button onClick={handleSaveCustom} disabled={!custom.trim() || saving}
                className="lb-btn lb-btn--primary" style={{ width: '100%', marginTop: 14 }}>
                {saving ? 'Opslaan…' : 'Aan planning toevoegen'}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </>
  )
}

// ── Week View ─────────────────────────────────────────────────────────────────

interface WeekViewProps {
  anchor: Date
  today: Date
  entries: MealPlanEntry[]
  recipeMap: Map<string, Recipe>
  onAdd: (iso: string) => void
  onDelete: (id: string) => void
}

function WeekView({ anchor, today, entries, recipeMap, onAdd, onDelete }: WeekViewProps) {
  const nav = useNavigate()
  const days = weekDays(anchor)
  const entriesForDay = (day: Date) => entries.filter(e => e.date === toISO(day))

  return (
    <div style={{ padding: '12px 20px 120px' }}>
      {days.map((day, idx) => {
        const dayEntries = entriesForDay(day)
        const isToday = isSameDay(day, today)
        const iso = toISO(day)
        return (
          <div key={iso} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 5,
            padding: '15px 0',
            borderBottom: idx < 6 ? '0.5px solid var(--line)' : 'none',
            minHeight: 38,
          }}>
            {/* Day unit — two fixed columns so abbrevs and numbers each stay vertically aligned */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '17px 22px',
              columnGap: 5,
              alignItems: 'center',
              flexShrink: 0,
              width: 48,
              marginTop: 1,
            }}>
              <span style={{
                fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.08em',
                textTransform: 'uppercase', fontWeight: 600, lineHeight: 1,
                color: isToday ? 'var(--bordeaux)' : 'var(--stone)',
              }}>
                {NL_DAYS_SHORT[day.getDay()]}
              </span>
              <span style={{
                fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 17,
                fontWeight: 500, lineHeight: 1,
                color: isToday ? 'var(--bordeaux)' : 'var(--ink-2)',
              }}>
                {day.getDate()}
              </span>
            </div>

            {/* Recipe zone */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', paddingRight: 6 }}>
              <AnimatePresence initial={false}>
                {dayEntries.map(e => {
                  const recipe = recipeMap.get(e.recipeId ?? '')
                  const color = recipe?.color ?? DEFAULT_RECIPE_COLOR
                  return (
                    <motion.div
                      key={e.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 20 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 5 }}
                    >
                      <div style={{ width: 2.5, height: 16, borderRadius: 2, flexShrink: 0, background: recipe ? color : 'var(--stone)' }} />
                      <span
                        onClick={() => recipe && nav(`/recipe/${recipe.id}`)}
                        style={{
                          flex: 1, fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13.5,
                          lineHeight: 1, fontWeight: recipe ? 500 : 400,
                          color: recipe ? 'var(--ink)' : 'var(--ink-2)',
                          cursor: recipe ? 'pointer' : 'default',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}
                      >
                        {recipe ? recipe.title : e.customDescription}
                      </span>
                      <button
                        onClick={() => onDelete(e.id)}
                        style={{ background: 'none', border: 0, padding: 0, marginLeft: 1, color: 'var(--stone-2)', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center' }}
                      >
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>

            {/* Separator + add */}
            <div style={{ width: 0, alignSelf: 'stretch', borderLeft: '0.5px solid var(--line)', flexShrink: 0 }} />
            <button
              onClick={() => onAdd(iso)}
              style={{ background: 'none', border: 0, padding: 2, color: 'var(--bordeaux)', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', marginTop: 3 }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>
        )
      })}
    </div>
  )
}

// ── Month View ────────────────────────────────────────────────────────────────

interface MonthViewProps {
  anchor: Date
  today: Date
  entries: MealPlanEntry[]
  recipeMap: Map<string, Recipe>
  onPickDay: (day: Date) => void
}

function MonthView({ anchor, today, entries, recipeMap, onPickDay }: MonthViewProps) {
  const monthStart = startOfMonth(anchor)
  const days = calendarGrid(monthStart)
  const entriesForDay = (day: Date) => entries.filter(e => e.date === toISO(day))

  return (
    <div style={{ padding: '20px 16px 120px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
        {NL_DAYS_GRID.map(d => (
          <div key={d} style={{ textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.08em', color: 'var(--stone)', fontWeight: 600 }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {days.map(day => {
          const dayEntries = entriesForDay(day)
          const isToday = isSameDay(day, today)
          const inMonth = day.getMonth() === monthStart.getMonth()
          const hasRecipe = dayEntries.some(e => e.recipeId)
          const highlight = isToday && hasRecipe
          const todayNoRecipe = isToday && !hasRecipe
          return (
            <button key={toISO(day)} onClick={() => onPickDay(day)} style={{
              minHeight: 76, background: highlight ? 'var(--bordeaux)' : 'var(--cream-card)',
              border: `0.5px solid ${highlight ? 'var(--bordeaux)' : todayNoRecipe ? 'var(--bordeaux)' : 'var(--line)'}`,
              borderRadius: 8, padding: 5, opacity: inMonth ? 1 : 0.35,
              display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 3,
              color: highlight ? 'var(--cream-card)' : 'var(--ink)', textAlign: 'left', cursor: 'pointer',
            }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600, opacity: 0.85 }}>{day.getDate()}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', flex: 1 }}>
                {dayEntries.slice(0, 2).map(e => {
                  const recipe = recipeMap.get(e.recipeId ?? '')
                  const label = recipe ? recipe.title : e.customDescription ?? ''
                  const color = recipe?.color ?? DEFAULT_RECIPE_COLOR
                  return (
                    <div key={e.id} style={{
                      fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 9, lineHeight: 1.1,
                      padding: '2px 4px',
                      background: highlight ? 'rgba(255,255,255,0.18)' : (recipe ? color + '22' : 'var(--paper-2)'),
                      color: highlight ? 'var(--cream-card)' : (recipe ? color : 'var(--ink-2)'),
                      borderLeft: `2px solid ${highlight ? 'rgba(255,255,255,0.5)' : (recipe ? color : 'var(--stone-2)')}`,
                      borderRadius: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500,
                    }}>{label}</div>
                  )
                })}
                {dayEntries.length > 2 && (
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: highlight ? 'rgba(255,255,255,0.7)' : 'var(--stone)', paddingLeft: 4 }}>+{dayEntries.length - 2}</div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Main CalendarPage ─────────────────────────────────────────────────────────

type ViewMode = 'week' | 'month'

export default function CalendarPage() {
  const nav = useNavigate()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [view, setView] = useState<ViewMode>('week')
  const [anchor, setAnchor] = useState<Date>(startOfWeek(today))
  const [navDir, setNavDir] = useState(0)
  const [entries, setEntries] = useState<MealPlanEntry[]>([])
  const [recipeMap, setRecipeMap] = useState<Map<string, Recipe>>(new Map())
  const [loading, setLoading] = useState(true)
  const [modalDate, setModalDate] = useState<string | null>(null)
  const [detailDay, setDetailDay] = useState<Date | null>(null)
  const [showShopping, setShowShopping] = useState(false)

  const { visibleStart, visibleEnd } = (() => {
    if (view === 'week') {
      return { visibleStart: anchor, visibleEnd: addDays(anchor, 6) }
    }
    const ms = startOfMonth(anchor)
    const grid = calendarGrid(ms)
    return { visibleStart: grid[0], visibleEnd: grid[grid.length - 1] }
  })()

  const loadEntries = useCallback(async () => {
    const es = await getMealPlanEntries(toISO(visibleStart), toISO(visibleEnd))
    setEntries(es)
    const ids = [...new Set(es.map(e => e.recipeId).filter(Boolean) as string[])]
    const pairs = await Promise.all(ids.map(async id => {
      const r = await getRecipe(id)
      return r ? ([id, r] as [string, Recipe]) : null
    }))
    const map = new Map<string, Recipe>()
    pairs.forEach(p => p && map.set(p[0], p[1]))
    setRecipeMap(map)
    setLoading(false)
  }, [toISO(visibleStart), toISO(visibleEnd)])

  useEffect(() => { loadEntries() }, [loadEntries])

  async function handleDelete(id: string) {
    await deleteMealPlanEntry(id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  function movePeriod(dir: -1 | 1) {
    setNavDir(dir)
    setAnchor(prev => {
      if (view === 'week') return addDays(prev, dir * 7)
      const d = new Date(prev)
      d.setMonth(d.getMonth() + dir)
      return d
    })
  }

  const periodLabel = (() => {
    if (view === 'week') {
      return `${NL_MONTHS_SHORT[anchor.getMonth()]} ${anchor.getDate()}`
    }
    return NL_MONTHS[anchor.getMonth()]
  })()

  const isCurrentPeriod = view === 'week'
    ? toISO(anchor) === toISO(startOfWeek(today))
    : anchor.getMonth() === today.getMonth() && anchor.getFullYear() === today.getFullYear()

  function goToToday() {
    setAnchor(view === 'week' ? startOfWeek(today) : startOfMonth(today))
  }

  const shoppingStart = toISO(startOfWeek(today))
  const shoppingEnd = toISO(addDays(startOfWeek(today), 6))

  return (
    <div className="lb-paper" style={{ minHeight: '100dvh', position: 'relative' }}>
      {/* Header */}
      <div style={{ padding: '24px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div className="lb-eyebrow">HET MENU</div>
            <h1 className="lb-display" style={{ margin: '8px 0 0', fontSize: 34 }}>
              {view === 'week' ? (
                <>
                  {'Week van '}
                  <AnimatePresence mode="popLayout" custom={navDir}>
                    <motion.b
                      key={`wm-${anchor.getFullYear()}-${anchor.getMonth()}`}
                      custom={navDir}
                      variants={titleVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      style={{ color: 'var(--bordeaux)', display: 'inline-block' }}
                    >
                      {NL_MONTHS_SHORT[anchor.getMonth()]}
                    </motion.b>
                  </AnimatePresence>
                  {' '}
                  <AnimatePresence mode="popLayout" custom={navDir}>
                    <motion.b
                      key={`wd-${toISO(anchor)}`}
                      custom={navDir}
                      variants={titleVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      style={{ color: 'var(--bordeaux)', display: 'inline-block' }}
                    >
                      {anchor.getDate()}
                    </motion.b>
                  </AnimatePresence>
                </>
              ) : (
                <AnimatePresence mode="popLayout" custom={navDir}>
                  <motion.span
                    key={`${anchor.getFullYear()}-${anchor.getMonth()}`}
                    custom={navDir}
                    variants={titleVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    style={{ display: 'block' }}
                  >
                    <b style={{ color: 'var(--bordeaux)' }}>{NL_MONTHS[anchor.getMonth()]}</b>{' '}<b>{anchor.getFullYear()}</b>
                  </motion.span>
                </AnimatePresence>
              )}
            </h1>
          </div>
          <button
            onClick={() => setShowShopping(true)}
            style={{
              width: 40, height: 40, borderRadius: 20, border: 0,
              background: 'var(--paper)',
              boxShadow: '0 1px 2px rgba(31,29,26,0.04), 0 0 0 0.5px var(--line)',
              color: 'var(--bordeaux)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18" /><path d="M16 10a4 4 0 01-8 0" />
            </svg>
          </button>
        </div>
      </div>

      {/* Controls */}
      <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <LayoutGroup id="calendar-tabs">
          <div style={{ display: 'flex', borderBottom: '0.5px solid var(--line)' }}>
            {([['week', 'WEEK'], ['month', 'MAAND']] as const).map(([v, l]) => (
              <motion.button
                key={v}
                onClick={() => { setNavDir(v === 'month' ? 2 : -2); setView(v); setAnchor(v === 'week' ? startOfWeek(today) : startOfMonth(today)) }}
                animate={{ color: view === v ? 'var(--bordeaux)' : 'var(--stone)' }}
                transition={{ duration: 0.2 }}
                style={{
                  position: 'relative',
                  background: 'none', border: 0, padding: '0 2px 7px',
                  marginRight: v === 'week' ? 20 : 0,
                  marginBottom: -0.5,
                  fontFamily: 'var(--mono)', fontSize: 11.5, letterSpacing: '0.1em',
                  textTransform: 'uppercase', fontWeight: view === v ? 700 : 600,
                  cursor: 'pointer',
                }}
              >
                {l}
                {view === v && (
                  <motion.div
                    layoutId="cal-tab-line"
                    style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      height: 2.5, background: 'var(--bordeaux)', borderRadius: '2px 2px 0 0',
                    }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </LayoutGroup>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => movePeriod(-1)} className="lb-icon-btn" style={{ width: 40, height: 40 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button onClick={goToToday} disabled={isCurrentPeriod} className="lb-btn lb-btn--ghost lb-btn--small"
            style={{ flex: 1, height: 40, borderRadius: 20, fontSize: 13, opacity: isCurrentPeriod ? 0.45 : 1 }}>
            Vandaag
          </button>
          <button onClick={() => movePeriod(1)} className="lb-icon-btn" style={{ width: 40, height: 40 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar views */}
      {loading ? (
        <div style={{ padding: '12px 20px 120px' }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '8px 0',
              borderBottom: i < 6 ? '0.5px solid var(--line)' : 'none',
              minHeight: 38,
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '17px 22px', columnGap: 5, alignItems: 'baseline', flexShrink: 0 }}>
                <div className="lb-skeleton" style={{ width: 14, height: 9, borderRadius: 2 }} />
                <div className="lb-skeleton" style={{ width: 16, height: 15, borderRadius: 3 }} />
              </div>
              <div style={{ flex: 1 }}>
                <div className="lb-skeleton" style={{ height: 13, borderRadius: 5, width: ['60%', '45%', '70%', '30%', '55%', '40%', '65%'][i] }} />
              </div>
              <div style={{ width: 0, height: 14, borderLeft: '0.5px solid var(--line)', flexShrink: 0 }} />
              <div className="lb-skeleton" style={{ width: 14, height: 14, borderRadius: 3, flexShrink: 0 }} />
            </div>
          ))}
        </div>
      ) : (
        <AnimatePresence mode="wait" custom={navDir}>
          <motion.div
            key={`${view}-${view === 'week' ? toISO(anchor) : `${anchor.getFullYear()}-${anchor.getMonth()}`}`}
            custom={navDir}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            style={{ willChange: 'transform, opacity' }}
          >
            {view === 'week' ? (
              <WeekView
                anchor={anchor}
                today={today}
                entries={entries}
                recipeMap={recipeMap}
                onAdd={setModalDate}
                onDelete={handleDelete}
              />
            ) : (
              <MonthView
                anchor={anchor}
                today={today}
                entries={entries}
                recipeMap={recipeMap}
                onPickDay={setDetailDay}
              />
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Day detail sheet (month view) */}
      <AnimatePresence>
        {detailDay && (
          <DayDetailSheet
            date={detailDay}
            entries={entries.filter(e => e.date === toISO(detailDay))}
            recipeMap={recipeMap}
            onDelete={async (id) => { await handleDelete(id) }}
            onAdd={() => { setModalDate(toISO(detailDay)); setDetailDay(null) }}
            onClose={() => setDetailDay(null)}
          />
        )}
      </AnimatePresence>

      {/* Add meal sheet */}
      <AnimatePresence>
        {modalDate && (
          <AddMealSheet
            date={modalDate}
            onClose={() => setModalDate(null)}
            onSaved={() => { setModalDate(null); loadEntries() }}
          />
        )}
      </AnimatePresence>

      {/* Shopping list sheet */}
      <AnimatePresence>
        {showShopping && (
          <ShoppingListSheet
            defaultStart={shoppingStart}
            defaultEnd={shoppingEnd}
            onClose={() => setShowShopping(false)}
          />
        )}
      </AnimatePresence>

    </div>
  )
}
