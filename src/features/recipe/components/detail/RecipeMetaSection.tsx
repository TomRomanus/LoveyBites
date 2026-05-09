import { motion, AnimatePresence } from 'framer-motion'
import { EASE_OUT } from '@/shared/constants/animations'
import StarRatingInput from '@/features/recipe/components/StarRatingInput'

type RecipeMetaSectionProps = {
  tags: string[]
  description?: string
  rating?: number
  showRatingSaved: boolean
  onRating: (rating: number) => void
}

const RecipeMetaSection = ({
  tags,
  description,
  rating,
  showRatingSaved,
  onRating,
}: RecipeMetaSectionProps) => (
  <div className="px-[22px] pt-5">
    {tags.length > 0 && (
      <div className="font-mono text-[9.5px] uppercase tracking-[0.14em] mb-3 text-stone">
        {tags.map((t, i) => (
          <span key={t}>
            {i > 0 && <span> · </span>}
            <span>{t}</span>
          </span>
        ))}
      </div>
    )}
    {description && (
      <p className="m-0 mb-[14px] text-ink-2 text-[15px] leading-[1.55]">{description}</p>
    )}
    <div className="flex items-center gap-[10px]">
      <StarRatingInput value={rating ?? 0} onChange={onRating} />
      <AnimatePresence>
        {showRatingSaved && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7, x: -4 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.7, x: -4 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="text-bordeaux"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <motion.path
                d="M5 13l4 4L19 7"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.28, ease: EASE_OUT }}
              />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </div>
)

export default RecipeMetaSection
