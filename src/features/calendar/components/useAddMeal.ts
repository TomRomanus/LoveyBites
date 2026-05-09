import { useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getRecipes } from '@/features/recipe/api/recipes'
import { recipeKeys } from '@/features/recipe/api/queryKeys'
import { createMealPlanEntry } from '@/features/calendar/api/mealPlan'
import { useAuth } from '@/features/auth/contexts/AuthContext'
import { extractLeafTexts } from '@/features/recipe/utils/ingredientUtils'

type UseAddMealProps = {
  date: string
  existingRecipeIds: string[]
  onClose: () => void
  onSaved: () => void
}

const useAddMeal = ({ date, existingRecipeIds, onClose, onSaved }: UseAddMealProps) => {
  const { user } = useAuth()
  const [tab, setTab] = useState<'recipe' | 'custom'>('recipe')
  const [tabDir, setTabDir] = useState(0)
  const [search, setSearch] = useState('')
  const [custom, setCustom] = useState('')
  const [saving, setSaving] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const { data: recipes = [] } = useQuery({
    queryKey: recipeKeys.list(),
    queryFn: getRecipes,
  })

  const filtered = useMemo(() => {
    const available = recipes.filter((r) => !existingRecipeIds.includes(r.id))
    if (!search.trim()) return available
    const q = search.toLowerCase()
    return available.filter((r) => {
      if (r.title.toLowerCase().includes(q)) return true
      if (r.description?.toLowerCase().includes(q)) return true
      return extractLeafTexts(r.ingredients).some((t) => t.toLowerCase().includes(q))
    })
  }, [recipes, existingRecipeIds, search])

  const handleTabChange = (v: string) => {
    setTabDir(v === 'custom' ? 1 : -1)
    setTab(v as 'recipe' | 'custom')
  }

  const handleSelectRecipe = async (recipeId: string) => {
    if (!user) return
    setSelectedId(recipeId)
    setSaving(true)
    try {
      await createMealPlanEntry({ date, recipeId, createdBy: user.uid })
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  const handleSaveCustom = async () => {
    if (!user || !custom.trim()) return
    setSaving(true)
    try {
      await createMealPlanEntry({ date, customDescription: custom.trim(), createdBy: user.uid })
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return {
    tab,
    tabDir,
    search,
    setSearch,
    custom,
    setCustom,
    saving,
    selectedId,
    searchRef,
    filtered,
    handleTabChange,
    handleSelectRecipe,
    handleSaveCustom,
    onClose,
  }
}

export default useAddMeal
