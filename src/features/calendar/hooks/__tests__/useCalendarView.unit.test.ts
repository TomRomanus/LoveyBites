import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { createElement } from 'react'
import useCalendarView from '@/features/calendar/hooks/useCalendarView'
import {
  toISO,
  startOfWeek,
  startOfMonth,
  addDays,
  calendarGrid,
} from '@/features/calendar/utils/dateUtils'

// Pin to a Monday so startOfWeek(today) === today and dates are deterministic
const MONDAY = new Date('2026-05-11T00:00:00.000Z')

const wrapper = ({ children }: { children: React.ReactNode }) =>
  createElement(MemoryRouter, { future: { v7_startTransition: true, v7_relativeSplatPath: true } }, children)

const renderCalendarView = () => renderHook(() => useCalendarView(), { wrapper })

describe('useCalendarView', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(MONDAY)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('starts with view="week"', () => {
      const { result } = renderCalendarView()
      expect(result.current.view).toBe('week')
    })

    it('starts with anchor = startOfWeek(today)', () => {
      const { result } = renderCalendarView()
      const expected = toISO(startOfWeek(MONDAY))
      expect(toISO(result.current.anchor)).toBe(expected)
    })

    it('starts with navDir = 0', () => {
      const { result } = renderCalendarView()
      expect(result.current.navDir).toBe(0)
    })

    it('exposes today as the current date with time zeroed', () => {
      const { result } = renderCalendarView()
      const t = result.current.today
      expect(t.getHours()).toBe(0)
      expect(t.getMinutes()).toBe(0)
      expect(t.getSeconds()).toBe(0)
      expect(toISO(t)).toBe('2026-05-11')
    })
  })

  describe('visibleStartISO / visibleEndISO in week view', () => {
    it('visibleStartISO equals anchor ISO in week view', () => {
      const { result } = renderCalendarView()
      const expected = toISO(startOfWeek(MONDAY))
      expect(result.current.visibleStartISO).toBe(expected)
    })

    it('visibleEndISO equals anchor + 6 days in week view', () => {
      const { result } = renderCalendarView()
      const expected = toISO(addDays(startOfWeek(MONDAY), 6))
      expect(result.current.visibleEndISO).toBe(expected)
    })
  })

  describe('visibleStartISO / visibleEndISO in month view', () => {
    it('visibleStartISO equals grid[0] in month view', () => {
      const { result } = renderCalendarView()
      act(() => result.current.switchView('month'))
      const ms = startOfMonth(MONDAY)
      const grid = calendarGrid(ms)
      expect(result.current.visibleStartISO).toBe(toISO(grid[0]))
    })

    it('visibleEndISO equals grid[last] in month view', () => {
      const { result } = renderCalendarView()
      act(() => result.current.switchView('month'))
      const ms = startOfMonth(MONDAY)
      const grid = calendarGrid(ms)
      expect(result.current.visibleEndISO).toBe(toISO(grid[grid.length - 1]))
    })
  })

  describe('isCurrentPeriod', () => {
    it('is true when showing current week', () => {
      const { result } = renderCalendarView()
      expect(result.current.isCurrentPeriod).toBe(true)
    })

    it('is false after movePeriod(1) in week view', () => {
      const { result } = renderCalendarView()
      act(() => result.current.movePeriod(1))
      expect(result.current.isCurrentPeriod).toBe(false)
    })

    it('is false after movePeriod(-1) in week view', () => {
      const { result } = renderCalendarView()
      act(() => result.current.movePeriod(-1))
      expect(result.current.isCurrentPeriod).toBe(false)
    })

    it('is true when showing current month', () => {
      const { result } = renderCalendarView()
      act(() => result.current.switchView('month'))
      expect(result.current.isCurrentPeriod).toBe(true)
    })

    it('is false after movePeriod(1) in month view', () => {
      const { result } = renderCalendarView()
      act(() => result.current.switchView('month'))
      act(() => result.current.movePeriod(1))
      expect(result.current.isCurrentPeriod).toBe(false)
    })
  })

  describe('movePeriod', () => {
    it('advances anchor by 7 days in week view', () => {
      const { result } = renderCalendarView()
      const initialAnchor = result.current.anchor
      act(() => result.current.movePeriod(1))
      const diff = result.current.anchor.getTime() - initialAnchor.getTime()
      expect(diff).toBe(7 * 24 * 60 * 60 * 1000)
    })

    it('moves anchor back 7 days with movePeriod(-1) in week view', () => {
      const { result } = renderCalendarView()
      const initialAnchor = result.current.anchor
      act(() => result.current.movePeriod(-1))
      const diff = initialAnchor.getTime() - result.current.anchor.getTime()
      expect(diff).toBe(7 * 24 * 60 * 60 * 1000)
    })

    it('advances anchor by 1 month in month view', () => {
      const { result } = renderCalendarView()
      act(() => result.current.switchView('month'))
      const initialMonth = result.current.anchor.getMonth()
      act(() => result.current.movePeriod(1))
      const newMonth = result.current.anchor.getMonth()
      expect(newMonth).toBe((initialMonth + 1) % 12)
    })

    it('goes back 1 month with movePeriod(-1) in month view', () => {
      const { result } = renderCalendarView()
      act(() => result.current.switchView('month'))
      const initialMonth = result.current.anchor.getMonth()
      act(() => result.current.movePeriod(-1))
      const newMonth = result.current.anchor.getMonth()
      // May (4) - 1 = April (3)
      expect(newMonth).toBe((initialMonth - 1 + 12) % 12)
    })

    it('sets navDir to 1 when moving forward', () => {
      const { result } = renderCalendarView()
      act(() => result.current.movePeriod(1))
      expect(result.current.navDir).toBe(1)
    })

    it('sets navDir to -1 when moving backward', () => {
      const { result } = renderCalendarView()
      act(() => result.current.movePeriod(-1))
      expect(result.current.navDir).toBe(-1)
    })
  })

  describe('goToToday', () => {
    it('resets anchor to startOfWeek(today) in week view after navigating away', () => {
      const { result } = renderCalendarView()
      act(() => result.current.movePeriod(1))
      act(() => result.current.goToToday())
      expect(toISO(result.current.anchor)).toBe(toISO(startOfWeek(MONDAY)))
    })

    it('resets anchor to startOfMonth(today) in month view after navigating away', () => {
      const { result } = renderCalendarView()
      act(() => result.current.switchView('month'))
      act(() => result.current.movePeriod(1))
      act(() => result.current.goToToday())
      expect(toISO(result.current.anchor)).toBe(toISO(startOfMonth(MONDAY)))
    })
  })

  describe('switchView', () => {
    it('sets view to "month"', () => {
      const { result } = renderCalendarView()
      act(() => result.current.switchView('month'))
      expect(result.current.view).toBe('month')
    })

    it('sets navDir to 2 when switching to month', () => {
      const { result } = renderCalendarView()
      act(() => result.current.switchView('month'))
      expect(result.current.navDir).toBe(2)
    })

    it('sets anchor to startOfMonth(today) when switching to month', () => {
      const { result } = renderCalendarView()
      act(() => result.current.switchView('month'))
      expect(toISO(result.current.anchor)).toBe(toISO(startOfMonth(MONDAY)))
    })

    it('sets view to "week" when switching back', () => {
      const { result } = renderCalendarView()
      act(() => result.current.switchView('month'))
      act(() => result.current.switchView('week'))
      expect(result.current.view).toBe('week')
    })

    it('sets navDir to -2 when switching to week', () => {
      const { result } = renderCalendarView()
      act(() => result.current.switchView('month'))
      act(() => result.current.switchView('week'))
      expect(result.current.navDir).toBe(-2)
    })

    it('sets anchor to startOfWeek(today) when switching to week', () => {
      const { result } = renderCalendarView()
      act(() => result.current.switchView('month'))
      act(() => result.current.switchView('week'))
      expect(toISO(result.current.anchor)).toBe(toISO(startOfWeek(MONDAY)))
    })
  })
})
