import { motion, AnimatePresence } from 'framer-motion'
import { Minus, Plus } from 'lucide-react'
import IngredientCheckbox from '@/shared/components/IngredientCheckbox'
import type { Recipe } from '@/features/recipe/types/recipe'
import type { TreeNode } from '@/features/cooking/types/cooking'

type CookingIngredientsPanelProps = {
  recipe: Recipe
  scaledIngredients: TreeNode[]
  selectedPortions: number
  portionDir: 'up' | 'down' | null
  checked: Set<string>
  onPortionsChange: (p: number) => void
  onToggle: (path: string) => void
}

const portionVariants = {
  enter: (d: 'up' | 'down' | null) => ({ y: d === 'up' ? 10 : d === 'down' ? -10 : 0, opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit: (d: 'up' | 'down' | null) => ({ y: d === 'up' ? -10 : d === 'down' ? 10 : 0, opacity: 0 }),
}

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
    className="flex items-center gap-3 py-[10px] w-full bg-transparent border-b border-[0.5px] border-paper/[0.08] text-left cursor-pointer"
  >
    <IngredientCheckbox checked={isChecked} theme="dark" />
    <span
      className="text-[15px] flex-1 overflow-hidden relative transition-colors duration-200 ease-[ease]"
      style={{ color: isChecked ? 'rgba(248,244,237,0.4)' : '#f8f4ed' }}
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

const CookingIngredientsPanel = ({
  recipe,
  scaledIngredients,
  selectedPortions,
  portionDir,
  checked,
  onPortionsChange,
  onToggle,
}: CookingIngredientsPanelProps) => (
  <motion.div
    initial={{ y: 24, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
    className="py-3 px-6"
  >
    {/* Portion selector */}
    <div className="flex items-center justify-between mb-[14px]">
      <div className="flex items-center gap-1 font-mono text-[12px] tracking-[0.08em] uppercase text-paper/[0.65]">
        <span>voor</span>
        <div className="overflow-hidden">
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
        <span>
          {recipe.portionsLabel === 'stuks'
            ? selectedPortions === 1
              ? 'stuk'
              : 'stuks'
            : selectedPortions === 1
              ? 'persoon'
              : 'personen'}
        </span>
      </div>
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

    {/* Ingredient rows */}
    {scaledIngredients.flatMap((node, ni) => {
      if (node.kind === 'group') {
        return [
          node.title ? (
            <div key={`h${ni}`} className={ni > 0 ? 'mt-4' : ''}>
              <div className="font-serif italic text-[14px] font-medium mb-[3px] text-[#b8394e]">
                {node.title}
              </div>
              <div className="w-[22px] h-[1.5px] rounded-[1px] opacity-60 mb-2 bg-[#b8394e]" />
            </div>
          ) : null,
          ...node.children
            .filter((c) => c.kind === 'leaf')
            .map((c, ci) => {
              if (c.kind !== 'leaf') return null
              const k = `${ni}-${ci}`
              return (
                <IngredientRow
                  key={k}
                  itemKey={k}
                  text={c.text}
                  isChecked={checked.has(k)}
                  selectedPortions={selectedPortions}
                  portionDir={portionDir}
                  onToggle={onToggle}
                />
              )
            }),
        ].filter(Boolean)
      }
      if (node.kind === 'leaf') {
        const k = `root-${ni}`
        return [
          <IngredientRow
            key={k}
            itemKey={k}
            text={node.text}
            isChecked={checked.has(k)}
            selectedPortions={selectedPortions}
            portionDir={portionDir}
            onToggle={onToggle}
          />,
        ]
      }
      return []
    })}
  </motion.div>
)

export default CookingIngredientsPanel
