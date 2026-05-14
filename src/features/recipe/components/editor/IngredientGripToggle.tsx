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
        className="overflow-hidden shrink-0 flex items-start mt-[-3px]"
      >
        <GripHandle />
      </motion.div>
    )
  }

  // Ingredients: dot ↔ grip crossfade. Container width animates so the grip gets extra
  // breathing room while the bullet stays tight against the text. pointer-events toggling
  // (not width-to-0) prevents scroll conflicts on mobile.
  return (
    <motion.div
      animate={{ width: reordering ? 32 : 16 }}
      transition={{ duration: 0.18, ease: 'easeInOut' }}
      className="relative shrink-0"
    >
      <div className="pt-[13px]">
        <motion.span
          animate={{ opacity: reordering ? 0 : 1 }}
          transition={{ duration: 0.18, ease: 'easeInOut' }}
          className="text-bordeaux text-[11px] flex items-center justify-end leading-none pointer-events-none"
        >
          •
        </motion.span>
      </div>
      <motion.div
        animate={{ opacity: reordering ? 1 : 0 }}
        transition={{ duration: 0.18, ease: 'easeInOut' }}
        style={{ pointerEvents: reordering ? 'auto' : 'none' }}
        className="absolute top-[9px] inset-x-0 flex items-center justify-center"
      >
        <GripHandle />
      </motion.div>
    </motion.div>
  )
}

export default IngredientGripToggle
