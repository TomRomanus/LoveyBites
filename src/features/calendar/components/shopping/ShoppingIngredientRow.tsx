import { motion } from 'framer-motion'
import IngredientCheckbox from '@/shared/components/IngredientCheckbox'

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
      <IngredientCheckbox checked={checked} />
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
