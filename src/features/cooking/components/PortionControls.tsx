import { motion, AnimatePresence } from 'framer-motion'
import { Minus, Plus } from 'lucide-react'
import type { Recipe } from '@/features/recipe/types/recipe'

type PortionControlsProps = {
  recipe: Recipe
  selectedPortions: number
  portionDir: 'up' | 'down' | null
  onPortionsChange: (p: number) => void
}

const portionVariants = {
  enter: (d: 'up' | 'down' | null) => ({ y: d === 'up' ? 10 : d === 'down' ? -10 : 0, opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit: (d: 'up' | 'down' | null) => ({ y: d === 'up' ? -10 : d === 'down' ? 10 : 0, opacity: 0 }),
}

const PortionControls = ({
  recipe,
  selectedPortions,
  portionDir,
  onPortionsChange,
}: PortionControlsProps) => (
  <div className="flex items-center justify-between mb-[14px]">
    <span className="font-mono text-[12px] tracking-[0.08em] uppercase text-paper/[0.65]">
      porties
    </span>
    <div className="flex items-center rounded-[16px] p-[3px] bg-paper/10">
      <button
        onClick={() => onPortionsChange(Math.max(1, selectedPortions - 1))}
        className="w-[30px] h-[30px] rounded-[13px] border-0 text-paper flex items-center justify-center cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.2)] bg-paper/[0.15]"
      >
        <Minus size={14} strokeWidth={2.4} />
      </button>
      <div className="min-w-[72px] flex items-center justify-center gap-1 font-mono text-[12px] text-paper tracking-[0.08em] uppercase">
        <div className="overflow-hidden relative">
          <AnimatePresence mode="popLayout" custom={portionDir}>
            <motion.span
              key={selectedPortions}
              custom={portionDir}
              variants={portionVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="block"
            >
              {selectedPortions}
            </motion.span>
          </AnimatePresence>
        </div>
        <span>{recipe.portionsLabel || 'pers'}</span>
      </div>
      <button
        onClick={() => onPortionsChange(selectedPortions + 1)}
        className="w-[30px] h-[30px] rounded-[13px] border-0 text-paper flex items-center justify-center cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.2)] bg-paper/[0.15]"
      >
        <Plus size={14} strokeWidth={2.4} />
      </button>
    </div>
  </div>
)

export default PortionControls
