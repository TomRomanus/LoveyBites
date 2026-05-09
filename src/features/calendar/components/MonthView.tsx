import { motion, AnimatePresence } from 'framer-motion'
import type { MealPlanEntry, Recipe } from '@/features/recipe/types/recipe'
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
  const entriesForDay = (day: Date) => entries.filter((e) => e.date === toISO(day))

  return (
    <div style={{ padding: '16px 10px 80px' }}>
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}
      >
        {NL_DAYS_GRID.map((d) => (
          <div
            key={d}
            style={{
              textAlign: 'center',
              fontFamily: 'var(--mono)',
              fontSize: 10,
              letterSpacing: '0.1em',
              color: 'var(--stone-2)',
              fontWeight: 600,
              textTransform: 'uppercase',
              padding: '4px 0',
            }}
          >
            {d}
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {days.map((day) => {
          const dayEntries = entriesForDay(day)
          const isToday = isSameDay(day, today)
          const inMonth = day.getMonth() === monthStart.getMonth()
          const isSelected = selectedDay ? isSameDay(day, selectedDay) : false
          return (
            <motion.button
              key={toISO(day)}
              onClick={() => onPickDay(day)}
              animate={{
                boxShadow: isSelected
                  ? '0 0 0 2px rgba(107,31,42,0.40)'
                  : '0 0 0 0px rgba(107,31,42,0.00)',
              }}
              transition={{ duration: 0.15, ease: [0.25, 0, 0, 1] }}
              style={{
                background: 'var(--cream-card)',
                border: '0.5px solid var(--line)',
                borderRadius: 10,
                padding: '8px 4px 12px',
                opacity: inMonth ? 1 : 0.28,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 5,
                color: 'var(--ink)',
                textAlign: 'left',
                cursor: 'pointer',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontFamily: 'var(--sans)',
                  fontSize: 11,
                  fontWeight: 600,
                  lineHeight: 1,
                  color: isToday ? 'var(--cream-card)' : 'var(--ink-2)',
                  background: isToday ? 'var(--bordeaux)' : 'transparent',
                }}
              >
                {day.getDate()}
              </div>
              <div
                style={{ width: '100%', minHeight: 10, display: 'flex', flexDirection: 'column' }}
              >
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
                        transition={{ duration: 0.15, ease: [0.25, 0, 0, 1] }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            width: '100%',
                            paddingBottom: 2,
                          }}
                        >
                          <div
                            style={{
                              width: 2,
                              height: 10,
                              borderRadius: 2,
                              flexShrink: 0,
                              background: recipe ? 'var(--bordeaux)' : 'var(--stone)',
                            }}
                          />
                          <span
                            style={{
                              fontFamily: 'var(--serif)',
                              fontStyle: 'italic',
                              fontWeight: 500,
                              fontSize: 7,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              flex: 1,
                              minWidth: 0,
                              color: recipe ? 'var(--bordeaux)' : 'var(--stone)',
                            }}
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
                      transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
                      style={{
                        overflow: 'hidden',
                        fontFamily: 'var(--mono)',
                        fontSize: 7,
                        color: 'var(--stone)',
                        letterSpacing: '0.03em',
                      }}
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
