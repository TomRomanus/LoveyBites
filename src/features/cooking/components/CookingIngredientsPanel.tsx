import { motion, AnimatePresence } from 'framer-motion'
import { Minus, Plus } from 'lucide-react'
import IngredientCheckbox from '@/shared/components/IngredientCheckbox'
import type { Recipe } from '@/features/recipe/types/recipe'
import type { TreeNode } from '@/features/cooking/types/cooking'

const SECTION_HEADER_COLOR = '#b8394e'

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
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 0',
      width: '100%',
      background: 'transparent',
      border: 0,
      borderBottom: '0.5px solid rgba(248,244,237,0.08)',
      textAlign: 'left',
      cursor: 'pointer',
    }}
  >
    <IngredientCheckbox checked={isChecked} theme="dark" />
    <span
      style={{
        fontSize: 15,
        flex: 1,
        color: isChecked ? 'rgba(248,244,237,0.4)' : '#f8f4ed',
        transition: 'color 0.2s ease',
        overflow: 'hidden',
        position: 'relative',
      }}
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
          style={{ display: 'block', position: 'relative', width: 'fit-content' }}
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
    style={{ padding: '12px 24px' }}
  >
    {/* Portion selector */}
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontFamily: 'var(--mono)',
          fontSize: 12,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'rgba(248,244,237,0.65)',
        }}
      >
        <span>voor</span>
        <div style={{ overflow: 'hidden' }}>
          <AnimatePresence mode="popLayout" custom={portionDir}>
            <motion.span
              key={selectedPortions}
              custom={portionDir}
              variants={portionVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              style={{ display: 'block' }}
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(248,244,237,0.1)',
          borderRadius: 16,
          padding: 3,
        }}
      >
        <button
          onClick={() => onPortionsChange(Math.max(1, selectedPortions - 1))}
          style={{
            width: 30,
            height: 30,
            borderRadius: 13,
            background: 'rgba(248,244,237,0.15)',
            border: 0,
            color: '#f8f4ed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
          }}
        >
          <Minus size={14} strokeWidth={2.4} />
        </button>
        <div
          style={{
            minWidth: 72,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            fontFamily: 'var(--mono)',
            fontSize: 12,
            color: '#f8f4ed',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          <div style={{ overflow: 'hidden', position: 'relative' }}>
            <AnimatePresence mode="popLayout" custom={portionDir}>
              <motion.span
                key={selectedPortions}
                custom={portionDir}
                variants={portionVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                style={{ display: 'block' }}
              >
                {selectedPortions}
              </motion.span>
            </AnimatePresence>
          </div>
          <span>{recipe.portionsLabel || 'pers'}</span>
        </div>
        <button
          onClick={() => onPortionsChange(selectedPortions + 1)}
          style={{
            width: 30,
            height: 30,
            borderRadius: 13,
            background: 'rgba(248,244,237,0.15)',
            border: 0,
            color: '#f8f4ed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
          }}
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
            <div key={`h${ni}`} style={{ marginTop: ni > 0 ? 16 : 0 }}>
              <div
                style={{
                  fontFamily: 'var(--serif)',
                  fontStyle: 'italic',
                  fontSize: 14,
                  color: SECTION_HEADER_COLOR,
                  fontWeight: 500,
                  marginBottom: 3,
                }}
              >
                {node.title}
              </div>
              <div
                style={{
                  width: 22,
                  height: 1.5,
                  background: SECTION_HEADER_COLOR,
                  borderRadius: 1,
                  opacity: 0.6,
                  marginBottom: 8,
                }}
              />
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
