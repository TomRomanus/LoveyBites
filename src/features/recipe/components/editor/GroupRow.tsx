import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus } from 'lucide-react'
import {
  replaceAt,
  removeAt,
  appendChild,
  newLeaf,
} from '@/features/recipe/components/editor/nodeTree'
import { GripHandle } from '@/features/recipe/components/editor/GripHandle'
import SortableItem from '@/features/recipe/components/editor/SortableItem'
import LeafRow from '@/features/recipe/components/editor/LeafRow'
import type { EditorLabels, IngredientOption } from '@/features/recipe/components/editor/LeafRow'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { IngredientNode } from '@/features/recipe/types/recipe'

const xBtn: React.CSSProperties = {
  background: 'none',
  border: 0,
  color: 'var(--stone-2)',
  padding: 6,
  cursor: 'pointer',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: 0.8,
}

type GroupRowProps = {
  node: IngredientNode & { kind: 'group' }
  path: number[]
  isOnly: boolean
  allNodes: IngredientNode[]
  labels: EditorLabels
  onChange: (nodes: IngredientNode[]) => void
  ingredientOptions?: IngredientOption[]
  ordered?: boolean
  leafIndexMap?: Map<string, number>
  reordering?: boolean
}

const GroupRow = ({
  node,
  path,
  isOnly,
  allNodes,
  labels,
  onChange,
  ingredientOptions,
  ordered,
  leafIndexMap,
  reordering,
}: GroupRowProps) => {
  let leafCounter = 0
  const childIds = node.children.map((c) => c.id!)

  return (
    // Handle sits OUTSIDE (to the left of) the vertical bordeaux bar
    <div style={{ display: 'flex', alignItems: 'flex-start', margin: '12px 0 4px' }}>
      <motion.div
        animate={{ width: reordering ? 30 : 0, opacity: reordering ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 340, damping: 30 }}
        style={{ overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'flex-start' }}
      >
        <GripHandle style={{ paddingTop: 8, paddingRight: 10 }} />
      </motion.div>

      <div
        style={{
          borderLeft: '2px solid rgba(107,31,42,0.30)',
          padding: '2px 0 4px 12px',
          flex: 1,
          minWidth: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 3,
          }}
        >
          <input
            type="text"
            value={node.title}
            onChange={(e) =>
              onChange(replaceAt(allNodes, path, { ...node, title: e.target.value }))
            }
            style={{
              flex: 1,
              fontFamily: 'var(--serif)',
              fontStyle: 'italic',
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--bordeaux)',
              background: 'transparent',
              border: 0,
              outline: 'none',
              padding: '2px 0',
            }}
            placeholder={labels.groupPlaceholder}
          />
          <button
            type="button"
            onClick={() => {
              if (isOnly) {
                onChange(node.children.length > 0 ? node.children : [newLeaf()])
              } else {
                onChange(removeAt(allNodes, path))
              }
            }}
            style={xBtn}
            aria-label="Sectie verwijderen"
          >
            <X size={11} strokeWidth={2.2} />
          </button>
        </div>

        <div
          style={{
            width: 22,
            height: 1.5,
            background: 'var(--bordeaux)',
            opacity: 0.55,
            borderRadius: 1,
            marginBottom: 6,
          }}
        />

        <SortableContext items={childIds} strategy={verticalListSortingStrategy}>
          <AnimatePresence mode="popLayout" initial={false}>
            {node.children.map((child, i) => {
              if (child.kind !== 'leaf') return null
              const idx = leafCounter++
              return (
                <motion.div
                  key={child.id ?? i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                >
                  <SortableItem id={child.id!}>
                    <LeafRow
                      node={child}
                      path={[...path, i]}
                      isOnly={node.children.length === 1}
                      isLast={i === node.children.length - 1}
                      allNodes={allNodes}
                      labels={labels}
                      onChange={onChange}
                      ingredientOptions={ingredientOptions}
                      ordered={ordered}
                      itemIndex={idx}
                      leafIndexMap={leafIndexMap}
                      reordering={reordering}
                    />
                  </SortableItem>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </SortableContext>

        <button
          type="button"
          onClick={() => onChange(appendChild(allNodes, path, newLeaf()))}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 8px',
            marginTop: 6,
            border: '1px dashed rgba(107,31,42,0.22)',
            borderRadius: 7,
            color: 'var(--stone)',
            fontSize: 11.5,
            minHeight: 32,
            background: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--sans)',
            width: '100%',
          }}
        >
          <Plus size={10} strokeWidth={2.5} />
          {labels.addLeafInGroup}
        </button>
      </div>
    </div>
  )
}

export default GroupRow
