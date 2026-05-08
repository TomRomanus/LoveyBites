import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { MealPlanEntry, Recipe } from '../../recipe/types/recipe'
import { toISO, isSameDay, weekDays } from '../utils/dateUtils'
import { NL_DAYS_SHORT } from '../../shared/constants/locale'
import { weekContainerVariants, weekRowVariants } from './calendarAnimations'

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
  const entriesForDay = (day: Date) => entries.filter(e => e.date === toISO(day))

  return (
    <motion.div initial="hidden" animate="visible" variants={weekContainerVariants} style={{ padding: '12px 20px 120px', overflowY: 'auto', height: '100%' }}>
      {days.map((day, idx) => {
        const dayEntries = entriesForDay(day)
        const isToday = isSameDay(day, today)
        const iso = toISO(day)
        return (
          <motion.div key={iso} variants={weekRowVariants} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 5,
            padding: '15px 0',
            borderBottom: idx < 6 ? '0.5px solid var(--line)' : 'none',
            minHeight: 38,
          }}>
            {/* Day unit */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '17px 22px',
              columnGap: 5,
              alignItems: 'center',
              flexShrink: 0,
              width: 48,
              marginTop: 1,
            }}>
              <span style={{
                fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.08em',
                textTransform: 'uppercase', fontWeight: 600, lineHeight: 1,
                color: isToday ? 'var(--bordeaux)' : 'var(--stone)',
              }}>
                {NL_DAYS_SHORT[day.getDay()]}
              </span>
              <span style={{
                fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 17,
                fontWeight: 500, lineHeight: 1,
                color: isToday ? 'var(--cream-card)' : 'var(--ink-2)',
                background: isToday ? 'var(--bordeaux)' : 'transparent',
                borderRadius: '50%',
                width: 22, height: 22,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {day.getDate()}
              </span>
            </div>

            {/* Recipe zone */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5, paddingRight: 6, paddingTop: 3 }}>
              <AnimatePresence initial={false}>
                {dayEntries.map(e => {
                  const recipe = recipeMap.get(e.recipeId ?? '')
                  return (
                    <motion.div
                      key={e.id}
                      initial={{ opacity: 0, height: 0, x: -6 }}
                      animate={{ opacity: 1, height: 'auto', x: 0 }}
                      exit={{ opacity: 0, height: 0, x: 0 }}
                      transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
                      style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 5 }}
                    >
                      <div style={{ width: 2.5, alignSelf: 'stretch', borderRadius: 2, flexShrink: 0, background: recipe ? 'var(--bordeaux)' : 'var(--stone)' }} />
                      <span
                        onClick={() => recipe && nav(`/recipe/${recipe.id}`)}
                        style={{
                          flex: 1, fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13.5,
                          lineHeight: 1.25, fontWeight: 500,
                          color: recipe ? 'var(--bordeaux)' : 'var(--stone)',
                          cursor: recipe ? 'pointer' : 'default',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}
                      >
                        {recipe ? recipe.title : e.customDescription}
                      </span>
                      <motion.button
                        onClick={() => onDelete(e.id)}
                        whileTap={{ scale: 0.78 }}
                        style={{ background: 'none', border: 0, padding: 0, marginLeft: 1, color: 'var(--stone-2)', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center' }}
                      >
                        <X size={9} strokeWidth={2.5} />
                      </motion.button>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>

            {/* Separator + add */}
            <div style={{ width: 0, alignSelf: 'stretch', borderLeft: '0.5px solid var(--line)', flexShrink: 0 }} />
            <motion.button
              onClick={() => onAdd(iso)}
              whileTap={{ scale: 0.78 }}
              style={{ background: 'none', border: 0, padding: 2, color: 'var(--bordeaux)', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', marginTop: 3 }}
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
