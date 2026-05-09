import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { deleteMealPlanEntry } from '@/features/calendar/api/mealPlan'
import { toISO, addDays, startOfWeek } from '@/features/calendar/utils/dateUtils'
import { pageVariants } from '@/features/calendar/utils/calendarAnimations'
import WeekView from '@/features/calendar/components/WeekView'
import MonthView from '@/features/calendar/components/MonthView'
import DayDetailSheet from '@/features/calendar/components/DayDetailSheet'
import AddMealSheet from '@/features/calendar/components/AddMealSheet'
import ShoppingListSheet from '@/features/calendar/components/shopping/ShoppingListSheet'
import useCalendarView from '@/features/calendar/hooks/useCalendarView'
import useCalendarData from '@/features/calendar/hooks/useCalendarData'
import CalendarHeader from '@/features/calendar/pages/CalendarPage/CalendarHeader'
import CalendarNavControls from '@/features/calendar/pages/CalendarPage/CalendarNavControls'
import CalendarSkeleton from '@/features/calendar/pages/CalendarPage/CalendarSkeleton'

const CalendarPage = () => {
  const {
    view,
    anchor,
    navDir,
    today,
    visibleStartISO,
    visibleEndISO,
    isCurrentPeriod,
    movePeriod,
    goToToday,
    switchView,
  } = useCalendarView()
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
      <CalendarHeader
        view={view}
        anchor={anchor}
        navDir={navDir}
        onShoppingOpen={() => setShowShopping(true)}
      />

      <CalendarNavControls
        view={view}
        isCurrentPeriod={isCurrentPeriod}
        onSwitch={switchView}
        onPrev={() => movePeriod(-1)}
        onNext={() => movePeriod(1)}
        onToday={goToToday}
      />

      {loading ? (
        <CalendarSkeleton />
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
