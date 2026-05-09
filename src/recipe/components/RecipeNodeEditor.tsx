import { useState, createContext, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, GripVertical } from 'lucide-react'
import { produce } from 'immer'
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
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { IngredientNode } from '../types/recipe'
export { pruneEmpty } from '../utils/ingredientUtils'
import AutoGrowTextarea from '../../shared/components/AutoGrowTextarea'
import IngredientPickerSheet from './IngredientPickerSheet'

// ── Tree helpers ─────────────────────────────────────────────────────────────

const newLeaf = (): IngredientNode => ({ kind: 'leaf', text: '', id: crypto.randomUUID() })

const replaceAt = (
  nodes: IngredientNode[],
  path: number[],
  replacement: IngredientNode,
): IngredientNode[] => {
  if (path.length === 1) return nodes.map((n, i) => (i === path[0] ? replacement : n))
  return nodes.map((n, i) => {
    if (i !== path[0] || n.kind !== 'group') return n
    return { ...n, children: replaceAt(n.children, path.slice(1), replacement) }
  })
}

const removeAt = (nodes: IngredientNode[], path: number[]): IngredientNode[] => {
  if (path.length === 1) return nodes.filter((_, i) => i !== path[0])
  return nodes.map((n, i) => {
    if (i !== path[0] || n.kind !== 'group') return n
    return { ...n, children: removeAt(n.children, path.slice(1)) }
  })
}

const appendChild = (
  nodes: IngredientNode[],
  path: number[],
  node: IngredientNode,
): IngredientNode[] => {
  if (path.length === 0) return [...nodes, node]
  return nodes.map((n, i) => {
    if (i !== path[0] || n.kind !== 'group') return n
    if (path.length === 1) return { ...n, children: [...n.children, node] }
    return { ...n, children: appendChild(n.children, path.slice(1), node) }
  })
}

const collectGroupTitles = (nodes: IngredientNode[]): Set<string> => {
  const titles = new Set<string>()
  for (const node of nodes) {
    if (node.kind === 'group') {
      if (node.title) titles.add(node.title)
      for (const t of collectGroupTitles(node.children)) titles.add(t)
    }
  }
  return titles
}

// ── DnD helpers ──────────────────────────────────────────────────────────────

const findContainer = (nodes: IngredientNode[], id: string): string | null => {
  for (const n of nodes) {
    if (n.id === id) return null
    if (n.kind === 'group') {
      for (const c of n.children) {
        if (c.id === id) return n.id!
      }
    }
  }
  return null
}

const findNode = (nodes: IngredientNode[], id: string): IngredientNode | null => {
  for (const n of nodes) {
    if (n.id === id) return n
    if (n.kind === 'group') {
      const found = findNode(n.children, id)
      if (found) return found
    }
  }
  return null
}

const removeDragNode = (nodes: IngredientNode[], id: string): IngredientNode[] =>
  nodes
    .filter((n) => n.id !== id)
    .map((n) =>
      n.kind === 'group' ? { ...n, children: n.children.filter((c) => c.id !== id) } : n,
    )

const moveNodeInTree = (
  nodes: IngredientNode[],
  activeId: string,
  overId: string,
): IngredientNode[] => {
  if (activeId === overId) return nodes
  const activeNode = findNode(nodes, activeId)
  const overNode = findNode(nodes, overId)
  if (!activeNode || !overNode) return nodes

  const rootIds = nodes.map((n) => n.id!)
  const activeContainer = findContainer(nodes, activeId)
  const overContainer = findContainer(nodes, overId)

  // Dragging a group — reorder at root only
  if (activeNode.kind === 'group') {
    const oldIdx = rootIds.indexOf(activeId)
    const newIdx = rootIds.indexOf(overId)
    if (oldIdx === -1 || newIdx === -1) return nodes
    return arrayMove(nodes, oldIdx, newIdx)
  }

  // Dragging a leaf over a group header → append to that group
  if (overNode.kind === 'group') {
    const without = removeDragNode(nodes, activeId)
    return without.map((n) =>
      n.kind === 'group' && n.id === overId ? { ...n, children: [...n.children, activeNode] } : n,
    )
  }

  // Leaf over leaf — same container
  if (activeContainer === overContainer) {
    if (activeContainer === null) {
      const oldIdx = rootIds.indexOf(activeId)
      const newIdx = rootIds.indexOf(overId)
      if (oldIdx === -1 || newIdx === -1) return nodes
      return arrayMove(nodes, oldIdx, newIdx)
    }
    return nodes.map((n) => {
      if (n.kind !== 'group' || n.id !== activeContainer) return n
      const ids = n.children.map((c) => c.id!)
      const oldIdx = ids.indexOf(activeId)
      const newIdx = ids.indexOf(overId)
      if (oldIdx === -1 || newIdx === -1) return n
      return { ...n, children: arrayMove(n.children, oldIdx, newIdx) }
    })
  }

  // Leaf over leaf — cross container
  const without = removeDragNode(nodes, activeId)
  if (overContainer === null) {
    return produce(without, (draft) => {
      const idx = draft.findIndex((n) => n.id === overId)
      draft.splice(idx === -1 ? draft.length : idx, 0, activeNode as IngredientNode)
    })
  }
  return produce(without, (draft) => {
    const group = draft.find((n) => n.kind === 'group' && n.id === overContainer)
    if (group?.kind !== 'group') return
    const idx = group.children.findIndex((c) => c.id === overId)
    group.children.splice(idx === -1 ? group.children.length : idx, 0, activeNode as IngredientNode)
  })
}

// ── Labels ───────────────────────────────────────────────────────────────────

type EditorLabels = {
  leafPlaceholder: string
  groupPlaceholder: string
  addLeafInGroup: string
  addLeaf: string
  addGroup: string
}

const defaultLabels: EditorLabels = {
  leafPlaceholder: 'bijv. 360ml karnemelk',
  groupPlaceholder: 'Sectienaam (bijv. Marinade)',
  addLeafInGroup: 'ingrediënt in sectie',
  addLeaf: 'ingrediënt toevoegen',
  addGroup: 'sectie toevoegen',
}

// ── Styles ───────────────────────────────────────────────────────────────────

const leafInputStyle: React.CSSProperties = {
  flex: 1,
  background: 'transparent',
  border: 0,
  outline: 'none',
  fontFamily: 'var(--sans)',
  fontSize: 14,
  color: 'var(--ink)',
  padding: '8px 4px',
  resize: 'none',
  lineHeight: 1.45,
}

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

// ── Icons ─────────────────────────────────────────────────────────────────── //
// X, Plus, GripVertical, Check imported from lucide-react above

// ── Leaf index map ────────────────────────────────────────────────────────────

const buildLeafIndexMap = (nodes: IngredientNode[]): Map<string, number> => {
  const map = new Map<string, number>()
  let n = 0
  const walk = (ns: IngredientNode[]) => {
    for (const node of ns) {
      if (node.kind === 'leaf') {
        if (node.id) map.set(node.id, n++)
      } else walk(node.children)
    }
  }
  walk(nodes)
  return map
}

// ── Drag handle context ───────────────────────────────────────────────────────

type DragHandleContextValue = {
  listeners?: Record<string, React.EventHandler<React.SyntheticEvent>>
  attributes?: Record<string, unknown>
}
const DragHandleCtx = createContext<DragHandleContextValue>({})

const SortableItem = ({ id, children }: { id: string; children: React.ReactNode }) => {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id,
  })
  return (
    <DragHandleCtx.Provider value={{ listeners, attributes }}>
      <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}>
        {isDragging ? <div style={{ height: 38, opacity: 0 }} /> : children}
      </div>
    </DragHandleCtx.Provider>
  )
}

const GripHandle = ({ style }: { style?: React.CSSProperties }) => {
  const { listeners, attributes } = useContext(DragHandleCtx)
  return (
    <div
      {...listeners}
      {...attributes}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'grab',
        color: 'var(--stone-2)',
        padding: '0 4px',
        touchAction: 'none',
        flexShrink: 0,
        ...style,
      }}
    >
      <GripVertical size={12} />
    </div>
  )
}

// ── Ingredient option type ────────────────────────────────────────────────────

type IngredientOption = {
  id: string
  text: string
}

// ── Leaf row ─────────────────────────────────────────────────────────────────

type LeafRowProps = {
  node: IngredientNode & { kind: 'leaf' }
  path: number[]
  isOnly: boolean
  isLast: boolean
  allNodes: IngredientNode[]
  labels: EditorLabels
  onChange: (nodes: IngredientNode[]) => void
  ingredientOptions?: IngredientOption[]
  ordered?: boolean
  itemIndex?: number
  leafIndexMap?: Map<string, number>
  reordering?: boolean
}

const LeafRow = ({
  node,
  path,
  isOnly,
  isLast,
  allNodes,
  labels,
  onChange,
  ingredientOptions,
  ordered,
  itemIndex,
  leafIndexMap,
  reordering,
}: LeafRowProps) => {
  const [pickerOpen, setPickerOpen] = useState(false)
  const selectedIds = new Set(node.ingredientRefs ?? [])
  const selectedIngredients = ingredientOptions?.filter((opt) => selectedIds.has(opt.id)) ?? []

  const toggleIngredient = (id: string) => {
    const cur = node.ingredientRefs ?? []
    const newRefs = selectedIds.has(id) ? cur.filter((r) => r !== id) : [...cur, id]
    onChange(
      replaceAt(allNodes, path, {
        ...node,
        ingredientRefs: newRefs.length > 0 ? newRefs : undefined,
      }),
    )
  }

  const refsPanel = ordered && (
    <div style={{ marginBottom: 5 }}>
      {selectedIngredients.length === 0 ? (
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          style={{
            background: 'none',
            border: 0,
            fontSize: 10,
            color: 'rgba(107,31,42,0.45)',
            cursor: 'pointer',
            padding: 0,
            fontFamily: 'var(--mono)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            display: 'block',
            textAlign: 'left',
            lineHeight: 'normal',
          }}
        >
          + ingrediënten
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          style={{
            background: 'none',
            border: 0,
            padding: 0,
            cursor: 'pointer',
            display: 'block',
            textAlign: 'left',
            fontFamily: 'var(--mono)',
            fontSize: 10,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(107,31,42,0.55)',
            lineHeight: 'normal',
            width: '100%',
          }}
        >
          {selectedIngredients.map((o, i) => (
            <span key={o.id}>
              {i > 0 ? ' · ' : ''}
              {o.text}
            </span>
          ))}
        </button>
      )}
      <IngredientPickerSheet
        visible={pickerOpen}
        selectedIds={selectedIds}
        options={ingredientOptions ?? []}
        onToggle={toggleIngredient}
        onClose={() => setPickerOpen(false)}
      />
    </div>
  )

  return (
    <div style={{ borderBottom: isLast ? 'none' : '0.5px solid var(--line-soft)' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: ordered ? 8 : 6,
          padding: ordered ? '8px 0' : '6px 0',
        }}
      >
        {ordered ? (
          // Steps: grip slides in alongside the number — animate width so layout shifts smoothly
          <motion.div
            animate={{ width: reordering ? 24 : 0, opacity: reordering ? 1 : 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            style={{ overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'flex-start' }}
          >
            <GripHandle style={{ paddingTop: 7 }} />
          </motion.div>
        ) : (
          // Ingredients: dot ↔ grip crossfade in a fixed-size slot — no layout shift at all
          <div style={{ position: 'relative', width: 20, flexShrink: 0, paddingTop: 12 }}>
            <motion.div
              animate={{ opacity: reordering ? 1 : 0 }}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                top: 12,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
              }}
            >
              <GripHandle />
            </motion.div>
            <motion.span
              animate={{ opacity: reordering ? 0 : 1 }}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
              style={{
                color: 'var(--bordeaux)',
                fontSize: 11,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
              }}
            >
              •
            </motion.span>
          </div>
        )}

        {ordered && (
          <span
            style={{
              fontFamily: 'var(--serif)',
              fontStyle: 'italic',
              fontSize: 22,
              color: 'var(--bordeaux)',
              fontWeight: 500,
              width: 22,
              flexShrink: 0,
              lineHeight: 1.1,
              paddingTop: 1,
            }}
          >
            {(leafIndexMap?.get(node.id ?? '') ?? itemIndex ?? 0) + 1}
          </span>
        )}

        {ordered ? (
          <div style={{ flex: 1, minWidth: 0 }}>
            {refsPanel}
            <AutoGrowTextarea
              value={node.text}
              onChange={(e) =>
                onChange(replaceAt(allNodes, path, { ...node, text: e.target.value }))
              }
              rows={1}
              style={{
                ...leafInputStyle,
                flex: 'none',
                width: '100%',
                boxSizing: 'border-box',
                lineHeight: 1.5,
                padding: '0 4px 0 0',
              }}
              placeholder={labels.leafPlaceholder}
            />
          </div>
        ) : (
          <AutoGrowTextarea
            value={node.text}
            onChange={(e) => onChange(replaceAt(allNodes, path, { ...node, text: e.target.value }))}
            rows={1}
            style={{ ...leafInputStyle, flex: 1, width: '100%' }}
            placeholder={labels.leafPlaceholder}
          />
        )}

        {!isOnly && (
          <button
            type="button"
            onClick={() => onChange(removeAt(allNodes, path))}
            style={{ ...xBtn, marginTop: ordered ? 0 : 6 }}
            aria-label="Verwijderen"
          >
            <X size={11} strokeWidth={2.2} />
          </button>
        )}
      </div>
    </div>
  )
}

// ── Group row ────────────────────────────────────────────────────────────────

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

// ── Drag overlay ──────────────────────────────────────────────────────────────

const OverlayContent = ({
  node,
  ordered,
  leafIndexMap,
}: {
  node: IngredientNode
  ordered?: boolean
  leafIndexMap?: Map<string, number>
}) => {
  const overlayStyle: React.CSSProperties = {
    background: 'var(--cream-card)',
    borderRadius: 10,
    boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
    border: '0.5px solid rgba(31,29,26,0.12)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 12px 6px 8px',
  }

  if (node.kind === 'group') {
    return (
      <div style={overlayStyle}>
        <GripVertical size={12} />
        <span
          style={{
            fontFamily: 'var(--serif)',
            fontStyle: 'italic',
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--bordeaux)',
          }}
        >
          {node.title || 'Sectie'}
        </span>
      </div>
    )
  }

  const num = ordered && node.id ? (leafIndexMap?.get(node.id) ?? 0) + 1 : null
  return (
    <div style={{ ...overlayStyle, gap: ordered ? 14 : 8 }}>
      <GripVertical size={12} />
      {ordered ? (
        <span
          style={{
            fontFamily: 'var(--serif)',
            fontStyle: 'italic',
            fontSize: 22,
            color: 'var(--bordeaux)',
            fontWeight: 500,
            width: 22,
            flexShrink: 0,
            lineHeight: 1.1,
          }}
        >
          {num}
        </span>
      ) : (
        <span
          style={{
            color: 'var(--bordeaux)',
            fontFamily: 'var(--serif)',
            fontSize: 16,
            paddingLeft: 4,
          }}
        >
          ·
        </span>
      )}
      <span style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink-2)' }}>
        {node.text || '…'}
      </span>
    </div>
  )
}

// ── Public component ──────────────────────────────────────────────────────────

type RecipeNodeEditorProps = {
  nodes: IngredientNode[]
  onChange: (nodes: IngredientNode[]) => void
  labels?: Partial<EditorLabels>
  commonSections?: string[]
  ingredientOptions?: IngredientOption[]
  leafMultiline?: boolean
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

  const existingTitles = collectGroupTitles(nodes)
  const availableSections = commonSections?.filter((name) => !existingTitles.has(name)) ?? []
  const leafIndexMap = ordered ? buildLeafIndexMap(nodes) : undefined
  const rootIds = nodes.map((n) => n.id!)
  const activeNode = activeId ? findNode(nodes, activeId) : null

  let rootLeafCounter = 0

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={(args) => {
        const hits = pointerWithin(args)
        return hits.length > 0 ? hits : closestCenter(args)
      }}
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
          <button
            type="button"
            onClick={() => onChange([...nodes, newLeaf()])}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 12px',
              border: '1px dashed var(--stone-2)',
              borderRadius: 9,
              color: 'var(--stone)',
              fontSize: 12,
              background: 'none',
              cursor: 'pointer',
              minHeight: 38,
              fontFamily: 'var(--sans)',
            }}
          >
            <Plus size={11} strokeWidth={2.5} />
            {labels.addLeaf}
          </button>
          <button
            type="button"
            onClick={() => addSection('')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 12px',
              border: '1px dashed var(--stone-2)',
              borderRadius: 9,
              color: 'var(--stone)',
              fontSize: 12,
              background: 'none',
              cursor: 'pointer',
              minHeight: 38,
              fontFamily: 'var(--sans)',
            }}
          >
            <Plus size={11} strokeWidth={2.5} />
            {labels.addGroup}
          </button>

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
          <OverlayContent node={activeNode} ordered={ordered} leafIndexMap={leafIndexMap} />
        )}
      </DragOverlay>
    </DndContext>
  )
}

export default RecipeNodeEditor
