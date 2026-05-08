export const toISO = (d: Date): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const addDays = (d: Date, n: number): Date => {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export const startOfWeek = (d: Date): Date => {
  const r = new Date(d)
  r.setHours(0, 0, 0, 0)
  const day = r.getDay()
  r.setDate(r.getDate() + (day === 0 ? -6 : 1 - day))
  return r
}

export const startOfMonth = (d: Date): Date =>
  new Date(d.getFullYear(), d.getMonth(), 1)

export const endOfMonth = (d: Date): Date =>
  new Date(d.getFullYear(), d.getMonth() + 1, 0)

export const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

export const weekDays = (weekStart: Date): Date[] =>
  Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

export const calendarGrid = (monthStart: Date): Date[] => {
  const gridStart = startOfWeek(monthStart)
  const end = endOfMonth(monthStart)
  const gridEnd = addDays(startOfWeek(end), 6)
  const days: Date[] = []
  let cur = gridStart
  while (cur <= gridEnd) {
    days.push(new Date(cur))
    cur = addDays(cur, 1)
  }
  return days
}
