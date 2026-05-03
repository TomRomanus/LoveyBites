import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMealPlanEntries, deleteMealPlanEntry, createMealPlanEntry } from '../services/mealPlan'
import { getRecipes, getRecipe } from '../services/recipes'
import type { MealPlanEntry, Recipe, IngredientNode } from '../types/recipe'
import { useAuth } from '../contexts/AuthContext'
import { DEFAULT_RECIPE_COLOR } from '../utils/recipeDisplay'

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
      <div className="lb-sheet-backdrop" onClick={onClose} />
      <div className="lb-sheet" style={{ paddingBottom: 30, height: '88%' }}>
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
      </div>
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
      <div className="lb-sheet-backdrop" onClick={onClose} />
      <div className="lb-sheet" style={{ paddingBottom: 30 }}>
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
      </div>
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
      <div className="lb-sheet-backdrop" onClick={onClose} />
      <div className="lb-sheet" style={{ paddingBottom: 30, height: '78%' }}>
        <div className="lb-sheet-grabber" />
        <div style={{ padding: '12px 22px 0' }}>
          <div className="lb-eyebrow">{NL_DAYS_LONG[dateObj.getDay()]}, {NL_MONTHS_SHORT[dateObj.getMonth()]} {dateObj.getDate()}</div>
          <h3 className="lb-display" style={{ margin: '4px 0 14px', fontSize: 24 }}>
            Maaltijd <b>toevoegen</b>
          </h3>
        </div>
        <div style={{ padding: '0 22px 12px' }}>
          <div style={{ display: 'flex', background: 'var(--paper-2)', padding: 3, borderRadius: 12 }}>
            {([['recipe', 'Uit boek'], ['custom', 'Eigen tekst']] as const).map(([v, l]) => (
              <button key={v} onClick={() => setTab(v)} style={{
                flex: 1, height: 32, borderRadius: 9, border: 0,
                background: tab === v ? 'var(--cream-card)' : 'transparent',
                fontSize: 13, fontWeight: 500, color: tab === v ? 'var(--ink)' : 'var(--stone)',
                fontFamily: 'var(--sans)', cursor: 'pointer',
              }}>{l}</button>
            ))}
          </div>
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
      </div>
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
    <div style={{ padding: '12px 16px 120px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      {days.map(day => {
        const dayEntries = entriesForDay(day)
        const isToday = isSameDay(day, today)
        const hasRecipe = dayEntries.some(e => e.recipeId)
        const highlight = isToday && hasRecipe
        const iso = toISO(day)
        return (
          <div key={iso} style={{
            background: 'var(--cream-card)',
            borderRadius: 16,
            border: `0.5px solid ${highlight ? 'var(--bordeaux)' : 'var(--line)'}`,
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            {/* Day indicator */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32, flexShrink: 0 }}>
              <span style={{
                fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.1em',
                color: isToday ? 'var(--bordeaux)' : 'var(--stone)',
                textTransform: 'uppercase', fontWeight: 600, lineHeight: 1, marginBottom: 3,
              }}>
                {NL_DAYS_SHORT[day.getDay()]}
              </span>
              <span style={{
                fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 20, fontWeight: 500,
                lineHeight: 1, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 16,
                background: isToday ? 'var(--bordeaux)' : 'transparent',
                color: isToday ? 'var(--cream-card)' : 'var(--ink)',
              }}>
                {day.getDate()}
              </span>
            </div>

            {/* Entry pills */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5, minHeight: 36, justifyContent: 'center' }}>
              {dayEntries.length === 0 ? (
                <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--stone-2)' }}>
                  Niets gepland
                </span>
              ) : dayEntries.map(e => {
                const recipe = recipeMap.get(e.recipeId ?? '')
                const color = recipe?.color ?? DEFAULT_RECIPE_COLOR
                return (
                  <div key={e.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: recipe ? color + '18' : 'var(--paper-2)',
                    border: `1px solid ${recipe ? color + '40' : 'var(--line)'}`,
                    borderRadius: 8, padding: '5px 8px',
                  }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: 4, flexShrink: 0,
                      background: recipe ? color : 'var(--stone-2)',
                    }} />
                    <span onClick={() => recipe && nav(`/recipe/${recipe.id}`)} style={{
                      flex: 1, fontSize: 13, fontFamily: 'var(--serif)', fontStyle: 'italic',
                      color: 'var(--ink)', cursor: recipe ? 'pointer' : 'default',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {recipe ? recipe.title : e.customDescription}
                    </span>
                    <button onClick={() => onDelete(e.id)} style={{
                      background: 'none', border: 0, color: 'var(--stone-2)', padding: 2,
                      cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center',
                    }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Add button */}
            <button onClick={() => onAdd(iso)} style={{
              width: 30, height: 30, borderRadius: 15, background: 'var(--paper-2)', border: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--stone)', cursor: 'pointer', flexShrink: 0,
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
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
  const [entries, setEntries] = useState<MealPlanEntry[]>([])
  const [recipeMap, setRecipeMap] = useState<Map<string, Recipe>>(new Map())
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
  }, [toISO(visibleStart), toISO(visibleEnd)])

  useEffect(() => { loadEntries() }, [loadEntries])

  async function handleDelete(id: string) {
    await deleteMealPlanEntry(id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  function movePeriod(dir: -1 | 1) {
    setAnchor(prev => {
      if (view === 'week') return addDays(prev, dir * 7)
      const d = new Date(prev)
      d.setMonth(d.getMonth() + dir)
      return d
    })
  }

  const periodLabel = (() => {
    if (view === 'week') {
      const ws = anchor
      const end = addDays(ws, 6)
      if (ws.getMonth() === end.getMonth()) {
        return `${NL_MONTHS_SHORT[ws.getMonth()]} ${ws.getDate()}`
      }
      return `${NL_MONTHS_SHORT[ws.getMonth()]} ${ws.getDate()} – ${end.getDate()}`
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
      <div style={{ padding: '54px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => nav('/')} className="lb-icon-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button onClick={() => setShowShopping(true)} className="lb-btn lb-btn--ghost lb-btn--small">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18" /><path d="M16 10a4 4 0 01-8 0" />
            </svg>
            Lijst
          </button>
        </div>
        <div style={{ marginTop: 16 }}>
          <div className="lb-eyebrow">DE WEEK VOORUIT</div>
          <h1 className="lb-display" style={{ margin: '8px 0 0', fontSize: 34 }}>
            {view === 'week' ? (
              <>Week van <b>{periodLabel}</b></>
            ) : (
              <>{NL_MONTHS[anchor.getMonth()]} <b>{anchor.getFullYear()}</b></>
            )}
          </h1>
        </div>
      </div>

      {/* Controls */}
      <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', background: 'var(--paper-2)', padding: 4, borderRadius: 14 }}>
          {([['week', 'Week'], ['month', 'Maand']] as const).map(([v, l]) => (
            <button key={v} onClick={() => { setView(v); setAnchor(v === 'week' ? startOfWeek(today) : startOfMonth(today)) }} style={{
              flex: 1, height: 38, borderRadius: 10, border: 0,
              background: view === v ? 'var(--cream-card)' : 'transparent',
              fontSize: 14, fontWeight: 600, color: view === v ? 'var(--ink)' : 'var(--stone)',
              boxShadow: view === v ? '0 1px 3px rgba(0,0,0,0.06)' : 'none', fontFamily: 'var(--sans)', cursor: 'pointer',
            }}>{l}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => movePeriod(-1)} className="lb-icon-btn" style={{ width: 42, height: 42 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button onClick={goToToday} disabled={isCurrentPeriod} className="lb-btn lb-btn--ghost lb-btn--small"
            style={{ flex: 1, height: 42, borderRadius: 21, fontSize: 14, opacity: isCurrentPeriod ? 0.45 : 1 }}>
            Vandaag
          </button>
          <button onClick={() => movePeriod(1)} className="lb-icon-btn" style={{ width: 42, height: 42 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar views */}
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

      {/* Day detail sheet (month view) */}
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

      {/* Add meal sheet */}
      {modalDate && (
        <AddMealSheet
          date={modalDate}
          onClose={() => setModalDate(null)}
          onSaved={() => { setModalDate(null); loadEntries() }}
        />
      )}

      {/* Shopping list sheet */}
      {showShopping && (
        <ShoppingListSheet
          defaultStart={shoppingStart}
          defaultEnd={shoppingEnd}
          onClose={() => setShowShopping(false)}
        />
      )}
    </div>
  )
}
