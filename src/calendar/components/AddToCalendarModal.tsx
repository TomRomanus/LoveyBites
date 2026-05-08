import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { getMealPlanEntries, createMealPlanEntry, deleteMealPlanEntry } from '../services/mealPlan'
import { getRecipes } from '../../recipe/services/recipes'
import type { Timestamp } from 'firebase/firestore'
import type { MealPlanEntry, Recipe } from '../../recipe/types/recipe'
import { useAuth } from '../../auth/contexts/AuthContext'
import { toISO, addDays, startOfWeek, isSameDay } from '../utils/dateUtils'
import { NL_DAYS_GRID, NL_MONTHS } from '../../shared/constants/locale'

// ─────────────────────────────────────────────────────────────────────────────

type Props = {
  recipe: Pick<Recipe, 'id' | 'title'>
  onClose: () => void
}

const AddToCalendarModal = ({ recipe, onClose }: Props) => {
  const { user } = useAuth()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [visible, setVisible] = useState(true)

  const handleClose = () => {
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

  const handleDayClick = async (day: Date) => {
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
        setEntries(prev => [...prev, { id: entryId, date: iso, recipeId: recipe.id, recipeTitle: recipe.title, createdBy: user.uid, createdAt: null as unknown as Timestamp }])
        setRecentlySaved(prev => new Set([...prev, iso]))
        setTimeout(() => setRecentlySaved(prev => { const n = new Set(prev); n.delete(iso); return n }), 950)
      }
    } finally {
      setSaving(null)
    }
  }

  const entriesForDay = (day: Date): MealPlanEntry[] => {
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <motion.div
        style={{ position: 'absolute', inset: 0, background: 'rgba(31,29,26,0.4)' }}
        variants={{
          hidden: { opacity: 0, transition: { duration: 0.2 } },
          visible: { opacity: 1, transition: { duration: 0.24 } },
        }}
        initial="hidden" animate="visible" exit="hidden"
        onClick={handleClose}
      />
      <motion.div
        className="lb-paper"
        style={{ position: 'relative', width: '100%', borderRadius: '24px 24px 0 0', boxShadow: '0 -8px 40px rgba(31,29,26,0.16)', display: 'flex', flexDirection: 'column' }}
        variants={{
          hidden: { y: '100%', transition: { type: 'tween', duration: 0.22, ease: [0.4, 0, 1, 1] } },
          visible: { y: 0, transition: { type: 'spring', stiffness: 300, damping: 32 } },
        }}
        initial="hidden" animate="visible" exit="hidden"
      >
        {/* Header */}
        <div style={{ padding: '20px 20px 12px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
            <div>
              <p className="lb-eyebrow" style={{ margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '20rem' }}>{recipe.title}</p>
              <h2 style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 500, fontSize: 18, letterSpacing: '-0.02em', lineHeight: 1.05, color: 'var(--ink)', margin: 0 }}>
                Toevoegen aan menu
              </h2>
            </div>
            <button onClick={handleClose} style={{ background: 'none', border: 0, color: 'var(--stone)', padding: 4, flexShrink: 0, marginTop: 2, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <X size={20} />
            </button>
          </div>

          {/* Week navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
            <button
              onClick={() => { setWeekDir('prev'); setWeekStart(prev => addDays(prev, -7)) }}
              style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', color: 'var(--stone)', border: '0.5px solid var(--line)', background: 'var(--cream-card)', cursor: 'pointer' }}
            >
              <ChevronLeft size={14} strokeWidth={2.5} />
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
                  style={{ display: 'block', fontSize: 14, fontWeight: 500, color: 'var(--ink-2)', textTransform: 'capitalize' }}
                >
                  {weekLabel}
                </motion.span>
              </AnimatePresence>
            </div>
            <button
              onClick={() => { setWeekDir('next'); setWeekStart(prev => addDays(prev, 7)) }}
              style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', color: 'var(--stone)', border: '0.5px solid var(--line)', background: 'var(--cream-card)', cursor: 'pointer' }}
            >
              <ChevronRight size={14} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Week grid */}
        <div style={{ padding: '4px 16px 32px' }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 8 }}>
            {NL_DAYS_GRID.map(d => (
              <div key={d} style={{ textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, color: 'var(--stone-2)', padding: '4px 0' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
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
                  style={{ background: 'var(--cream-card)', border: '0.5px solid var(--line)', padding: '8px 4px 12px', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }}
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
                          <Check size={10} strokeWidth={3} color="white" />
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

          <p style={{ fontSize: 12, color: 'var(--stone)', textAlign: 'center', marginTop: 12, marginBottom: 0 }}>
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

export default AddToCalendarModal
