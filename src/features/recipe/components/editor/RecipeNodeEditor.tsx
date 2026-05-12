import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DndContext, DragOverlay } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { IngredientNode } from '@/features/recipe/types/recipe'
import LeafRow from '@/features/recipe/components/editor/LeafRow'
import type {
  EditorLabels,
  IngredientOption,
  LeafEdgeFlags,
} from '@/features/recipe/components/editor/LeafRow'
import GroupRow from '@/features/recipe/components/editor/GroupRow'
import SortableItem from '@/features/recipe/components/editor/SortableItem'
import DragOverlayContent from '@/features/recipe/components/editor/DragOverlayContent'
import DashedAddButton from '@/features/recipe/components/editor/DashedAddButton'
import { newLeaf } from '@/features/recipe/components/editor/nodeTree'
import { findNode } from '@/features/recipe/components/editor/dndTree'
import { useNodeEditor } from '@/features/recipe/components/editor/useNodeEditor'

const defaultLabels: EditorLabels = {
  leafPlaceholder: 'bijv. 360ml karnemelk',
  groupPlaceholder: 'Sectienaam (bijv. Marinade)',
  addLeafInGroup: 'ingrediënt in sectie',
  addLeaf: 'ingrediënt toevoegen',
  addGroup: 'sectie toevoegen',
}

type RecipeNodeEditorProps = {
  nodes: IngredientNode[]
  onChange: (nodes: IngredientNode[]) => void
  labels?: Partial<EditorLabels>
  commonSections?: string[]
  ingredientOptions?: IngredientOption[]
  ordered?: boolean
  reordering?: boolean
}

const RecipeNodeEditor = ({
  nodes,
  onChange,
  labels: labelOverrides,
  commonSections,
  ingredientOptions,
  ordered,
  reordering,
}: RecipeNodeEditorProps) => {
  const labels = { ...defaultLabels, ...labelOverrides }

  const [focusId, setFocusId] = useState<string | null>(null)

  const {
    sensors,
    activeId,
    collisionDetection,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
    leafIndexMap,
    availableSections,
  } = useNodeEditor({ nodes, onChange, commonSections, ordered })

  const rootIds = useMemo(() => nodes.map((n) => n.id!), [nodes])
  const activeNode = useMemo(() => (activeId ? findNode(nodes, activeId) : null), [activeId, nodes])

  const addLeaf = () => {
    const leaf = newLeaf()
    setFocusId(leaf.id!)
    onChange([...nodes, leaf])
  }

  const addSection = (title: string) => {
    const last = nodes[nodes.length - 1]
    const base = last?.kind === 'leaf' && last.text.trim() === '' ? nodes.slice(0, -1) : nodes
    const id = crypto.randomUUID()
    setFocusId(id)
    onChange([...base, { kind: 'group', id, title, children: [newLeaf()] }])
  }

  let rootLeafCounter = 0

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex flex-col">
        <SortableContext items={rootIds} strategy={verticalListSortingStrategy}>
          <AnimatePresence mode="popLayout" initial={false}>
            {nodes.map((node, i) => {
              if (node.kind === 'leaf') {
                const idx = rootLeafCounter++
                return (
                  <motion.div
                    key={node.id ?? i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.1 } }}
                  >
                    <SortableItem id={node.id!}>
                      <LeafRow
                        node={node}
                        path={[i]}
                        flags={
                          {
                            isOnly: nodes.length === 1,
                            isLast: i === nodes.length - 1,
                            ordered: ordered ?? false,
                            reordering: reordering ?? false,
                            shouldFocus: node.id === focusId,
                          } satisfies LeafEdgeFlags
                        }
                        allNodes={nodes}
                        labels={labels}
                        onChange={onChange}
                        ingredientOptions={ingredientOptions}
                        itemIndex={idx}
                        leafIndexMap={leafIndexMap}
                      />
                    </SortableItem>
                  </motion.div>
                )
              }

              return (
                <motion.div
                  key={node.id ?? i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                >
                  <SortableItem id={node.id!}>
                    <GroupRow
                      node={node}
                      path={[i]}
                      isOnly={nodes.length === 1}
                      allNodes={nodes}
                      labels={labels}
                      onChange={onChange}
                      ingredientOptions={ingredientOptions}
                      ordered={ordered}
                      leafIndexMap={leafIndexMap}
                      reordering={reordering}
                      focusId={focusId}
                      shouldFocusTitle={node.id === focusId}
                      onRequestFocus={setFocusId}
                    />
                  </SortableItem>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </SortableContext>

        <div className="flex flex-col gap-1.5 mt-1.5">
          <DashedAddButton onClick={addLeaf} label={labels.addLeaf} />
          <DashedAddButton onClick={() => addSection('')} label={labels.addGroup} />

          <AnimatePresence>
            {availableSections.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="pt-1"
              >
                <div className="font-mono text-[8.5px] tracking-[0.14em] uppercase text-stone-2 mb-1.5">
                  Sectiesuggesties
                </div>
                <div className="flex flex-wrap gap-[5px]">
                  <AnimatePresence>
                    {availableSections.map((name, i) => (
                      <motion.button
                        key={name}
                        initial={{ scale: 0.85, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.85, opacity: 0, transition: { duration: 0.1 } }}
                        layout
                        transition={{
                          type: 'spring',
                          stiffness: 380,
                          damping: 28,
                          delay: i * 0.04,
                        }}
                        type="button"
                        onClick={() => addSection(name)}
                        className="text-[10.5px] py-[5px] px-[11px] rounded-[20px] border border-dashed border-stone-2 bg-transparent text-stone font-mono tracking-[0.06em] uppercase cursor-pointer"
                      >
                        + {name}
                      </motion.button>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: 'ease' }}>
        {activeNode && (
          <DragOverlayContent node={activeNode} ordered={ordered} leafIndexMap={leafIndexMap} />
        )}
      </DragOverlay>
    </DndContext>
  )
}

export default RecipeNodeEditor
