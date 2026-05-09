import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { MealPlanEntry } from '@/features/calendar/types/calendar'
import type { Recipe } from '@/features/recipe/types/recipe'
import { toISO, isSameDay, weekDays } from '@/features/calendar/utils/dateUtils'
import { NL_DAYS_SHORT } from '@/shared/constants/locale'
import {
  weekContainerVariants,
  weekRowVariants,
} from '@/features/calendar/utils/calendarAnimations'

type WeekViewProps = {
  anchor: Date
  today: Date
  entries: MealPlanEntry[]
  recipeMap: Map<string, Recipe>
  onAdd: (iso: string) => void
  onDelete: (id: string) => void
}

const WeekView = ({ anchor, today, entries, recipeMap, onAdd, onDelete }: WeekViewProps) => {
  const nav = useNavigate()
  const days = weekDays(anchor)
  const entriesForDay = (day: Date) => entries.filter((e) => e.date === toISO(day))

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={weekContainerVariants}
      className="py-3 px-5 pb-[120px] overflow-y-auto h-full"
    >
      {days.map((day, idx) => {
        const dayEntries = entriesForDay(day)
        const isToday = isSameDay(day, today)
        const iso = toISO(day)
        return (
          <motion.div
            key={iso}
            variants={weekRowVariants}
            className={`flex items-start gap-[5px] py-[15px] min-h-[38px] ${idx < 6 ? 'border-b border-[0.5px] border-ink/10' : ''}`}
          >
            {/* Day unit */}
            <div className="grid shrink-0 w-12 mt-[1px] items-center [grid-template-columns:17px_22px] gap-x-[5px]">
              <span
                className={`font-mono text-[10px] tracking-[0.08em] uppercase font-semibold leading-none ${isToday ? 'text-bordeaux' : 'text-stone'}`}
              >
                {NL_DAYS_SHORT[day.getDay()]}
              </span>
              <span
                className={`font-serif italic text-[17px] font-medium leading-none w-[22px] h-[22px] rounded-full flex items-center justify-center ${isToday ? 'text-cream bg-bordeaux' : 'text-ink-2 bg-transparent'}`}
              >
                {day.getDate()}
              </span>
            </div>

            {/* Recipe zone */}
            <div className="flex-1 min-w-0 flex flex-col gap-[5px] pr-[6px] pt-[3px]">
              <AnimatePresence initial={false}>
                {dayEntries.map((e) => {
                  const recipe = recipeMap.get(e.recipeId ?? '')
                  return (
                    <motion.div
                      key={e.id}
                      initial={{ opacity: 0, height: 0, x: -6 }}
                      animate={{ opacity: 1, height: 'auto', x: 0 }}
                      exit={{ opacity: 0, height: 0, x: 0 }}
                      transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
                      className="overflow-hidden flex items-center gap-[5px]"
                    >
                      <div
                        className={`w-[2.5px] self-stretch rounded-[2px] shrink-0 ${recipe ? 'bg-bordeaux' : 'bg-stone'}`}
                      />
                      <span
                        onClick={() => recipe && nav(`/recipe/${recipe.id}`)}
                        className={`flex-1 font-serif italic text-[13.5px] leading-[1.25] font-medium overflow-hidden text-ellipsis whitespace-nowrap ${recipe ? 'text-bordeaux cursor-pointer' : 'text-stone cursor-default'}`}
                      >
                        {recipe ? recipe.title : e.customDescription}
                      </span>
                      <motion.button
                        data-testid="delete-meal-entry-btn"
                        onClick={() => onDelete(e.id)}
                        whileTap={{ scale: 0.78 }}
                        className="bg-transparent border-0 p-0 ml-[1px] text-stone-2 cursor-pointer shrink-0 flex items-center"
                      >
                        <X size={9} strokeWidth={2.5} />
                      </motion.button>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>

            {/* Separator + add */}
            <div className="w-0 self-stretch border-l border-[0.5px] border-ink/10 shrink-0" />
            <motion.button
              data-testid="add-meal-btn"
              onClick={() => onAdd(iso)}
              whileTap={{ scale: 0.78 }}
              className="bg-transparent border-0 p-[2px] text-bordeaux cursor-pointer shrink-0 flex items-center mt-[3px]"
            >
              <Plus size={12} />
            </motion.button>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

export default WeekView
