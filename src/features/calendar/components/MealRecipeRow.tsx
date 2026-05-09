import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Check } from 'lucide-react'
import type { Recipe } from '@/features/recipe/types/recipe'

type MealRecipeRowProps = {
  recipe: Recipe
  selectedId: string | null
  saving: boolean
  onSelect: (id: string) => void
  index: number
}

const MealRecipeRow = ({ recipe: r, selectedId, saving, onSelect, index }: MealRecipeRowProps) => (
  <motion.div
    key={r.id}
    layout
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{
      duration: 0.18,
      delay: Math.min(index * 0.03, 0.15),
      layout: { type: 'spring', stiffness: 350, damping: 35 },
    }}
  >
    <motion.button
      onClick={() => onSelect(r.id)}
      disabled={saving}
      whileTap={{ scale: 0.98 }}
      className="block py-[10px] border-0 border-b border-[0.5px] border-ink/10 w-full text-left cursor-pointer rounded-[4px]"
    >
      <div className="flex items-center justify-between gap-[10px]">
        <div className="flex-1 min-w-0">
          <div className="m-0 font-serif italic text-[18px] font-medium leading-[1.15] tracking-[-0.015em] text-ink">
            {r.title}
          </div>
          <div className="w-6 h-[1.5px] bg-bordeaux rounded-[1px] opacity-60 my-1" />
          {r.tags.length > 0 && (
            <div className="font-mono text-[9px] uppercase tracking-[0.08em]">
              {r.tags.map((t, i) => (
                <span key={t}>
                  {i > 0 && <span className="text-bordeaux/40"> · </span>}
                  <span className="text-bordeaux/40">{t}</span>
                </span>
              ))}
            </div>
          )}
        </div>
        <AnimatePresence mode="wait" initial={false}>
          {selectedId === r.id ? (
            <motion.div
              key="check"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 22 }}
              className="shrink-0 flex items-center justify-center w-[22px] h-[22px] rounded-full bg-bordeaux"
            >
              <Check size={12} strokeWidth={3} color="white" />
            </motion.div>
          ) : (
            <motion.div
              key="chevron"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="shrink-0 flex items-center"
            >
              <ChevronRight size={16} strokeWidth={1.6} color="var(--stone)" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  </motion.div>
)

export default MealRecipeRow
