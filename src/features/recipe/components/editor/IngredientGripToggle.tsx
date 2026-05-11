import { motion } from 'framer-motion'
import { GripHandle } from '@/features/recipe/components/editor/GripHandle'

type IngredientGripToggleProps = {
  ordered: boolean
  reordering: boolean
}

const IngredientGripToggle = ({ ordered, reordering }: IngredientGripToggleProps) => {
  if (ordered) {
    // Steps: grip slides in alongside the number — animate width so layout shifts smoothly
    return (
      <motion.div
        animate={{ width: reordering ? 24 : 0, opacity: reordering ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 340, damping: 30 }}
        className="overflow-hidden shrink-0 flex items-start"
      >
        <GripHandle className="pt-[7px]" />
      </motion.div>
    )
  }

  // Ingredients: dot ↔ grip crossfade in a fixed-size slot — no layout shift at all
  // overflow-hidden + width animation (not opacity) ensures the hidden grip has zero
  // pointer-event area, preventing scroll conflicts on mobile
  return (
    <div className="relative shrink-0 pt-[13px]">
      <motion.div
        animate={{ width: reordering ? 20 : 0, opacity: reordering ? 1 : 0 }}
        transition={{ duration: 0.18, ease: 'easeInOut' }}
        className="absolute top-[14px] left-0 bottom-0 overflow-hidden flex"
      >
        <GripHandle />
      </motion.div>
      <motion.span
        animate={{ opacity: reordering ? 0 : 1 }}
        transition={{ duration: 0.18, ease: 'easeInOut' }}
        className="text-bordeaux text-[11px] flex items-center justify-center leading-none pointer-events-none"
      >
        •
      </motion.span>
    </div>
  )
}

export default IngredientGripToggle
