import { motion } from 'framer-motion'

type ShoppingIngredientRowProps = {
  text: string
  checked: boolean
  onToggle: () => void
}

const ShoppingIngredientRow = ({ text, checked, onToggle }: ShoppingIngredientRowProps) => {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-3 py-[6px] bg-transparent border-0 text-left w-full cursor-pointer"
    >
      <motion.span
        initial={false}
        animate={{
          background: checked ? 'var(--bordeaux)' : 'transparent',
          borderColor: checked ? 'var(--bordeaux)' : 'var(--stone-2)',
          scale: checked ? [1, 0.82, 1] : 1,
        }}
        transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
        className="w-[22px] h-[22px] rounded-[6px] border-[1.5px] border-solid inline-flex items-center justify-center shrink-0"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
          <motion.path
            d="M5 12l5 5L20 7"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            animate={{
              pathLength: checked ? 1 : 0,
              opacity: checked ? 1 : 0,
            }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          />
        </svg>
      </motion.span>
      <span
        className="flex-1 text-[14px] overflow-hidden relative transition-[color,opacity] duration-200 ease-[ease]"
        style={{
          color: checked ? 'var(--stone)' : 'var(--ink)',
          opacity: checked ? 0.5 : 1,
        }}
      >
        <span className="block relative w-fit">
          {text}
          <motion.span
            aria-hidden
            initial={false}
            animate={{ scaleX: checked ? 1 : 0 }}
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
        </span>
      </span>
    </button>
  )
}

export default ShoppingIngredientRow
