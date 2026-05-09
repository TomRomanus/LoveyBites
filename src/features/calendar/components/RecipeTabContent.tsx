import { useEffect, type RefObject } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { EASE_OUT } from '@/shared/constants/animations'
import type { Recipe } from '@/features/recipe/types/recipe'
import SearchInput from '@/shared/components/SearchInput'
import MealRecipeRow from './MealRecipeRow'

type RecipeTabContentProps = {
  recipes: Recipe[]
  search: string
  onSearchChange: (v: string) => void
  onSelect: (id: string) => void
  selectedId: string | null
  saving: boolean
  searchRef: RefObject<HTMLInputElement>
}

const RecipeTabContent = ({
  recipes,
  search,
  onSearchChange,
  onSelect,
  selectedId,
  saving,
  searchRef,
}: RecipeTabContentProps) => {
  useEffect(() => {
    searchRef.current?.focus()
  }, [searchRef])

  return (
    <>
      <div className="mb-[10px]">
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder="Zoek recept of ingrediënt"
          inputRef={searchRef}
        />
      </div>
      <div className="lb-eyebrow flex items-center gap-1 overflow-hidden mt-[14px] mb-1">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={recipes.length}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="block"
          >
            {recipes.length}
          </motion.span>
        </AnimatePresence>
        {recipes.length === 1 ? 'RECEPT' : 'RECEPTEN'}
      </div>
      <AnimatePresence mode="wait">
        {recipes.length === 0 && (
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
        {recipes.map((r, i) => (
          <MealRecipeRow
            key={r.id}
            recipe={r}
            index={i}
            selectedId={selectedId}
            saving={saving}
            onSelect={onSelect}
          />
        ))}
      </AnimatePresence>
    </>
  )
}

export default RecipeTabContent
