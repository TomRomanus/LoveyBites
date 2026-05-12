import {
  format,
  parseISO,
  addDays as dfAddDays,
  startOfWeek as dfStartOfWeek,
  startOfMonth as dfStartOfMonth,
  endOfMonth as dfEndOfMonth,
  isSameDay as dfIsSameDay,
  eachDayOfInterval,
} from 'date-fns'
import { nl } from 'date-fns/locale'

export const toISO = (d: Date): string => format(d, 'yyyy-MM-dd')

export const addDays = (d: Date, n: number): Date => dfAddDays(d, n)

export const startOfWeek = (d: Date): Date => dfStartOfWeek(d, { weekStartsOn: 1 })

export const startOfMonth = (d: Date): Date => dfStartOfMonth(d)

const endOfMonth = (d: Date): Date => dfEndOfMonth(d)

export const isSameDay = (a: Date, b: Date): boolean => dfIsSameDay(a, b)

export const weekDays = (weekStart: Date): Date[] =>
  eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) })

export const calendarGrid = (monthStart: Date): Date[] => {
  const gridStart = startOfWeek(monthStart)
  const gridEnd = addDays(startOfWeek(endOfMonth(monthStart)), 6)
  return eachDayOfInterval({ start: gridStart, end: gridEnd })
}

export const formatDisplayDate = (d: Date): string => format(d, 'dd-MM-yyyy')

export const formatEntryDate = (iso: string): string => {
  const d = parseISO(iso)
  const day = format(d, 'EEE', { locale: nl }).toUpperCase()
  const rest = format(d, 'dd-MM')
  return `${day} ${rest}`
}
