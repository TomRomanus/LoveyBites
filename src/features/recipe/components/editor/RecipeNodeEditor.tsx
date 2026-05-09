import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  pointerWithin,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { IngredientNode } from '@/features/recipe/types/recipe'
import LeafRow from '@/features/recipe/components/editor/LeafRow'
import type { EditorLabels, IngredientOption } from '@/features/recipe/components/editor/LeafRow'
import GroupRow from '@/features/recipe/components/editor/GroupRow'
import SortableItem from '@/features/recipe/components/editor/SortableItem'
import DragOverlayContent from '@/features/recipe/components/editor/DragOverlayContent'
import DashedAddButton from '@/features/recipe/components/editor/DashedAddButton'
import {
  newLeaf,
  collectGroupTitles,
  buildLeafIndexMap,
} from '@/features/recipe/components/editor/nodeTree'
import { moveNodeInTree, findNode } from '@/features/recipe/components/editor/dndTree'

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
  leafMultiline?: boolean
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
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  )

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id as string)
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null)
    if (!over || active.id === over.id) return
    onChange(moveNodeInTree(nodes, active.id as string, over.id as string))
  }

  const addSection = (title: string) => {
    const last = nodes[nodes.length - 1]
    const base = last?.kind === 'leaf' && last.text.trim() === '' ? nodes.slice(0, -1) : nodes
    onChange([...base, { kind: 'group', title, children: [newLeaf()] }])
  }

  const collisionDetection = useCallback<typeof closestCenter>((args) => {
    const hits = pointerWithin(args)
    return hits.length > 0 ? hits : closestCenter(args)
  }, [])

  const existingTitles = useMemo(() => collectGroupTitles(nodes), [nodes])
  const availableSections = useMemo(
    () => commonSections?.filter((name) => !existingTitles.has(name)) ?? [],
    [commonSections, existingTitles],
  )
  const leafIndexMap = useMemo(
    () => (ordered ? buildLeafIndexMap(nodes) : undefined),
    [ordered, nodes],
  )
  const rootIds = useMemo(() => nodes.map((n) => n.id!), [nodes])
  const activeNode = useMemo(() => (activeId ? findNode(nodes, activeId) : null), [activeId, nodes])

  let rootLeafCounter = 0

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
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
                        isOnly={nodes.length === 1}
                        isLast={i === nodes.length - 1}
                        allNodes={nodes}
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
                    />
                  </SortableItem>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </SortableContext>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
          <DashedAddButton onClick={() => onChange([...nodes, newLeaf()])} label={labels.addLeaf} />
          <DashedAddButton onClick={() => addSection('')} label={labels.addGroup} />

          <AnimatePresence>
            {availableSections.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                style={{ paddingTop: 4 }}
              >
                <div
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 8.5,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'var(--stone-2)',
                    marginBottom: 6,
                  }}
                >
                  Sectiesuggesties
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
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
                        style={{
                          fontSize: 10.5,
                          padding: '5px 11px',
                          borderRadius: 20,
                          border: '1px dashed var(--stone-2)',
                          background: 'transparent',
                          color: 'var(--stone)',
                          fontFamily: 'var(--mono)',
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          cursor: 'pointer',
                        }}
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
