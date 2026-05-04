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
  const [recipeMap, setRecipeMap] = useState<Map<string, { title: string; color: string }>>(new Map())
  const [saving, setSaving] = useState<string | null>(null)
  const [recentlySaved, setRecentlySaved] = useState<Set<string>>(new Set())
  const [newEntryIds, setNewEntryIds] = useState<Set<string>>(new Set())

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const weekEnd = addDays(weekStart, 6)

  useEffect(() => {
    getMealPlanEntries(toISO(weekStart), toISO(weekEnd)).then(setEntries)
  }, [toISO(weekStart)])

  useEffect(() => {
    getRecipes().then(recipes => {
      setRecipeMap(new Map(recipes.map(r => [r.id, { title: r.title, color: r.color ?? '#6b1f2a' }])))
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
        setNewEntryIds(prev => new Set([...prev, entryId]))
        setTimeout(() => setRecentlySaved(prev => { const n = new Set(prev); n.delete(iso); return n }), 950)
        setTimeout(() => setNewEntryIds(prev => { const n = new Set(prev); n.delete(entryId); return n }), 400)
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
        className="relative bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col"
        variants={{
          hidden: { y: '100%', transition: { type: 'tween', duration: 0.22, ease: [0.4, 0, 1, 1] } },
          visible: { y: 0, transition: { type: 'spring', stiffness: 300, damping: 32 } },
        }}
        initial="hidden" animate="visible" exit="hidden"
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-paper-3 flex-shrink-0">
          <div className="flex items-start justify-between gap-3 mb-1">
            <div>
              <h2 className="font-serif text-lg font-bold italic text-ink leading-tight">
                Toevoegen aan menu
              </h2>
              <p className="text-sm text-stone mt-0.5 truncate max-w-xs">{recipe.title}</p>
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
              className="w-7 h-7 flex items-center justify-center rounded-full border border-paper-3 hover:border-bordeaux-soft text-stone hover:text-bordeaux-dark transition-colors"
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
              className="w-7 h-7 flex items-center justify-center rounded-full border border-paper-3 hover:border-bordeaux-soft text-stone hover:text-bordeaux-dark transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Week grid */}
        <div className="px-4 pt-4 pb-8 sm:pb-4">
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
          <div className="grid grid-cols-7 mb-2">
            {NL_DAYS_SHORT.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-stone uppercase tracking-wider py-1">
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
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  style={{ paddingLeft: 4, paddingRight: 4 }}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all text-left bg-white border-paper-3 hover:border-bordeaux-soft hover:bg-bordeaux-tint active:scale-95 disabled:cursor-default"
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
                  <div style={{ width: '100%', alignSelf: 'stretch', display: 'flex', flexDirection: 'column', gap: 2, height: 42, overflow: 'hidden', flexShrink: 0 }}>
                    <AnimatePresence>
                    {dayEntries.slice(0, 2).map((e) => {
                      const recipeData = e.recipeId ? recipeMap.get(e.recipeId) : undefined
                      const label = recipeData?.title ?? e.recipeTitle ?? e.customDescription ?? ''
                      const color = recipeData?.color ?? null
                      return (
                        <motion.div
                          key={e.id}
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                          style={{
                            width: '100%', flexShrink: 0, borderRadius: 3, padding: '1px 3px',
                            fontFamily: 'var(--mono)', fontSize: 7, letterSpacing: '0.03em',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            background: color ? color + '18' : 'var(--paper-2)',
                            color: color ? color : 'var(--stone)',
                          }}
                        >
                          {label}
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
