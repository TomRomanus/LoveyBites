import { motion, AnimatePresence } from 'framer-motion'
import RecipeCard from '@/features/recipe/components/RecipeCard'
import type { Recipe } from '@/features/recipe/types/recipe'

type RecipeListContentProps = {
  recipes: Recipe[]
  activeTags: string[]
  onAddToCalendar: (recipe: Recipe) => void
}

const RecipeListContent = ({ recipes, activeTags, onAddToCalendar }: RecipeListContentProps) => (
  <div className="px-5 pt-[10px] pb-[120px]">
    <AnimatePresence initial={false}>
      {recipes.map((r) => (
        <motion.div
          key={r.id}
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 0.18,
            layout: { type: 'spring', stiffness: 350, damping: 35 },
          }}
        >
          <RecipeCard
            recipe={r}
            onAddToCalendar={onAddToCalendar}
            highlightTags={activeTags.length > 0 ? activeTags : undefined}
          />
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
)

export default RecipeListContent
