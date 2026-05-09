import { motion, AnimatePresence } from 'framer-motion'
import IngredientCheckbox from '@/shared/components/IngredientCheckbox'

const textVariants = {
  enter: (d: 'up' | 'down' | null) => ({ y: d === 'up' ? 8 : d === 'down' ? -8 : 0, opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit: (d: 'up' | 'down' | null) => ({ y: d === 'up' ? -8 : d === 'down' ? 8 : 0, opacity: 0 }),
}

type IngredientItemProps = {
  item: string
  itemKey: string
  portions: number
  portionDir: 'up' | 'down' | null
  checked: boolean
  onToggle: (key: string) => void
}

const IngredientItem = ({
  item,
  itemKey,
  portions,
  portionDir,
  checked,
  onToggle,
}: IngredientItemProps) => (
  <button
    onClick={() => onToggle(itemKey)}
    className="flex items-center gap-3 py-[10px] bg-transparent border-0 border-b-[0.5px] border-ink/14 text-left cursor-pointer"
  >
    <IngredientCheckbox checked={checked} />
    <span
      className={`flex-1 text-[15px] overflow-hidden relative transition-[color,opacity] duration-200 ease-[ease] ${checked ? 'text-stone opacity-50' : 'text-ink opacity-100'}`}
    >
      <AnimatePresence mode="popLayout" custom={portionDir}>
        <motion.span
          key={portions}
          custom={portionDir}
          variants={textVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          className="block relative w-fit"
        >
          {item}
          <motion.span
            aria-hidden
            initial={false}
            animate={{ scaleX: checked ? 1 : 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="absolute left-0 right-0 top-1/2 pointer-events-none origin-left"
            style={{ height: 1.5, background: 'currentColor' }}
          />
        </motion.span>
      </AnimatePresence>
    </span>
  </button>
)

export default IngredientItem
