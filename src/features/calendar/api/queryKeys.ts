export const calendarKeys = {
  all: ['calendar'] as const,
  todayRecipe: (date: string) => [...calendarKeys.all, 'todayRecipe', date] as const,
  entries: (from: string, to: string) => [...calendarKeys.all, 'entries', from, to] as const,
}
