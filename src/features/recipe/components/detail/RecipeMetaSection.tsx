import { motion, AnimatePresence } from 'framer-motion'
import Stars from '@/features/recipe/components/Stars'

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
  <div style={{ padding: '20px 22px 0' }}>
    {tags.length > 0 && (
      <div
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 9.5,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          marginBottom: 12,
          color: 'var(--stone)',
        }}
      >
        {tags.map((t, i) => (
          <span key={t}>
            {i > 0 && <span> · </span>}
            <span>{t}</span>
          </span>
        ))}
      </div>
    )}
    {description && (
      <p style={{ margin: '0 0 14px', color: 'var(--ink-2)', fontSize: 15, lineHeight: 1.55 }}>
        {description}
      </p>
    )}
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Stars value={rating ?? 0} onChange={onRating} />
      <AnimatePresence>
        {showRatingSaved && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7, x: -4 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.7, x: -4 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            style={{ color: 'var(--bordeaux)' }}
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
                transition={{ duration: 0.28, ease: [0.2, 0, 0, 1] }}
              />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </div>
)

export default RecipeMetaSection
