import { motion } from 'framer-motion'
import type { Recipe } from '@/features/recipe/types/recipe'
import type { TreeNode } from '@/features/cooking/types/cooking'
import PortionControls from '@/features/cooking/components/PortionControls'
import IngredientRow from '@/shared/components/IngredientRow'
import GroupLabel from '@/shared/components/GroupLabel'

type CookingIngredientsPanelProps = {
  recipe: Recipe
  scaledIngredients: TreeNode[]
  selectedPortions: number
  portionDir: 'up' | 'down' | null
  checked: Set<string>
  onPortionsChange: (p: number) => void
  onToggle: (path: string) => void
}

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
    <PortionControls
      recipe={recipe}
      selectedPortions={selectedPortions}
      portionDir={portionDir}
      onPortionsChange={onPortionsChange}
    />

    {scaledIngredients.flatMap((node, ni) => {
      if (node.kind === 'group') {
        return [
          node.title ? (
            <div key={`h${ni}`} className={`mb-2${ni > 0 ? ' mt-4' : ''}`}>
              <GroupLabel theme="dark">{node.title}</GroupLabel>
            </div>
          ) : null,
          ...node.children
            .filter((c) => c.kind === 'leaf')
            .map((c, ci) => {
              const k = `${ni}-${ci}`
              return (
                <IngredientRow
                  key={k}
                  text={c.text}
                  isChecked={checked.has(k)}
                  portionKey={selectedPortions}
                  portionDir={portionDir}
                  theme="dark"
                  onToggle={() => onToggle(k)}
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
            text={node.text}
            isChecked={checked.has(k)}
            portionKey={selectedPortions}
            portionDir={portionDir}
            theme="dark"
            onToggle={() => onToggle(k)}
          />,
        ]
      }
      return []
    })}
  </motion.div>
)

export default CookingIngredientsPanel
