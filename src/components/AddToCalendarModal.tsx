import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { getMealPlanEntries, createMealPlanEntry } from '../services/mealPlan'
import type { MealPlanEntry, Recipe } from '../types/recipe'
import { useAuth } from '../contexts/AuthContext'

// ── date helpers (local-time safe) ────────────────────────────────────────────

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function startOfWeek(d: Date): Date {
  const r = new Date(d)
  r.setHours(0, 0, 0, 0)
  const day = r.getDay()
  r.setDate(r.getDate() + (day === 0 ? -6 : 1 - day))
  return r
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

const NL_DAYS_SHORT = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']
const NL_MONTHS = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
]

// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  recipe: Pick<Recipe, 'id' | 'title'>
  onClose: () => void
  onSaved: (date: string) => void
}

export default function AddToCalendarModal({ recipe, onClose, onSaved }: Props) {
  const { user } = useAuth()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(today))
  const [entries, setEntries] = useState<MealPlanEntry[]>([])
  const [saving, setSaving] = useState<string | null>(null) // ISO date being saved
  const [saved, setSaved] = useState<string | null>(null)   // ISO date just saved

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const weekEnd = addDays(weekStart, 6)

  useEffect(() => {
    getMealPlanEntries(toISO(weekStart), toISO(weekEnd)).then(setEntries)
  }, [toISO(weekStart)])

  async function handleDayClick(day: Date) {
    if (!user) return
    const iso = toISO(day)
    setSaving(iso)
    try {
      await createMealPlanEntry({ date: iso, recipeId: recipe.id, createdBy: user.uid })
      setSaved(iso)
      setTimeout(() => {
        onSaved(iso)
      }, 800)
    } finally {
      setSaving(null)
    }
  }

  function entriesForDay(day: Date): MealPlanEntry[] {
    return entries.filter(e => e.date === toISO(day))
  }

  const weekLabel = (() => {
    if (weekStart.getMonth() === weekEnd.getMonth()) {
      return `${weekStart.getDate()}–${weekEnd.getDate()} ${NL_MONTHS[weekStart.getMonth()]} ${weekStart.getFullYear()}`
    }
    return `${weekStart.getDate()} ${NL_MONTHS[weekStart.getMonth()]} – ${weekEnd.getDate()} ${NL_MONTHS[weekEnd.getMonth()]}`
  })()

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-stone-100 flex-shrink-0">
          <div className="flex items-start justify-between gap-3 mb-1">
            <div>
              <h2 className="font-display text-lg font-bold italic text-stone-900 leading-tight">
                Toevoegen aan kalender
              </h2>
              <p className="text-sm text-stone-400 mt-0.5 truncate max-w-xs">{recipe.title}</p>
            </div>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-600 p-1 flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Week navigation */}
          <div className="flex items-center justify-between mt-3">
            <button
              onClick={() => setWeekStart(prev => addDays(prev, -7))}
              className="w-7 h-7 flex items-center justify-center rounded-full border border-stone-200 hover:border-clay-300 text-stone-400 hover:text-clay-600 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-medium text-stone-600 capitalize">{weekLabel}</span>
            <button
              onClick={() => setWeekStart(prev => addDays(prev, 7))}
              className="w-7 h-7 flex items-center justify-center rounded-full border border-stone-200 hover:border-clay-300 text-stone-400 hover:text-clay-600 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Week grid */}
        <div className="px-4 py-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {NL_DAYS_SHORT.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-stone-400 uppercase tracking-wider py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {days.map(day => {
              const iso = toISO(day)
              const isToday = isSameDay(day, today)
              const dayEntries = entriesForDay(day)
              const isSaving = saving === iso
              const isSaved = saved === iso

              return (
                <button
                  key={iso}
                  onClick={() => handleDayClick(day)}
                  disabled={!!saving || !!saved}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all text-left ${
                    isSaved
                      ? 'bg-clay-50 border-clay-400 ring-2 ring-clay-300'
                      : 'bg-white border-stone-200 hover:border-clay-300 hover:bg-clay-50 active:scale-95'
                  } disabled:cursor-default`}
                >
                  {/* Day number */}
                  <span className={`text-sm font-semibold leading-none flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0 ${
                    isSaved
                      ? 'bg-clay-500 text-white'
                      : isToday
                        ? 'bg-clay-100 text-clay-700'
                        : 'text-stone-700'
                  }`}>
                    {isSaving ? (
                      <svg className="w-3 h-3 animate-spin text-clay-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : isSaved ? (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : day.getDate()}
                  </span>

                  {/* Existing entries */}
                  <div className="w-full space-y-0.5 min-h-[1.25rem]">
                    {dayEntries.slice(0, 2).map((e, i) => (
                      <div
                        key={i}
                        className="w-full h-1.5 rounded-full bg-clay-200"
                        title={e.customDescription ?? ''}
                      />
                    ))}
                    {dayEntries.length > 2 && (
                      <div className="w-full h-1.5 rounded-full bg-stone-200" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          <p className="text-xs text-stone-400 text-center mt-3">
            {saved ? 'Toegevoegd! ✓' : 'Klik op een dag om toe te voegen'}
          </p>
        </div>
      </div>
    </div>,
    document.body
  )
}
