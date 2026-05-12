import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { EASE_OUT, EASE_SUBTLE } from '@/shared/constants/animations'
import type { MealPlanEntry } from '@/features/calendar/types/calendar'
import type { Recipe } from '@/features/recipe/types/recipe'
import { toISO, startOfMonth, isSameDay, calendarGrid } from '@/features/calendar/utils/dateUtils'
import { NL_DAYS_GRID } from '@/shared/constants/locale'

type MonthViewProps = {
  anchor: Date
  today: Date
  entries: MealPlanEntry[]
  recipeMap: Map<string, Recipe>
  onPickDay: (day: Date) => void
  selectedDay?: Date | null
}

const MonthView = ({
  anchor,
  today,
  entries,
  recipeMap,
  onPickDay,
  selectedDay,
}: MonthViewProps) => {
  const monthStart = startOfMonth(anchor)
  const days = calendarGrid(monthStart)
  const entriesByDay = useMemo(() => {
    const map = new Map<string, MealPlanEntry[]>()
    for (const e of entries) {
      const existing = map.get(e.date)
      if (existing) existing.push(e)
      else map.set(e.date, [e])
    }
    return map
  }, [entries])

  return (
    <div className="py-4 px-[10px] pb-20">
      <div className="grid grid-cols-7 gap-1 mb-1">
        {NL_DAYS_GRID.map((d) => (
          <div
            key={d}
            className="text-center font-mono text-[10px] tracking-[0.1em] text-stone-2 font-semibold uppercase py-1"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dayEntries = entriesByDay.get(toISO(day)) ?? []
          const isToday = isSameDay(day, today)
          const inMonth = day.getMonth() === monthStart.getMonth()
          const isSelected = selectedDay ? isSameDay(day, selectedDay) : false
          return (
            <motion.button
              key={toISO(day)}
              data-testid="month-day-btn"
              data-today={isToday ? 'true' : undefined}
              onClick={() => onPickDay(day)}
              animate={{
                boxShadow: isSelected
                  ? '0 0 0 2px rgba(107,31,42,0.40)'
                  : '0 0 0 0px rgba(107,31,42,0.00)',
              }}
              transition={{ duration: 0.15, ease: EASE_SUBTLE }}
              className="bg-[var(--cream-card)] border-[0.5px] border-ink/10 rounded-[10px] py-2 px-1 pb-3 flex flex-col items-center gap-[5px] text-ink text-left cursor-pointer overflow-hidden"
              style={{ opacity: inMonth ? 1 : 0.28 }}
            >
              <div
                className={`w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 font-sans text-[11px] font-semibold leading-none ${isToday ? 'text-cream bg-bordeaux' : 'text-ink-2 bg-transparent'}`}
              >
                {day.getDate()}
              </div>
              <div className="w-full min-h-[10px] flex flex-col">
                <AnimatePresence initial={false}>
                  {dayEntries.slice(0, 2).map((e) => {
                    const recipe = recipeMap.get(e.recipeId ?? '')
                    const label = recipe ? recipe.title : (e.customDescription ?? '')
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
                          <div
                            className={`w-[2px] h-[10px] rounded-[2px] shrink-0 ${recipe ? 'bg-bordeaux' : 'bg-stone'}`}
                          />
                          <span
                            className={`font-serif italic font-medium text-[7px] overflow-hidden text-ellipsis whitespace-nowrap flex-1 min-w-0 ${recipe ? 'text-bordeaux' : 'text-stone'}`}
                          >
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
                      transition={{ duration: 0.22, ease: EASE_OUT }}
                      className="overflow-hidden font-mono text-[7px] text-stone tracking-[0.03em]"
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
    </div>
  )
}

export default MonthView
