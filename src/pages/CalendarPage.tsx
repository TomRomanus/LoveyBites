import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMealPlanEntries, deleteMealPlanEntry } from '../services/mealPlan'
import { getRecipe } from '../services/recipes'
import type { MealPlanEntry, Recipe, IngredientNode } from '../types/recipe'
import AddMealModal from '../components/AddMealModal'

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
  const diff = day === 0 ? -6 : 1 - day // Monday = start
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
  const gridEnd = (() => {
    const end = endOfMonth(monthStart)
    const endWeekStart = startOfWeek(end)
    return addDays(endWeekStart, 6)
  })()
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

const NL_DAYS_SHORT = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']
const NL_MONTHS = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
]

// ── Ingredients modal ─────────────────────────────────────────────────────────

interface IngredientsModalProps {
  defaultStart: string
  defaultEnd: string
  onClose: () => void
}

function IngredientsModal({ defaultStart, defaultEnd, onClose }: IngredientsModalProps) {
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

  // Group ingredients by date → entry → recipe
  const sections: { label: string; ingredients: string[]; isCustom?: boolean; description?: string }[] = []
  entries.forEach(entry => {
    const dateLabel = new Date(entry.date + 'T00:00:00').toLocaleDateString('nl-NL', {
      weekday: 'long', day: 'numeric', month: 'long',
    })
    if (entry.recipeId) {
      const recipe = recipeMap.get(entry.recipeId)
      if (recipe) {
        sections.push({
          label: `${dateLabel} — ${recipe.title}`,
          ingredients: extractLeafTexts(recipe.ingredients),
        })
      }
    } else if (entry.customDescription) {
      sections.push({
        label: dateLabel,
        isCustom: true,
        description: entry.customDescription,
        ingredients: [],
      })
    }
  })

  function buildCopyText() {
    return sections.map(s => {
      if (s.isCustom) return `${s.label}\n  ${s.description}`
      return `${s.label}\n${s.ingredients.map(i => `  • ${i}`).join('\n')}`
    }).join('\n\n')
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(buildCopyText())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh]">
        <div className="px-5 pt-5 pb-4 border-b border-stone-100 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold italic text-stone-900">Boodschappenlijst</h2>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-600 p-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs text-stone-400 mb-1 font-medium uppercase tracking-wider">Van</label>
              <input
                type="date"
                value={from}
                onChange={e => setFrom(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-clay-400"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-stone-400 mb-1 font-medium uppercase tracking-wider">Tot</label>
              <input
                type="date"
                value={to}
                onChange={e => setTo(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-clay-400"
              />
            </div>
            <button
              onClick={fetchIngredients}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-clay-500 hover:bg-clay-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
            >
              {loading ? '…' : 'Laden'}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {loading && (
            <p className="text-center text-stone-400 py-8">Laden…</p>
          )}
          {fetched && !loading && sections.length === 0 && (
            <p className="text-center text-stone-400 py-8">Geen maaltijden gepland in deze periode.</p>
          )}
          {!loading && sections.map((s, i) => (
            <div key={i}>
              <p className="text-sm font-semibold text-stone-700 mb-1.5 capitalize">{s.label}</p>
              {s.isCustom ? (
                <p className="text-sm text-stone-500 italic pl-2">{s.description}</p>
              ) : (
                <ul className="space-y-1">
                  {s.ingredients.map((ing, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-stone-600">
                      <span className="text-clay-400 mt-0.5 flex-shrink-0">•</span>
                      <span>{ing}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {fetched && sections.length > 0 && (
          <div className="px-4 py-4 border-t border-stone-100 flex-shrink-0">
            <button
              onClick={handleCopy}
              className="w-full py-2.5 rounded-xl border border-stone-200 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {copied ? 'Gekopieerd!' : 'Kopiëren'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Entry pill ────────────────────────────────────────────────────────────────

interface EntryPillProps {
  entry: MealPlanEntry
  recipeTitle?: string
  onDelete: () => void
  compact?: boolean
}

function EntryPill({ entry, recipeTitle, onDelete, compact }: EntryPillProps) {
  const label = entry.customDescription ?? recipeTitle ?? '…'
  return (
    <div className={`group flex items-center gap-1 bg-clay-50 border border-clay-200 rounded-lg text-clay-700 ${
      compact ? 'px-1.5 py-0.5' : 'px-2 py-1'
    }`}>
      <span className={`flex-1 truncate ${compact ? 'text-xs' : 'text-sm'}`}>{label}</span>
      <button
        onClick={e => { e.stopPropagation(); onDelete() }}
        className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-clay-400 hover:text-red-500 transition-opacity flex-shrink-0 ml-0.5"
        aria-label="Verwijder"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

// ── Main CalendarPage ─────────────────────────────────────────────────────────

type ViewMode = 'week' | 'month'

export default function CalendarPage() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [view, setView] = useState<ViewMode>('week')
  const [anchor, setAnchor] = useState<Date>(startOfWeek(today))
  const [entries, setEntries] = useState<MealPlanEntry[]>([])
  const [recipeMap, setRecipeMap] = useState<Map<string, Recipe>>(new Map())
  const [modalDate, setModalDate] = useState<string | null>(null)
  const [showIngredients, setShowIngredients] = useState(false)

  // Compute visible date range based on view
  const { visibleStart, visibleEnd } = (() => {
    if (view === 'week') {
      const ws = view === 'week' ? anchor : startOfWeek(anchor)
      return { visibleStart: ws, visibleEnd: addDays(ws, 6) }
    } else {
      const ms = startOfMonth(anchor)
      const grid = calendarGrid(ms)
      return { visibleStart: grid[0], visibleEnd: grid[grid.length - 1] }
    }
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

  function entriesForDay(day: Date): MealPlanEntry[] {
    const iso = toISO(day)
    return entries.filter(e => e.date === iso)
  }

  async function handleDelete(id: string) {
    await deleteMealPlanEntry(id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  function navigate(dir: -1 | 1) {
    setAnchor(prev => {
      if (view === 'week') return addDays(prev, dir * 7)
      const d = new Date(prev)
      d.setMonth(d.getMonth() + dir)
      return d
    })
  }

  // Period label
  const periodLabel = (() => {
    if (view === 'week') {
      const end = addDays(anchor, 6)
      if (anchor.getMonth() === end.getMonth()) {
        return `${anchor.getDate()}–${end.getDate()} ${NL_MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`
      }
      return `${anchor.getDate()} ${NL_MONTHS[anchor.getMonth()]} – ${end.getDate()} ${NL_MONTHS[end.getMonth()]} ${end.getFullYear()}`
    }
    return `${NL_MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`
  })()

  // Shopping list defaults
  const shoppingStart = toISO(startOfWeek(today))
  const shoppingEnd = toISO(addDays(startOfWeek(today), 6))

  // Weekly view days
  const days = view === 'week' ? weekDays(anchor) : calendarGrid(startOfMonth(anchor))
  const monthStart = startOfMonth(anchor)

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <Link to="/" className="text-clay-400 hover:text-clay-600 text-xl w-8 flex items-center justify-center">←</Link>
        <h1 className="flex-1 font-display text-xl font-bold italic text-stone-900">Weekmenu</h1>
        <button
          onClick={() => setShowIngredients(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 text-sm text-stone-600 hover:border-clay-300 hover:text-clay-600 transition-colors"
          title="Boodschappenlijst"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <span className="hidden sm:inline">Boodschappen</span>
        </button>
      </header>

      {/* Controls */}
      <div className="bg-white border-b border-stone-100 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-stone-200 hover:border-clay-300 text-stone-500 hover:text-clay-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-medium text-stone-700 min-w-[11rem] text-center capitalize">{periodLabel}</span>
          <button
            onClick={() => navigate(1)}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-stone-200 hover:border-clay-300 text-stone-500 hover:text-clay-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* View toggle */}
        <div className="flex gap-1 bg-stone-100 rounded-xl p-1">
          <button
            onClick={() => { setView('week'); setAnchor(startOfWeek(anchor)) }}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              view === 'week' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => { setView('month'); setAnchor(startOfMonth(anchor)) }}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              view === 'month' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            Maand
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <main className="flex-1 p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {NL_DAYS_SHORT.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-stone-400 uppercase tracking-wider py-1">
              {d}
            </div>
          ))}
        </div>

        {view === 'week' && (
          <div className="grid grid-cols-7 gap-2">
            {days.map(day => {
              const dayEntries = entriesForDay(day)
              const isToday = isSameDay(day, today)
              const iso = toISO(day)
              return (
                <div
                  key={iso}
                  className="min-h-[8rem] bg-white rounded-2xl border border-stone-200 p-2 flex flex-col gap-1.5"
                >
                  {/* Day number */}
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-semibold leading-none flex items-center justify-center w-6 h-6 rounded-full ${
                      isToday ? 'bg-clay-500 text-white' : 'text-stone-700'
                    }`}>
                      {day.getDate()}
                    </span>
                    <button
                      onClick={() => setModalDate(iso)}
                      className="w-5 h-5 flex items-center justify-center rounded-full text-stone-300 hover:text-clay-500 hover:bg-clay-50 transition-colors"
                      aria-label="Maaltijd toevoegen"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                  {/* Entries */}
                  <div className="flex flex-col gap-1 flex-1">
                    {dayEntries.map(e => (
                      <EntryPill
                        key={e.id}
                        entry={e}
                        recipeTitle={e.recipeId ? recipeMap.get(e.recipeId)?.title : undefined}
                        onDelete={() => handleDelete(e.id)}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {view === 'month' && (
          <div className="grid grid-cols-7 gap-1">
            {days.map(day => {
              const dayEntries = entriesForDay(day)
              const isToday = isSameDay(day, today)
              const isCurrentMonth = day.getMonth() === monthStart.getMonth()
              const iso = toISO(day)
              return (
                <div
                  key={iso}
                  onClick={() => setModalDate(iso)}
                  className={`min-h-[4.5rem] rounded-xl border p-1.5 cursor-pointer flex flex-col gap-1 transition-colors hover:border-clay-300 ${
                    isCurrentMonth
                      ? 'bg-white border-stone-200'
                      : 'bg-stone-50 border-stone-100'
                  }`}
                >
                  <span className={`text-xs font-semibold leading-none self-start flex items-center justify-center w-5 h-5 rounded-full ${
                    isToday ? 'bg-clay-500 text-white' : isCurrentMonth ? 'text-stone-700' : 'text-stone-300'
                  }`}>
                    {day.getDate()}
                  </span>
                  <div className="flex flex-col gap-0.5 flex-1 overflow-hidden">
                    {dayEntries.slice(0, 2).map(e => (
                      <EntryPill
                        key={e.id}
                        entry={e}
                        recipeTitle={e.recipeId ? recipeMap.get(e.recipeId)?.title : undefined}
                        onDelete={() => handleDelete(e.id)}
                        compact
                      />
                    ))}
                    {dayEntries.length > 2 && (
                      <span className="text-xs text-stone-400 pl-0.5">+{dayEntries.length - 2}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Add meal modal */}
      {modalDate && (
        <AddMealModal
          date={modalDate}
          onClose={() => setModalDate(null)}
          onSaved={() => { setModalDate(null); loadEntries() }}
        />
      )}

      {/* Ingredients modal */}
      {showIngredients && (
        <IngredientsModal
          defaultStart={shoppingStart}
          defaultEnd={shoppingEnd}
          onClose={() => setShowIngredients(false)}
        />
      )}
    </div>
  )
}
