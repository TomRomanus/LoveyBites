import { useEffect, useMemo, useState } from 'react'
import {
  getMealPlanEntries,
  createMealPlanEntry,
  deleteMealPlanEntry,
} from '@/features/calendar/api/mealPlan'
import { getRecipes } from '@/features/recipe/api/recipes'
import type { MealPlanEntry } from '@/features/calendar/types/calendar'
import type { Recipe } from '@/features/recipe/types/recipe'
import { useAuth } from '@/features/auth/contexts/AuthContext'
import { toISO, addDays, startOfWeek } from '@/features/calendar/utils/dateUtils'
import { NL_MONTHS } from '@/shared/constants/locale'

type UseAddToCalendarProps = {
  recipe: Pick<Recipe, 'id' | 'title'>
}

type UseAddToCalendarReturn = {
  today: Date
  weekStart: Date
  weekDir: 'next' | 'prev'
  weekLabel: string
  days: Date[]
  entries: MealPlanEntry[]
  recipeMap: Map<string, { title: string }>
  saving: string | null
  recentlySaved: Set<string>
  goToPrevWeek: () => void
  goToNextWeek: () => void
  handleDayClick: (day: Date) => Promise<void>
  entriesForDay: (day: Date) => MealPlanEntry[]
}

export function useAddToCalendar({ recipe }: UseAddToCalendarProps): UseAddToCalendarReturn {
  const { user } = useAuth()

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(today))
  const [weekDir, setWeekDir] = useState<'next' | 'prev'>('next')
  const [entries, setEntries] = useState<MealPlanEntry[]>([])
  const [recipeMap, setRecipeMap] = useState<Map<string, { title: string }>>(new Map())
  const [saving, setSaving] = useState<string | null>(null)
  const [recentlySaved, setRecentlySaved] = useState<Set<string>>(new Set())

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const weekEnd = addDays(weekStart, 6)
  const weekStartISO = toISO(weekStart)
  const weekEndISO = toISO(weekEnd)

  const weekLabel = useMemo(() => {
    const end = addDays(weekStart, 6)
    if (weekStart.getMonth() === end.getMonth()) {
      return `${weekStart.getDate()}–${end.getDate()} ${NL_MONTHS[weekStart.getMonth()]} ${weekStart.getFullYear()}`
    }
    return `${weekStart.getDate()} ${NL_MONTHS[weekStart.getMonth()]} – ${end.getDate()} ${NL_MONTHS[end.getMonth()]}`
  }, [weekStart])

  useEffect(() => {
    getMealPlanEntries(weekStartISO, weekEndISO).then(setEntries)
  }, [weekStartISO, weekEndISO])

  useEffect(() => {
    getRecipes().then((recipes) => {
      setRecipeMap(new Map(recipes.map((r) => [r.id, { title: r.title }])))
    })
  }, [])

  const goToPrevWeek = () => {
    setWeekDir('prev')
    setWeekStart((prev) => addDays(prev, -7))
  }

  const goToNextWeek = () => {
    setWeekDir('next')
    setWeekStart((prev) => addDays(prev, 7))
  }

  const handleDayClick = async (day: Date) => {
    if (!user) return
    const iso = toISO(day)
    const existing = entries.find((e) => e.date === iso && e.recipeId === recipe.id)
    setSaving(iso)
    try {
      if (existing) {
        await deleteMealPlanEntry(existing.id)
        setEntries((prev) => prev.filter((e) => e.id !== existing.id))
      } else {
        const entryId = await createMealPlanEntry({
          date: iso,
          recipeId: recipe.id,
          recipeTitle: recipe.title,
          createdBy: user.uid,
        })
        setEntries((prev) => [
          ...prev,
          {
            id: entryId,
            date: iso,
            recipeId: recipe.id,
            recipeTitle: recipe.title,
            createdBy: user.uid,
            createdAt: null,
          },
        ])
        setRecentlySaved((prev) => new Set([...prev, iso]))
        setTimeout(
          () =>
            setRecentlySaved((prev) => {
              const n = new Set(prev)
              n.delete(iso)
              return n
            }),
          950,
        )
      }
    } finally {
      setSaving(null)
    }
  }

  const entriesForDay = (day: Date): MealPlanEntry[] => {
    return entries.filter((e) => e.date === toISO(day))
  }

  return {
    today,
    weekStart,
    weekDir,
    weekLabel,
    days,
    entries,
    recipeMap,
    saving,
    recentlySaved,
    goToPrevWeek,
    goToNextWeek,
    handleDayClick,
    entriesForDay,
  }
}
