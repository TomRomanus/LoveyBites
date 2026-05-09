import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react'
import { deleteMealPlanEntry } from '../services/mealPlan'
import { toISO, addDays, startOfWeek } from '../utils/dateUtils'
import { NL_MONTHS, NL_MONTHS_SHORT } from '../../shared/constants/locale'
import { titleVariants, pageVariants } from '../components/calendarAnimations'
import WeekView from '../components/WeekView'
import MonthView from '../components/MonthView'
import DayDetailSheet from '../components/DayDetailSheet'
import AddMealSheet from '../components/AddMealSheet'
import ShoppingListSheet from '../components/ShoppingListSheet'
import useCalendarView from '../hooks/useCalendarView'
import useCalendarData from '../hooks/useCalendarData'
import AnimatedTabBar from '../../shared/components/AnimatedTabBar'

const CalendarPage = () => {
  const { view, anchor, navDir, today, visibleStartISO, visibleEndISO, isCurrentPeriod, movePeriod, goToToday, switchView } =
    useCalendarView()
  const { entries, setEntries, recipeMap, loading, reload } = useCalendarData(
    visibleStartISO,
    visibleEndISO,
  )

  const [modalDate, setModalDate] = useState<string | null>(null)
  const [detailDay, setDetailDay] = useState<Date | null>(null)
  const [showShopping, setShowShopping] = useState(false)

  const handleDelete = async (id: string) => {
    await deleteMealPlanEntry(id)
    setEntries((prev) => prev.filter((e) => e.id !== id))
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
            data-testid="shopping-list-btn"
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
        <AnimatedTabBar
          layoutId="calendar-tabs"
          tabs={[
            { key: 'week', label: 'WEEK' },
            { key: 'month', label: 'MAAND' },
          ]}
          active={view}
          onChange={switchView}
          variant="underline"
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <motion.button
            data-testid="prev-period-btn"
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
            data-testid="next-period-btn"
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

      <DayDetailSheet
        visible={!!detailDay}
        date={detailDay ?? new Date()}
        entries={detailDay ? entries.filter((e) => e.date === toISO(detailDay)) : []}
        recipeMap={recipeMap}
        onDelete={handleDelete}
        onAdd={() => {
          setModalDate(toISO(detailDay!))
          setDetailDay(null)
        }}
        onClose={() => setDetailDay(null)}
      />

      <AddMealSheet
        visible={!!modalDate}
        date={modalDate ?? ''}
        existingRecipeIds={
          modalDate
            ? entries.filter((e) => e.date === modalDate && e.recipeId).map((e) => e.recipeId!)
            : []
        }
        onClose={() => setModalDate(null)}
        onSaved={() => {
          setModalDate(null)
          reload()
        }}
      />

      <ShoppingListSheet
        visible={showShopping}
        defaultStart={shoppingStart}
        defaultEnd={shoppingEnd}
        onClose={() => setShowShopping(false)}
      />
    </div>
  )
}

export default CalendarPage
