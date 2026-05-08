import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getMealPlanEntries, createMealPlanEntry, deleteMealPlanEntry } from '../services/mealPlan'
import { getRecipes } from '../services/recipes'
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
  const [visible, setVisible] = useState(true)

  function handleClose() {
    setVisible(false)
  }

  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(today))
  const [weekDir, setWeekDir] = useState<'next' | 'prev'>('next')
  const [entries, setEntries] = useState<MealPlanEntry[]>([])
  const [recipeMap, setRecipeMap] = useState<Map<string, { title: string }>>(new Map())
  const [saving, setSaving] = useState<string | null>(null)
  const [recentlySaved, setRecentlySaved] = useState<Set<string>>(new Set())

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const weekEnd = addDays(weekStart, 6)

  useEffect(() => {
    getMealPlanEntries(toISO(weekStart), toISO(weekEnd)).then(setEntries)
  }, [toISO(weekStart)])

  useEffect(() => {
    getRecipes().then(recipes => {
      setRecipeMap(new Map(recipes.map(r => [r.id, { title: r.title }])))
    })
  }, [])

  async function handleDayClick(day: Date) {
    if (!user) return
    const iso = toISO(day)
    const existing = entries.find(e => e.date === iso && e.recipeId === recipe.id)
    setSaving(iso)
    try {
      if (existing) {
        await deleteMealPlanEntry(existing.id)
        setEntries(prev => prev.filter(e => e.id !== existing.id))
      } else {
        const entryId = await createMealPlanEntry({ date: iso, recipeId: recipe.id, recipeTitle: recipe.title, createdBy: user.uid })
        setEntries(prev => [...prev, { id: entryId, date: iso, recipeId: recipe.id, recipeTitle: recipe.title, createdBy: user.uid, createdAt: null as any }])
        setRecentlySaved(prev => new Set([...prev, iso]))
        setTimeout(() => setRecentlySaved(prev => { const n = new Set(prev); n.delete(iso); return n }), 950)
      }
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
    <AnimatePresence onExitComplete={onClose}>
    {visible && (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <motion.div
        className="absolute inset-0 bg-black/40"
        variants={{
          hidden: { opacity: 0, transition: { duration: 0.2 } },
          visible: { opacity: 1, transition: { duration: 0.24 } },
        }}
        initial="hidden" animate="visible" exit="hidden"
        onClick={handleClose}
      />
      <motion.div
        className="lb-paper relative w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col"
        variants={{
          hidden: { y: '100%', transition: { type: 'tween', duration: 0.22, ease: [0.4, 0, 1, 1] } },
          visible: { y: 0, transition: { type: 'spring', stiffness: 300, damping: 32 } },
        }}
        initial="hidden" animate="visible" exit="hidden"
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex-shrink-0">
          <div className="flex items-start justify-between gap-3 mb-1">
            <div>
              <p className="lb-eyebrow truncate max-w-xs" style={{ margin: '0 0 4px' }}>{recipe.title}</p>
              <h2 style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 500, fontSize: 18, letterSpacing: '-0.02em', lineHeight: 1.05, color: 'var(--ink)', margin: 0 }}>
                Toevoegen aan menu
              </h2>
            </div>
            <button onClick={handleClose} className="text-stone hover:text-ink-2 p-1 flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Week navigation */}
          <div className="flex items-center justify-between mt-3">
            <button
              onClick={() => { setWeekDir('prev'); setWeekStart(prev => addDays(prev, -7)) }}
              className="w-7 h-7 flex items-center justify-center rounded-full text-stone transition-colors" style={{ border: '0.5px solid var(--line)', background: 'var(--cream-card)' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div style={{ overflow: 'hidden' }}>
              <AnimatePresence mode="popLayout" custom={weekDir}>
                <motion.span
                  key={toISO(weekStart)}
                  custom={weekDir}
                  variants={{
                    enter: (d: 'next' | 'prev') => ({ x: d === 'next' ? 24 : -24, opacity: 0 }),
                    center: { x: 0, opacity: 1 },
                    exit: (d: 'next' | 'prev') => ({ x: d === 'next' ? -24 : 24, opacity: 0 }),
                  }}
                  initial="enter" animate="center" exit="exit"
                  transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                  className="text-sm font-medium text-ink-2 capitalize"
                  style={{ display: 'block' }}
                >
                  {weekLabel}
                </motion.span>
              </AnimatePresence>
            </div>
            <button
              onClick={() => { setWeekDir('next'); setWeekStart(prev => addDays(prev, 7)) }}
              className="w-7 h-7 flex items-center justify-center rounded-full text-stone transition-colors" style={{ border: '0.5px solid var(--line)', background: 'var(--cream-card)' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Week grid */}
        <div className="px-4 pt-1 pb-8 sm:pb-4">
          <AnimatePresence mode="popLayout" custom={weekDir}>
          <motion.div
            key={toISO(weekStart)}
            custom={weekDir}
            variants={{
              enter: (d: 'next' | 'prev') => ({ x: d === 'next' ? 48 : -48, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (d: 'next' | 'prev') => ({ x: d === 'next' ? -48 : 48, opacity: 0 }),
            }}
            initial="enter" animate="center" exit="exit"
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
          >
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1.5 mb-2">
            {NL_DAYS_SHORT.map(d => (
              <div key={d} style={{ textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, color: 'var(--stone-2)', padding: '4px 0' }}>
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
              const isRecentlySaved = recentlySaved.has(iso)
              const hasThisRecipe = dayEntries.some(e => e.recipeId === recipe.id)

              return (
                <motion.button
                  key={iso}
                  onClick={() => handleDayClick(day)}
                  disabled={isSaving}
                  animate={{ boxShadow: hasThisRecipe ? '0 0 0 2px rgba(107,31,42,0.40)' : '0 0 0 0px rgba(107,31,42,0.00)' }}
                  transition={{ duration: 0.15, ease: [0.25, 0, 0, 1] }}
                  className="flex flex-col items-center gap-1.5 rounded-xl transition-all text-left active:scale-95 disabled:cursor-default"
                  style={{ background: 'var(--cream-card)', border: '0.5px solid var(--line)', padding: '8px 4px 12px' }}
                >
                  {/* Day number */}
                  <span style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', flexShrink: 0, fontSize: 14, fontWeight: 600, lineHeight: 1, color: isToday ? 'var(--cream-card)' : 'var(--ink-2)', background: isToday ? 'var(--bordeaux)' : 'transparent' }}>
                    {day.getDate()}
                    <AnimatePresence>
                      {isRecentlySaved && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                          style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--bordeaux)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </span>
                  {/* Existing entries */}
                  <div style={{ width: '100%', alignSelf: 'stretch', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <AnimatePresence initial={false}>
                    {dayEntries.slice(0, 2).map((e) => {
                      const recipeData = e.recipeId ? recipeMap.get(e.recipeId) : undefined
                      const label = recipeData?.title ?? e.recipeTitle ?? e.customDescription ?? ''
                      return (
                        <motion.div
                          key={e.id}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15, ease: [0.25, 0, 0, 1] }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '0 2px 2px' }}>
                            <div style={{ width: 2.5, height: 10, borderRadius: 2, flexShrink: 0, background: 'var(--bordeaux)' }} />
                            <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 500, fontSize: 7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0, color: 'var(--bordeaux)' }}>
                              {label}
                            </span>
                          </div>
                        </motion.div>
                      )
                    })}
                    </AnimatePresence>
                    <AnimatePresence>
                    {dayEntries.length > 2 && (
                      <motion.div
                        key="overflow"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--stone)', letterSpacing: '0.03em', flexShrink: 0 }}
                      >
                        +{dayEntries.length - 2}
                      </motion.div>
                    )}
                    </AnimatePresence>
                  </div>
                </motion.button>
              )
            })}
          </div>
          </motion.div>
          </AnimatePresence>

          <p className="text-xs text-stone text-center mt-3">
            Klik om toe te voegen · nogmaals klikken verwijdert
          </p>
        </div>
      </motion.div>
    </div>
    )}
    </AnimatePresence>,
    document.body
  )
}
