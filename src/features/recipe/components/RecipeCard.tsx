import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Calendar } from 'lucide-react'
import type { Recipe } from '@/features/recipe/types/recipe'
import { StarRating } from '@/features/recipe/components/StarRating'
import BordeauxBar from '@/shared/components/BordeauxBar'

type Props = {
  recipe: Recipe
  onAddToCalendar?: (recipe: Recipe) => void
  highlightTags?: string[]
}

const RecipeCard = ({ recipe, onAddToCalendar, highlightTags }: Props) => (
  <motion.div
    data-testid="recipe-list-item"
    whileTap={{ scale: 0.98 }}
    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    className="border-b-[0.5px] border-ink/14 relative"
  >
    <Link to={`/recipe/${recipe.id}`} className="no-underline text-inherit block py-[10px] pr-9">
      <h3 className="m-0 font-serif italic text-[18px] font-medium leading-[1.15] tracking-[-0.015em] text-ink">
        {recipe.title}
      </h3>
      <BordeauxBar className="w-6 opacity-60 my-1" />
      {recipe.description && (
        <p className="m-0 text-[12px] text-stone leading-[1.4] line-clamp-2">
          {recipe.description}
        </p>
      )}
      {recipe.tags.length > 0 && (
        <div className="font-mono text-[9px] uppercase tracking-[0.08em] mt-1">
          {recipe.tags.map((t, i) => (
            <span key={t}>
              {i > 0 && <span className="text-bordeaux/40"> · </span>}
              <span className={highlightTags?.includes(t) ? 'text-bordeaux' : 'text-bordeaux/40'}>
                {t}
              </span>
            </span>
          ))}
        </div>
      )}
      <StarRating value={recipe.rating ?? 0} />
    </Link>
    {onAddToCalendar && (
      <button
        type="button"
        onClick={() => onAddToCalendar(recipe)}
        className="absolute top-1.5 right-0 p-1.5 bg-transparent border-0 text-bordeaux/45 cursor-pointer"
        aria-label="Toevoegen aan kalender"
      >
        <Calendar size={16} strokeWidth={1.5} />
      </button>
    )}
  </motion.div>
)

export default RecipeCard
