import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { EASE_IN, EASE_SUBTLE } from '@/shared/constants/animations'
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import {
  getMealPlanEntries,
  createMealPlanEntry,
  deleteMealPlanEntry,
} from '@/features/calendar/api/mealPlan'
import { getRecipes } from '@/features/recipe/api/recipes'
import type { Timestamp } from 'firebase/firestore'
import type { MealPlanEntry } from '@/features/calendar/types/calendar'
import type { Recipe } from '@/features/recipe/types/recipe'
import { useAuth } from '@/features/auth/contexts/AuthContext'
import { toISO, addDays, startOfWeek, isSameDay } from '@/features/calendar/utils/dateUtils'
import { NL_DAYS_GRID, NL_MONTHS } from '@/shared/constants/locale'

// ─────────────────────────────────────────────────────────────────────────────

type Props = {
  recipe: Pick<Recipe, 'id' | 'title'>
  onClose: () => void
}

const AddToCalendarModal = ({ recipe, onClose }: Props) => {
  const { user } = useAuth()
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])
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
  const weekStartISO = toISO(weekStart)
  const weekEndISO = toISO(weekEnd)

  useEffect(() => {
    getMealPlanEntries(weekStartISO, weekEndISO).then(setEntries)
  }, [weekStartISO, weekEndISO])

  useEffect(() => {
    getRecipes().then((recipes) => {
      setRecipeMap(new Map(recipes.map((r) => [r.id, { title: r.title }])))
    })
  }, [])

  const handleDayClick = async (day: Date) => {
    if (!user) return
    const iso = toISO(day)
    const existing = entries.find((e) => e.date === iso && e.recipeId === recipe.id)
    setSaving(iso)
    try {
      if (existing) {
        await deleteMealPlanEntry(existing.id)
        setEntries((prev) => prev.filter((e) => e.id !== existing.id))
      } else {
        const entryId = await createMealPlanEntry({
          date: iso,
          recipeId: recipe.id,
          recipeTitle: recipe.title,
          createdBy: user.uid,
        })
        setEntries((prev) => [
          ...prev,
          {
            id: entryId,
            date: iso,
            recipeId: recipe.id,
            recipeTitle: recipe.title,
            createdBy: user.uid,
            createdAt: null as unknown as Timestamp,
          },
        ])
        setRecentlySaved((prev) => new Set([...prev, iso]))
        setTimeout(
          () =>
            setRecentlySaved((prev) => {
              const n = new Set(prev)
              n.delete(iso)
              return n
            }),
          950,
        )
      }
    } finally {
      setSaving(null)
    }
  }

  const entriesForDay = (day: Date): MealPlanEntry[] => {
    return entries.filter((e) => e.date === toISO(day))
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
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <motion.div
            className="absolute inset-0 bg-ink/40"
            variants={{
              hidden: { opacity: 0, transition: { duration: 0.2 } },
              visible: { opacity: 1, transition: { duration: 0.24 } },
            }}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={handleClose}
          />
          <motion.div
            className="lb-paper relative w-full rounded-t-[24px] shadow-[0_-8px_40px_rgba(31,29,26,0.16)] flex flex-col"
            variants={{
              hidden: {
                y: '100%',
                transition: { type: 'tween', duration: 0.22, ease: EASE_IN },
              },
              visible: { y: 0, transition: { type: 'spring', stiffness: 300, damping: 32 } },
            }}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            {/* Header */}
            <div className="py-5 px-5 pb-3 shrink-0">
              <div className="flex items-start justify-between gap-3 mb-1">
                <div>
                  <p className="lb-eyebrow m-0 mb-1 overflow-hidden text-ellipsis whitespace-nowrap max-w-[20rem]">
                    {recipe.title}
                  </p>
                  <h2 className="font-serif italic font-medium text-[18px] tracking-[-0.02em] leading-[1.05] text-ink m-0">
                    Toevoegen aan menu
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  className="bg-transparent border-0 text-stone p-1 shrink-0 mt-[2px] cursor-pointer flex items-center"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Week navigation */}
              <div className="flex items-center justify-between mt-3">
                <button
                  onClick={() => {
                    setWeekDir('prev')
                    setWeekStart((prev) => addDays(prev, -7))
                  }}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-stone border-[0.5px] border-ink/10 bg-[var(--cream-card)] cursor-pointer"
                >
                  <ChevronLeft size={14} strokeWidth={2.5} />
                </button>
                <div className="overflow-hidden">
                  <AnimatePresence mode="popLayout" custom={weekDir}>
                    <motion.span
                      key={toISO(weekStart)}
                      custom={weekDir}
                      variants={{
                        enter: (d: 'next' | 'prev') => ({ x: d === 'next' ? 24 : -24, opacity: 0 }),
                        center: { x: 0, opacity: 1 },
                        exit: (d: 'next' | 'prev') => ({ x: d === 'next' ? -24 : 24, opacity: 0 }),
                      }}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                      className="block text-[14px] font-medium text-ink-2 capitalize"
                    >
                      {weekLabel}
                    </motion.span>
                  </AnimatePresence>
                </div>
                <button
                  onClick={() => {
                    setWeekDir('next')
                    setWeekStart((prev) => addDays(prev, 7))
                  }}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-stone border-[0.5px] border-ink/10 bg-[var(--cream-card)] cursor-pointer"
                >
                  <ChevronRight size={14} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Week grid */}
            <div className="py-1 px-4 pb-8">
              <AnimatePresence mode="popLayout" custom={weekDir}>
                <motion.div
                  key={toISO(weekStart)}
                  custom={weekDir}
                  variants={{
                    enter: (d: 'next' | 'prev') => ({ x: d === 'next' ? 48 : -48, opacity: 0 }),
                    center: { x: 0, opacity: 1 },
                    exit: (d: 'next' | 'prev') => ({ x: d === 'next' ? -48 : 48, opacity: 0 }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: 'spring', stiffness: 380, damping: 36 }}
                >
                  {/* Day headers */}
                  <div className="grid grid-cols-7 gap-[6px] mb-2">
                    {NL_DAYS_GRID.map((d) => (
                      <div
                        key={d}
                        className="text-center font-mono text-[10px] tracking-[0.1em] uppercase font-semibold text-stone-2 py-1"
                      >
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Day cells */}
                  <div className="grid grid-cols-7 gap-[6px]">
                    {days.map((day) => {
                      const iso = toISO(day)
                      const isToday = isSameDay(day, today)
                      const dayEntries = entriesForDay(day)
                      const isSaving = saving === iso
                      const isRecentlySaved = recentlySaved.has(iso)
                      const hasThisRecipe = dayEntries.some((e) => e.recipeId === recipe.id)

                      return (
                        <motion.button
                          key={iso}
                          data-today={isToday ? 'true' : undefined}
                          onClick={() => handleDayClick(day)}
                          disabled={isSaving}
                          animate={{
                            boxShadow: hasThisRecipe
                              ? '0 0 0 2px rgba(107,31,42,0.40)'
                              : '0 0 0 0px rgba(107,31,42,0.00)',
                          }}
                          transition={{ duration: 0.15, ease: EASE_SUBTLE }}
                          className="bg-[var(--cream-card)] border-[0.5px] border-ink/10 py-2 px-1 pb-3 rounded-[12px] flex flex-col items-center gap-[6px] cursor-pointer"
                        >
                          {/* Day number */}
                          <span
                            className={`relative flex items-center justify-center w-6 h-6 rounded-full shrink-0 text-[14px] font-semibold leading-none ${isToday ? 'text-cream bg-bordeaux' : 'text-ink-2 bg-transparent'}`}
                          >
                            {day.getDate()}
                            <AnimatePresence>
                              {isRecentlySaved && (
                                <motion.span
                                  data-testid="day-saved-check"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  exit={{ opacity: 0 }}
                                  transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                                  className="absolute inset-0 rounded-full bg-bordeaux flex items-center justify-center"
                                >
                                  <Check size={10} strokeWidth={3} color="white" />
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </span>
                          {/* Existing entries */}
                          <div className="w-full self-stretch flex flex-col gap-[2px]">
                            <AnimatePresence initial={false}>
                              {dayEntries.slice(0, 2).map((e) => {
                                const recipeData = e.recipeId
                                  ? recipeMap.get(e.recipeId)
                                  : undefined
                                const label =
                                  recipeData?.title ?? e.recipeTitle ?? e.customDescription ?? ''
                                return (
                                  <motion.div
                                    key={e.id}
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.15, ease: EASE_SUBTLE }}
                                    className="overflow-hidden"
                                  >
                                    <div className="flex items-center gap-[3px] px-[2px] pb-[2px]">
                                      <div className="w-[2.5px] h-[10px] rounded-[2px] shrink-0 bg-bordeaux" />
                                      <span className="font-serif italic font-medium text-[7px] overflow-hidden text-ellipsis whitespace-nowrap flex-1 min-w-0 text-bordeaux">
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
                                  className="font-mono text-[7px] text-stone tracking-[0.03em] shrink-0"
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

              <p className="text-[12px] text-stone text-center mt-3 mb-0">
                Klik om toe te voegen · nogmaals klikken verwijdert
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

export default AddToCalendarModal
