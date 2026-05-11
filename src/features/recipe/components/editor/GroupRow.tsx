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
import type { EditorLabels, IngredientOption, LeafEdgeFlags } from '@/features/recipe/components/editor/LeafRow'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { IngredientNode } from '@/features/recipe/types/recipe'
import BordeauxBar from '@/shared/components/BordeauxBar'

const xBtnCls =
  'bg-none border-0 text-stone-2 p-1.5 cursor-pointer shrink-0 flex items-center justify-center opacity-80'

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
  focusId?: string | null
  shouldFocusTitle?: boolean
  onRequestFocus?: (id: string) => void
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
  focusId,
  shouldFocusTitle,
  onRequestFocus,
}: GroupRowProps) => {
  let leafCounter = 0
  const childIds = node.children.map((c) => c.id!)

  return (
    // Handle sits OUTSIDE (to the left of) the vertical bordeaux bar
    <div className="flex items-start my-3 mb-1">
      <motion.div
        animate={{ width: reordering ? 30 : 0, opacity: reordering ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 340, damping: 30 }}
        className="overflow-hidden shrink-0 flex items-start"
      >
        <GripHandle className="pt-2 pr-2.5" />
      </motion.div>

      <div className="border-l-2 border-bordeaux/30 pt-0.5 pb-1 pl-3 flex-1 min-w-0">
        <div className="flex items-center justify-between mb-[3px]">
          <input
            type="text"
            value={node.title}
            onChange={(e) =>
              onChange(replaceAt(allNodes, path, { ...node, title: e.target.value }))
            }
            autoFocus={shouldFocusTitle}
            className="flex-1 font-serif italic text-[13px] font-medium text-bordeaux bg-transparent border-0 outline-none py-0.5"
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
            className={xBtnCls}
            aria-label="Sectie verwijderen"
          >
            <X size={11} strokeWidth={2.2} />
          </button>
        </div>

        <BordeauxBar className="w-[22px] opacity-55 mb-1.5" />

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
                      flags={{
                        isOnly: node.children.length === 1,
                        isLast: i === node.children.length - 1,
                        ordered: ordered ?? false,
                        reordering: reordering ?? false,
                        shouldFocus: child.id === focusId,
                      } satisfies LeafEdgeFlags}
                      allNodes={allNodes}
                      labels={labels}
                      onChange={onChange}
                      ingredientOptions={ingredientOptions}
                      itemIndex={idx}
                      leafIndexMap={leafIndexMap}
                    />
                  </SortableItem>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </SortableContext>

        <button
          type="button"
          onClick={() => {
            const leaf = newLeaf()
            onRequestFocus?.(leaf.id!)
            onChange(appendChild(allNodes, path, leaf))
          }}
          className="flex items-center gap-1.5 px-2 py-[7px] mt-1.5 border border-dashed border-bordeaux/22 rounded-[7px] text-stone text-[11.5px] min-h-8 bg-none cursor-pointer font-sans w-full"
        >
          <Plus size={10} strokeWidth={2.5} />
          {labels.addLeafInGroup}
        </button>
      </div>
    </div>
  )
}

export default GroupRow
