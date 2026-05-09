import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { EASE_OUT } from '@/shared/constants/animations'
import { useQuery } from '@tanstack/react-query'
import { getRecipes } from '@/features/recipe/api/recipes'
import { recipeKeys } from '@/features/recipe/api/queryKeys'
import { createMealPlanEntry } from '@/features/calendar/api/mealPlan'
import { useAuth } from '@/features/auth/contexts/AuthContext'
import { extractLeafTexts } from '@/features/recipe/utils/ingredientUtils'
import { NL_DAYS_LONG, NL_MONTHS_SHORT } from '@/shared/constants/locale'
import Sheet from '@/shared/components/Sheet'
import SearchInput from '@/shared/components/SearchInput'
import AnimatedTabBar from '@/shared/components/AnimatedTabBar'
import MealRecipeRow from './MealRecipeRow'

type AddMealSheetProps = {
  visible: boolean
  date: string
  existingRecipeIds: string[]
  onClose: () => void
  onSaved: () => void
}

const AddMealSheet = ({
  visible,
  date,
  existingRecipeIds,
  onClose,
  onSaved,
}: AddMealSheetProps) => {
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

  useEffect(() => {
    if (tab === 'recipe') searchRef.current?.focus()
  }, [tab])

  const available = recipes.filter((r) => !existingRecipeIds.includes(r.id))
  const filtered = search.trim()
    ? available.filter((r) => {
        const q = search.toLowerCase()
        if (r.title.toLowerCase().includes(q)) return true
        if (r.description?.toLowerCase().includes(q)) return true
        return extractLeafTexts(r.ingredients).some((t) => t.toLowerCase().includes(q))
      })
    : available

  const dateObj = new Date(date + 'T00:00:00')

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

  return (
    <Sheet visible={visible} onClose={onClose} height="78%">
      <div className="pt-3 px-[22px]">
        <div className="lb-eyebrow">
          {NL_DAYS_LONG[dateObj.getDay()]}, {NL_MONTHS_SHORT[dateObj.getMonth()]}{' '}
          {dateObj.getDate()}
        </div>
        <h3 className="lb-display mt-1 mb-[14px] text-[24px]">
          Maaltijd <b>toevoegen</b>
        </h3>
      </div>
      <div className="px-[22px] pb-3">
        <AnimatedTabBar
          layoutId="meal-sheet-tabs"
          tabs={[
            { key: 'recipe', label: 'Uit kookboek' },
            { key: 'custom', label: 'Eigen tekst' },
          ]}
          active={tab}
          onChange={(v) => {
            setTabDir(v === 'custom' ? 1 : -1)
            setTab(v as 'recipe' | 'custom')
          }}
          variant="pill"
        />
      </div>
      <div className="flex-1 min-h-0 overflow-hidden relative">
        <AnimatePresence mode="wait" initial={false} custom={tabDir}>
          {tab === 'recipe' && (
            <motion.div
              key="recipe"
              custom={tabDir}
              initial={{ opacity: 0, y: tabDir * 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: tabDir * -16 }}
              transition={{ duration: 0.18, ease: EASE_OUT }}
              className="pt-[6px] px-[22px] h-full overflow-y-auto overflow-x-hidden"
            >
              <>
                <div className="mb-[10px]">
                  <SearchInput
                    value={search}
                    onChange={setSearch}
                    placeholder="Zoek recept of ingrediënt"
                    inputRef={searchRef}
                  />
                </div>
                <div className="lb-eyebrow flex items-center gap-1 overflow-hidden mt-[14px] mb-1">
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={filtered.length}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      className="block"
                    >
                      {filtered.length}
                    </motion.span>
                  </AnimatePresence>
                  {filtered.length === 1 ? 'RECEPT' : 'RECEPTEN'}
                </div>
                <AnimatePresence mode="wait">
                  {filtered.length === 0 && (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.18, ease: EASE_OUT }}
                      className="text-center text-stone font-serif italic p-5"
                    >
                      Geen recepten gevonden
                    </motion.div>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {filtered.map((r, i) => (
                    <MealRecipeRow
                      key={r.id}
                      recipe={r}
                      index={i}
                      selectedId={selectedId}
                      saving={saving}
                      onSelect={handleSelectRecipe}
                    />
                  ))}
                </AnimatePresence>
              </>
            </motion.div>
          )}
          {tab === 'custom' && (
            <motion.div
              key="custom"
              custom={tabDir}
              initial={{ opacity: 0, y: tabDir * -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: tabDir * 16 }}
              transition={{ duration: 0.18, ease: EASE_OUT }}
              className="pt-[6px] px-[22px] h-full overflow-y-auto"
            >
              <>
                <input
                  className="lb-input"
                  autoFocus
                  placeholder="bv. Afhalen, Restjes, Uit eten"
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                />
                <motion.button
                  onClick={handleSaveCustom}
                  disabled={!custom.trim() || saving}
                  whileTap={{ scale: 0.97 }}
                  className="lb-btn lb-btn--primary w-full mt-[14px]"
                >
                  {saving ? 'Opslaan…' : 'Aan planning toevoegen'}
                </motion.button>
              </>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Sheet>
  )
}

export default AddMealSheet
