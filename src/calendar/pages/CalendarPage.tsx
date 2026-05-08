import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react'
import { getMealPlanEntries, deleteMealPlanEntry } from '../services/mealPlan'
import { getRecipe } from '../../recipe/services/recipes'
import type { MealPlanEntry, Recipe } from '../../recipe/types/recipe'
import { toISO, addDays, startOfWeek, startOfMonth, calendarGrid } from '../utils/dateUtils'
import { NL_MONTHS, NL_MONTHS_SHORT } from '../../shared/constants/locale'
import { titleVariants, pageVariants } from '../components/calendarAnimations'
import type { ViewMode } from '../types/calendar'
import WeekView from '../components/WeekView'
import MonthView from '../components/MonthView'
import DayDetailSheet from '../components/DayDetailSheet'
import AddMealSheet from '../components/AddMealSheet'
import ShoppingListSheet from '../components/ShoppingListSheet'

const CalendarPage = () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [view, setView] = useState<ViewMode>('week')
  const [anchor, setAnchor] = useState<Date>(startOfWeek(today))
  const [navDir, setNavDir] = useState(0)
  const [entries, setEntries] = useState<MealPlanEntry[]>([])
  const [recipeMap, setRecipeMap] = useState<Map<string, Recipe>>(new Map())
  const [loading, setLoading] = useState(true)
  const [modalDate, setModalDate] = useState<string | null>(null)
  const [detailDay, setDetailDay] = useState<Date | null>(null)
  const [showShopping, setShowShopping] = useState(false)

  const { visibleStart, visibleEnd } = (() => {
    if (view === 'week') {
      return { visibleStart: anchor, visibleEnd: addDays(anchor, 6) }
    }
    const ms = startOfMonth(anchor)
    const grid = calendarGrid(ms)
    return { visibleStart: grid[0], visibleEnd: grid[grid.length - 1] }
  })()

  const visibleStartISO = toISO(visibleStart)
  const visibleEndISO = toISO(visibleEnd)

  const loadEntries = useCallback(async () => {
    const es = await getMealPlanEntries(visibleStartISO, visibleEndISO)
    setEntries(es)
    const ids = [...new Set(es.map((e) => e.recipeId).filter(Boolean) as string[])]
    const pairs = await Promise.all(
      ids.map(async (id) => {
        const r = await getRecipe(id)
        return r ? ([id, r] as [string, Recipe]) : null
      }),
    )
    const map = new Map<string, Recipe>()
    pairs.forEach((p) => p && map.set(p[0], p[1]))
    setRecipeMap(map)
    setLoading(false)
  }, [visibleStartISO, visibleEndISO])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    loadEntries()
  }, [loadEntries])

  const handleDelete = async (id: string) => {
    await deleteMealPlanEntry(id)
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  const movePeriod = (dir: -1 | 1) => {
    setNavDir(dir)
    setAnchor((prev) => {
      if (view === 'week') return addDays(prev, dir * 7)
      const d = new Date(prev)
      d.setMonth(d.getMonth() + dir)
      return d
    })
  }

  const isCurrentPeriod =
    view === 'week'
      ? toISO(anchor) === toISO(startOfWeek(today))
      : anchor.getMonth() === today.getMonth() && anchor.getFullYear() === today.getFullYear()

  const goToToday = () => {
    setAnchor(view === 'week' ? startOfWeek(today) : startOfMonth(today))
  }

  const shoppingStart = toISO(startOfWeek(today))
  const shoppingEnd = toISO(addDays(startOfWeek(today), 6))

  return (
    <div
      className="lb-paper"
      style={{
        height: '100dvh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* Header */}
      <div style={{ padding: '24px 20px 0' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div>
            <div className="lb-eyebrow">HET MENU</div>
            <h1 className="lb-display" style={{ margin: '8px 0 0', fontSize: 34 }}>
              {view === 'week' ? (
                <>
                  {'Week van '}
                  <AnimatePresence mode="popLayout" custom={navDir}>
                    <motion.b
                      key={`wm-${anchor.getFullYear()}-${anchor.getMonth()}`}
                      custom={navDir}
                      variants={titleVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      style={{ color: 'var(--bordeaux)', display: 'inline-block' }}
                    >
                      {NL_MONTHS_SHORT[anchor.getMonth()]}
                    </motion.b>
                  </AnimatePresence>{' '}
                  <AnimatePresence mode="popLayout" custom={navDir}>
                    <motion.b
                      key={`wd-${toISO(anchor)}`}
                      custom={navDir}
                      variants={titleVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      style={{ color: 'var(--bordeaux)', display: 'inline-block' }}
                    >
                      {anchor.getDate()}
                    </motion.b>
                  </AnimatePresence>
                </>
              ) : (
                <>
                  <AnimatePresence mode="popLayout" custom={navDir}>
                    <motion.b
                      key={`month-${anchor.getFullYear()}-${anchor.getMonth()}`}
                      custom={navDir}
                      variants={titleVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      style={{ color: 'var(--bordeaux)', display: 'inline-block' }}
                    >
                      {NL_MONTHS[anchor.getMonth()]}
                    </motion.b>
                  </AnimatePresence>{' '}
                  <AnimatePresence mode="popLayout" custom={navDir}>
                    <motion.b
                      key={`year-${anchor.getFullYear()}`}
                      custom={navDir}
                      variants={titleVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      style={{ display: 'inline-block' }}
                    >
                      {anchor.getFullYear()}
                    </motion.b>
                  </AnimatePresence>
                </>
              )}
            </h1>
          </div>
          <motion.button
            onClick={() => setShowShopping(true)}
            whileTap={{ scale: 0.88 }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              border: 0,
              background: 'var(--paper)',
              boxShadow: '0 1px 2px rgba(31,29,26,0.04), 0 0 0 0.5px var(--line)',
              color: 'var(--bordeaux)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <ShoppingBag size={15} strokeWidth={1.8} />
          </motion.button>
        </div>
      </div>

      {/* Controls */}
      <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <LayoutGroup id="calendar-tabs">
          <div style={{ display: 'flex', borderBottom: '0.5px solid var(--line)' }}>
            {(
              [
                ['week', 'WEEK'],
                ['month', 'MAAND'],
              ] as const
            ).map(([v, l]) => (
              <motion.button
                key={v}
                onClick={() => {
                  setNavDir(v === 'month' ? 2 : -2)
                  setView(v)
                  setAnchor(v === 'week' ? startOfWeek(today) : startOfMonth(today))
                }}
                animate={{ color: view === v ? 'var(--bordeaux)' : 'var(--stone)' }}
                transition={{ duration: 0.2 }}
                style={{
                  position: 'relative',
                  background: 'none',
                  border: 0,
                  padding: '0 2px 7px',
                  marginRight: v === 'week' ? 20 : 0,
                  marginBottom: -0.5,
                  fontFamily: 'var(--mono)',
                  fontSize: 11.5,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  fontWeight: view === v ? 700 : 600,
                  cursor: 'pointer',
                }}
              >
                {l}
                {view === v && (
                  <motion.div
                    layoutId="cal-tab-line"
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 2.5,
                      background: 'var(--bordeaux)',
                      borderRadius: '2px 2px 0 0',
                    }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </LayoutGroup>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <motion.button
            onClick={() => movePeriod(-1)}
            className="lb-icon-btn"
            whileTap={{ scale: 0.88 }}
            style={{ width: 40, height: 40 }}
          >
            <ChevronLeft size={18} />
          </motion.button>
          <motion.button
            onClick={goToToday}
            disabled={isCurrentPeriod}
            className="lb-btn lb-btn--ghost lb-btn--small"
            whileTap={{ scale: 0.95 }}
            style={{
              flex: 1,
              height: 40,
              borderRadius: 20,
              fontSize: 13,
              opacity: isCurrentPeriod ? 0.45 : 1,
            }}
          >
            Vandaag
          </motion.button>
          <motion.button
            onClick={() => movePeriod(1)}
            className="lb-icon-btn"
            whileTap={{ scale: 0.88 }}
            style={{ width: 40, height: 40 }}
          >
            <ChevronRight size={18} />
          </motion.button>
        </div>
      </div>

      {/* Calendar views */}
      {loading ? (
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px 120px' }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 5,
                padding: '15px 0',
                borderBottom: i < 6 ? '0.5px solid var(--line)' : 'none',
                minHeight: 38,
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '17px 22px',
                  columnGap: 5,
                  alignItems: 'center',
                  flexShrink: 0,
                  width: 48,
                  marginTop: 1,
                }}
              >
                <div className="lb-skeleton" style={{ width: 14, height: 9, borderRadius: 2 }} />
                <div
                  className="lb-skeleton"
                  style={{ width: 22, height: 22, borderRadius: '50%' }}
                />
              </div>
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 5,
                  paddingRight: 6,
                  paddingTop: 3,
                }}
              >
                {([1, 2, 1, 0, 1, 2, 0] as const)[i] > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div
                      className="lb-skeleton"
                      style={{ width: 2.5, height: 13, borderRadius: 2, flexShrink: 0 }}
                    />
                    <div
                      className="lb-skeleton"
                      style={{
                        height: 13,
                        borderRadius: 5,
                        flex: 1,
                        maxWidth: ['60%', '45%', '70%', '30%', '55%', '40%', '65%'][i],
                      }}
                    />
                  </div>
                )}
                {([1, 2, 1, 0, 1, 2, 0] as const)[i] > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div
                      className="lb-skeleton"
                      style={{ width: 2.5, height: 13, borderRadius: 2, flexShrink: 0 }}
                    />
                    <div
                      className="lb-skeleton"
                      style={{
                        height: 13,
                        borderRadius: 5,
                        flex: 1,
                        maxWidth: ['75%', '35%', '55%', '80%', '40%', '50%', '70%'][i],
                      }}
                    />
                  </div>
                )}
              </div>
              <div
                style={{
                  width: 0,
                  alignSelf: 'stretch',
                  borderLeft: '0.5px solid var(--line)',
                  flexShrink: 0,
                }}
              />
              <div
                className="lb-skeleton"
                style={{ width: 12, height: 12, borderRadius: 3, flexShrink: 0, marginTop: 3 }}
              />
            </div>
          ))}
        </div>
      ) : (
        <AnimatePresence mode="wait" custom={navDir}>
          <motion.div
            key={`${view}-${view === 'week' ? toISO(anchor) : `${anchor.getFullYear()}-${anchor.getMonth()}`}`}
            custom={navDir}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            style={{
              willChange: 'transform, opacity',
              flex: 1,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {view === 'week' ? (
              <WeekView
                anchor={anchor}
                today={today}
                entries={entries}
                recipeMap={recipeMap}
                onAdd={setModalDate}
                onDelete={handleDelete}
              />
            ) : (
              <MonthView
                anchor={anchor}
                today={today}
                entries={entries}
                recipeMap={recipeMap}
                onPickDay={setDetailDay}
                selectedDay={detailDay}
              />
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Day detail sheet (month view) */}
      <AnimatePresence>
        {detailDay && (
          <DayDetailSheet
            date={detailDay}
            entries={entries.filter((e) => e.date === toISO(detailDay))}
            recipeMap={recipeMap}
            onDelete={async (id) => {
              await handleDelete(id)
            }}
            onAdd={() => {
              setModalDate(toISO(detailDay))
              setDetailDay(null)
            }}
            onClose={() => setDetailDay(null)}
          />
        )}
      </AnimatePresence>

      {/* Add meal sheet */}
      <AnimatePresence>
        {modalDate && (
          <AddMealSheet
            date={modalDate}
            existingRecipeIds={entries
              .filter((e) => e.date === modalDate && e.recipeId)
              .map((e) => e.recipeId!)}
            onClose={() => setModalDate(null)}
            onSaved={() => {
              setModalDate(null)
              loadEntries()
            }}
          />
        )}
      </AnimatePresence>

      {/* Shopping list sheet */}
      <AnimatePresence>
        {showShopping && (
          <ShoppingListSheet
            defaultStart={shoppingStart}
            defaultEnd={shoppingEnd}
            onClose={() => setShowShopping(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default CalendarPage
