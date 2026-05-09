import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { EASE_IN } from '@/shared/constants/animations'
import { X } from 'lucide-react'
import type { Recipe } from '@/features/recipe/types/recipe'
import { toISO } from '@/features/calendar/utils/dateUtils'
import { NL_DAYS_GRID } from '@/shared/constants/locale'
import { useAddToCalendar } from './useAddToCalendar'
import { WeekHeader } from './WeekHeader'
import { DayCell } from './DayCell'

// ─────────────────────────────────────────────────────────────────────────────

type Props = {
  recipe: Pick<Recipe, 'id' | 'title'>
  onClose: () => void
}

const AddToCalendarModal = ({ recipe, onClose }: Props) => {
  const [visible, setVisible] = useState(true)

  const handleClose = () => {
    setVisible(false)
  }

  const {
    today,
    weekStart,
    weekDir,
    weekLabel,
    days,
    recipeMap,
    saving,
    recentlySaved,
    goToPrevWeek,
    goToNextWeek,
    handleDayClick,
    entriesForDay,
  } = useAddToCalendar({ recipe })

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
              <WeekHeader
                weekStart={weekStart}
                weekDir={weekDir}
                weekLabel={weekLabel}
                onPrevWeek={goToPrevWeek}
                onNextWeek={goToNextWeek}
              />
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
                      const dayEntries = entriesForDay(day)
                      const hasThisRecipe = dayEntries.some((e) => e.recipeId === recipe.id)

                      return (
                        <DayCell
                          key={iso}
                          day={day}
                          today={today}
                          dayEntries={dayEntries}
                          recipeMap={recipeMap}
                          hasThisRecipe={hasThisRecipe}
                          isSaving={saving === iso}
                          isRecentlySaved={recentlySaved.has(iso)}
                          onClick={() => handleDayClick(day)}
                        />
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
