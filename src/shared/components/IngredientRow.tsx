import { memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import IngredientCheckbox from '@/shared/components/IngredientCheckbox'

const textVariants = {
  enter: (d: 'up' | 'down' | null) => ({ y: d === 'up' ? 8 : d === 'down' ? -8 : 0, opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit: (d: 'up' | 'down' | null) => ({ y: d === 'up' ? -8 : d === 'down' ? 8 : 0, opacity: 0 }),
}

type IngredientRowProps = {
  text: string
  isChecked: boolean
  portionKey?: number
  portionDir?: 'up' | 'down' | null
  theme?: 'light' | 'dark'
  noBorder?: boolean
  onToggle: () => void
}

const IngredientRow = ({
  text,
  isChecked,
  portionKey,
  portionDir = null,
  theme = 'light',
  noBorder = false,
  onToggle,
}: IngredientRowProps) => {
  const borderCls = noBorder
    ? ''
    : theme === 'dark'
    ? 'border-b-[0.5px] border-paper/[0.08]'
    : 'border-b-[0.5px] border-ink/14'

  const textCls =
    theme === 'dark'
      ? isChecked
        ? 'text-paper/40'
        : 'text-paper'
      : isChecked
      ? 'text-stone opacity-50'
      : 'text-ink opacity-100'

  const strikethrough = (
    <motion.span
      aria-hidden
      initial={false}
      animate={{ scaleX: isChecked ? 1 : 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
      className="absolute left-0 right-0 top-1/2 pointer-events-none origin-left"
      style={{ height: 1.5, background: 'currentColor' }}
    />
  )

  return (
    <button
      onClick={() => onToggle()}
      className={`flex items-center gap-3 py-[10px] w-full bg-transparent border-0 text-left cursor-pointer ${borderCls}`}
    >
      <IngredientCheckbox checked={isChecked} theme={theme} />
      <span
        className={`flex-1 text-[15px] overflow-hidden relative transition-[color,opacity] duration-200 ease-[ease] ${textCls}`}
      >
        {portionKey !== undefined ? (
          <AnimatePresence mode="popLayout" custom={portionDir}>
            <motion.span
              key={portionKey}
              custom={portionDir}
              variants={textVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="block relative w-fit"
            >
              {text}
              {strikethrough}
            </motion.span>
          </AnimatePresence>
        ) : (
          <span className="block relative w-fit">
            {text}
            {strikethrough}
          </span>
        )}
      </span>
    </button>
  )
}

export default memo(IngredientRow)
