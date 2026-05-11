import { motion, AnimatePresence } from 'framer-motion'
import IngredientCheckbox from '@/shared/components/IngredientCheckbox'

const ingredientTextVariants = {
  enter: (d: 'up' | 'down' | null) => ({ y: d === 'up' ? 8 : d === 'down' ? -8 : 0, opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit: (d: 'up' | 'down' | null) => ({ y: d === 'up' ? -8 : d === 'down' ? 8 : 0, opacity: 0 }),
}

type IngredientRowProps = {
  text: string
  isChecked: boolean
  itemKey: string
  selectedPortions: number
  portionDir: 'up' | 'down' | null
  onToggle: (path: string) => void
}

const IngredientRow = ({
  text,
  isChecked,
  itemKey,
  selectedPortions,
  portionDir,
  onToggle,
}: IngredientRowProps) => (
  <button
    key={itemKey}
    onClick={() => onToggle(itemKey)}
    className="flex items-center gap-3 py-[10px] w-full bg-transparent border-b-[0.5px] border-paper/[0.08] text-left cursor-pointer"
  >
    <IngredientCheckbox checked={isChecked} theme="dark" />
    <span
      className={`text-[15px] flex-1 overflow-hidden relative transition-colors duration-200 ease-[ease] ${isChecked ? 'text-paper/40' : 'text-paper'}`}
    >
      <AnimatePresence mode="popLayout" custom={portionDir}>
        <motion.span
          key={selectedPortions}
          custom={portionDir}
          variants={ingredientTextVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          className="block relative w-fit"
        >
          {text}
          <motion.span
            aria-hidden
            initial={false}
            animate={{ scaleX: isChecked ? 1 : 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: '50%',
              height: 1.5,
              background: 'currentColor',
              transformOrigin: 'left',
              pointerEvents: 'none',
            }}
          />
        </motion.span>
      </AnimatePresence>
    </span>
  </button>
)

export default IngredientRow
