import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Calendar } from 'lucide-react'
import type { Recipe } from '@/features/recipe/types/recipe'
import { StarRating } from '@/features/recipe/components/StarRating'

type Props = {
  recipe: Recipe
  variant?: 'feature' | 'default'
  onAddToCalendar?: (recipe: Recipe) => void
  highlightTags?: string[]
}

const RecipeCard = ({ recipe, variant = 'default', onAddToCalendar, highlightTags }: Props) => {
  const shortId = recipe.id.slice(-2).toUpperCase()

  if (variant === 'feature') {
    return (
      <motion.div
        className="lb-card overflow-hidden"
        whileTap={{ scale: 0.985 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <Link to={`/recipe/${recipe.id}`} className="no-underline text-inherit block">
          {/* Color block hero */}
          <div
            className="lb-color-block h-[170px] rounded-none"
            style={{ '--block-bg': 'var(--bordeaux)' } as React.CSSProperties}
          >
            <div className="flex justify-between items-start z-[1] relative">
              <div className="lb-color-block-corner">№ {shortId}</div>
              <div className="lb-color-block-corner">·</div>
            </div>
            <div className="lb-color-block-title text-[26px] z-[1] relative">{recipe.title}</div>
          </div>
          <div className="px-[18px] pt-4 pb-[18px]">
            <div className="lb-eyebrow mb-1.5">UITGELICHT</div>
            <h3 className="lb-display m-0 text-[22px]">{recipe.title}</h3>
            {recipe.description && (
              <p className="mt-[6px] mb-3 text-[13px] text-ink-2 leading-[1.45] line-clamp-2">
                {recipe.description}
              </p>
            )}
            <div className="flex items-center justify-between">
              <StarRating value={recipe.rating ?? 0} />
              <div className="flex gap-1.5 flex-wrap justify-end">
                {recipe.tags.slice(0, 3).map((t) => (
                  <span key={t} className="lb-tag">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Link>
        {onAddToCalendar && (
          <button
            onClick={() => onAddToCalendar(recipe)}
            className="absolute top-2 right-2 w-8 h-8 rounded-[16px] bg-[rgba(255,250,240,0.2)] border-0 flex items-center justify-center text-cream"
            aria-label="Toevoegen aan kalender"
          >
            <CalendarIcon />
          </button>
        )}
      </motion.div>
    )
  }

  return (
    <motion.div
      data-testid="recipe-list-item"
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="py-[10px] border-b-[0.5px] border-ink/14 relative"
    >
      <Link to={`/recipe/${recipe.id}`} className="no-underline text-inherit block">
        <h3 className="m-0 font-serif italic text-[18px] font-medium leading-[1.15] tracking-[-0.015em] text-ink">
          {recipe.title}
        </h3>
        <div
          className="w-6 rounded-[1px] opacity-60 my-1"
          style={{ height: 1.5, background: 'var(--bordeaux)' }}
        />
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
    </motion.div>
  )
}

export default RecipeCard

const CalendarIcon = () => <Calendar size={14} />
