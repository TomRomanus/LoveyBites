import { arrayMove } from '@dnd-kit/sortable'
import { produce } from 'immer'
import type { IngredientNode } from '@/features/recipe/types/recipe'

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

export const findNode = (nodes: IngredientNode[], id: string): IngredientNode | null => {
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

export const moveNodeInTree = (
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
