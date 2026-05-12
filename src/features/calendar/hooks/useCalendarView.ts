import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  toISO,
  addDays,
  startOfWeek,
  startOfMonth,
  calendarGrid,
} from '@/features/calendar/utils/dateUtils'
import type { ViewMode } from '@/features/calendar/types/calendar'

const useCalendarView = () => {
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const [searchParams, setSearchParams] = useSearchParams()
  const view: ViewMode = searchParams.get('view') === 'month' ? 'month' : 'week'
  const [anchor, setAnchor] = useState<Date>(() => startOfWeek(today))
  const [navDir, setNavDir] = useState(0)

  const { visibleStart, visibleEnd } = useMemo(() => {
    if (view === 'week') {
      return { visibleStart: anchor, visibleEnd: addDays(anchor, 6) }
    }
    const ms = startOfMonth(anchor)
    const grid = calendarGrid(ms)
    return { visibleStart: grid[0], visibleEnd: grid[grid.length - 1] }
  }, [view, anchor])

  const visibleStartISO = toISO(visibleStart)
  const visibleEndISO = toISO(visibleEnd)

  const isCurrentPeriod =
    view === 'week'
      ? toISO(anchor) === toISO(startOfWeek(today))
      : anchor.getMonth() === today.getMonth() && anchor.getFullYear() === today.getFullYear()

  const movePeriod = (dir: -1 | 1) => {
    setNavDir(dir)
    setAnchor((prev) => {
      if (view === 'week') return addDays(prev, dir * 7)
      const d = new Date(prev)
      d.setMonth(d.getMonth() + dir)
      return d
    })
  }

  const goToToday = () => {
    setAnchor(view === 'week' ? startOfWeek(today) : startOfMonth(today))
  }

  const switchView = (v: ViewMode) => {
    setNavDir(v === 'month' ? 2 : -2)
    setSearchParams(v === 'week' ? {} : { view: v }, { replace: true })
    setAnchor(v === 'week' ? startOfWeek(today) : startOfMonth(today))
  }

  return {
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
  }
}

export default useCalendarView
