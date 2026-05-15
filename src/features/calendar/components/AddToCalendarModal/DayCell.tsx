import { memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'
import { EASE_SUBTLE } from '@/shared/constants/animations'
import { toISO, isSameDay } from '@/features/calendar/utils/dateUtils'
import type { MealPlanEntry } from '@/features/calendar/types/calendar'

export type DaySaveState = {
  hasThisRecipe: boolean
  isSaving: boolean
  isRecentlySaved: boolean
}

type DayCellProps = {
  day: Date
  today: Date
  dayEntries: MealPlanEntry[]
  recipeMap: Map<string, { title: string }>
  saveState: DaySaveState
  onClick: () => void
}

function DayCellInner({ day, today, dayEntries, recipeMap, saveState, onClick }: DayCellProps) {
  const { hasThisRecipe, isSaving, isRecentlySaved } = saveState
  const iso = toISO(day)
  const isToday = isSameDay(day, today)

  return (
    <motion.button
      key={iso}
      data-today={isToday ? 'true' : undefined}
      onClick={onClick}
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
            const recipeData = e.recipeId ? recipeMap.get(e.recipeId) : undefined
            const label = recipeData?.title ?? e.recipeTitle ?? e.customDescription ?? ''
            return (
              <motion.div
                key={e.id}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15, ease: EASE_SUBTLE }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-[2px] w-full pb-[2px]">
                  <div className={`w-[2px] h-[10px] rounded-[2px] shrink-0 ${recipeData ? 'bg-bordeaux' : 'bg-stone'}`} />
                  <span className={`font-serif italic font-medium text-[7px] text-left overflow-hidden text-ellipsis whitespace-nowrap flex-1 min-w-0 ${recipeData ? 'text-bordeaux' : 'text-stone'}`}>
                    {label}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
        <AnimatePresence initial={false}>
          {dayEntries.length > 2 && (
            <motion.div
              key="overflow"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15, ease: EASE_SUBTLE }}
              className="overflow-hidden w-full px-[2px] font-mono text-[7px] text-stone tracking-[0.03em] text-left"
            >
              +{dayEntries.length - 2}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  )
}

export const DayCell = memo(DayCellInner)
