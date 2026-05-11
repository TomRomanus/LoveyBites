import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  toISO,
  addDays,
  startOfWeek,
  startOfMonth,
  isSameDay,
  weekDays,
  calendarGrid,
  formatEntryDate,
} from '@/features/calendar/utils/dateUtils'

// Pin to a Monday so dates are deterministic
const MONDAY = new Date('2026-05-11T00:00:00.000Z')

describe('dateUtils', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(MONDAY)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('toISO', () => {
    it('formats a date as yyyy-MM-dd', () => {
      expect(toISO(new Date('2026-05-11T00:00:00.000Z'))).toBe('2026-05-11')
    })

    it('formats a date at the end of a month', () => {
      expect(toISO(new Date('2026-05-31T00:00:00.000Z'))).toBe('2026-05-31')
    })

    it('formats a date at the start of a year', () => {
      expect(toISO(new Date('2026-01-01T00:00:00.000Z'))).toBe('2026-01-01')
    })
  })

  describe('addDays', () => {
    it('adds positive days', () => {
      const result = addDays(new Date('2026-05-11T00:00:00.000Z'), 3)
      expect(toISO(result)).toBe('2026-05-14')
    })

    it('adds negative days (goes back)', () => {
      const result = addDays(new Date('2026-05-11T00:00:00.000Z'), -3)
      expect(toISO(result)).toBe('2026-05-08')
    })

    it('adds zero days (no change)', () => {
      const d = new Date('2026-05-11T00:00:00.000Z')
      const result = addDays(d, 0)
      expect(toISO(result)).toBe('2026-05-11')
    })

    it('crosses month boundaries', () => {
      const result = addDays(new Date('2026-05-30T00:00:00.000Z'), 3)
      expect(toISO(result)).toBe('2026-06-02')
    })
  })

  describe('startOfWeek', () => {
    it('returns the same day when given a Monday', () => {
      const result = startOfWeek(new Date('2026-05-11T00:00:00.000Z'))
      expect(toISO(result)).toBe('2026-05-11')
    })

    it('returns Monday when given a Wednesday', () => {
      const result = startOfWeek(new Date('2026-05-13T00:00:00.000Z'))
      expect(toISO(result)).toBe('2026-05-11')
    })

    it('returns Monday when given a Sunday (end of week in ISO)', () => {
      const result = startOfWeek(new Date('2026-05-17T00:00:00.000Z'))
      expect(toISO(result)).toBe('2026-05-11')
    })

    it('returns previous Monday when given a Saturday', () => {
      const result = startOfWeek(new Date('2026-05-16T00:00:00.000Z'))
      expect(toISO(result)).toBe('2026-05-11')
    })

    it('week starts on Monday (not Sunday)', () => {
      // May 10, 2026 is a Sunday — should map to Mon May 4
      const result = startOfWeek(new Date('2026-05-10T00:00:00.000Z'))
      expect(toISO(result)).toBe('2026-05-04')
    })
  })

  describe('startOfMonth', () => {
    it('returns the first day of the month', () => {
      const result = startOfMonth(new Date('2026-05-15T00:00:00.000Z'))
      expect(toISO(result)).toBe('2026-05-01')
    })

    it('returns itself when given the first of the month', () => {
      const result = startOfMonth(new Date('2026-05-01T00:00:00.000Z'))
      expect(toISO(result)).toBe('2026-05-01')
    })

    it('returns the correct first for February', () => {
      const result = startOfMonth(new Date('2026-02-14T00:00:00.000Z'))
      expect(toISO(result)).toBe('2026-02-01')
    })
  })

  describe('isSameDay', () => {
    it('returns true for the same date', () => {
      expect(
        isSameDay(new Date('2026-05-11T00:00:00.000Z'), new Date('2026-05-11T12:30:00.000Z')),
      ).toBe(true)
    })

    it('returns false for different dates', () => {
      expect(
        isSameDay(new Date('2026-05-11T00:00:00.000Z'), new Date('2026-05-12T00:00:00.000Z')),
      ).toBe(false)
    })

    it('returns false for same day different month', () => {
      expect(
        isSameDay(new Date('2026-05-11T00:00:00.000Z'), new Date('2026-04-11T00:00:00.000Z')),
      ).toBe(false)
    })
  })

  describe('weekDays', () => {
    it('returns exactly 7 days', () => {
      expect(weekDays(MONDAY)).toHaveLength(7)
    })

    it('starts from the given anchor date', () => {
      const days = weekDays(MONDAY)
      expect(toISO(days[0])).toBe('2026-05-11')
    })

    it('ends 6 days after the anchor', () => {
      const days = weekDays(MONDAY)
      expect(toISO(days[6])).toBe('2026-05-17')
    })

    it('returns consecutive days', () => {
      const days = weekDays(MONDAY)
      for (let i = 1; i < days.length; i++) {
        const diff = days[i].getTime() - days[i - 1].getTime()
        expect(diff).toBe(24 * 60 * 60 * 1000)
      }
    })
  })

  describe('calendarGrid', () => {
    it('length is a multiple of 7', () => {
      const monthStart = startOfMonth(new Date('2026-05-01T00:00:00.000Z'))
      const grid = calendarGrid(monthStart)
      expect(grid.length % 7).toBe(0)
    })

    it('first day is a Monday', () => {
      const monthStart = startOfMonth(new Date('2026-05-01T00:00:00.000Z'))
      const grid = calendarGrid(monthStart)
      // Monday = 1 in getDay()
      expect(grid[0].getDay()).toBe(1)
    })

    it('includes days from the anchor month', () => {
      const monthStart = startOfMonth(new Date('2026-05-01T00:00:00.000Z'))
      const grid = calendarGrid(monthStart)
      const isos = grid.map(toISO)
      expect(isos).toContain('2026-05-01')
      expect(isos).toContain('2026-05-31')
    })

    it('may include overflow days from adjacent months', () => {
      // May 2026 starts on Friday — grid starts on Monday Apr 27
      const monthStart = startOfMonth(new Date('2026-05-01T00:00:00.000Z'))
      const grid = calendarGrid(monthStart)
      const isos = grid.map(toISO)
      // First Monday at or before May 1 is April 27
      expect(isos[0]).toBe('2026-04-27')
    })

    it('last day of the grid is a Sunday', () => {
      const monthStart = startOfMonth(new Date('2026-05-01T00:00:00.000Z'))
      const grid = calendarGrid(monthStart)
      const last = grid[grid.length - 1]
      // Sunday = 0 in getDay()
      expect(last.getDay()).toBe(0)
    })

    it('covers the full anchor month for a different month', () => {
      // Test with February 2026
      const monthStart = startOfMonth(new Date('2026-02-01T00:00:00.000Z'))
      const grid = calendarGrid(monthStart)
      const isos = grid.map(toISO)
      expect(isos).toContain('2026-02-01')
      expect(isos).toContain('2026-02-28')
      expect(grid.length % 7).toBe(0)
    })
  })

  describe('formatEntryDate', () => {
    it('formats a Monday in Dutch abbreviated format', () => {
      // 2026-05-11 is a Monday (MAA in Dutch)
      const result = formatEntryDate('2026-05-11')
      expect(result).toBe('MAA 11-05')
    })

    it('formats a Friday correctly', () => {
      // 2026-05-15 is a Friday (VRI in Dutch)
      const result = formatEntryDate('2026-05-15')
      expect(result).toBe('VRI 15-05')
    })

    it('formats a Wednesday correctly', () => {
      // 2026-05-13 is a Wednesday (WOE in Dutch)
      const result = formatEntryDate('2026-05-13')
      expect(result).toBe('WOE 13-05')
    })

    it('has format "XXX dd-MM" (3-letter Dutch abbreviation)', () => {
      const result = formatEntryDate('2026-05-11')
      expect(result).toMatch(/^[A-Z]{3} \d{2}-\d{2}$/)
    })
  })
})
