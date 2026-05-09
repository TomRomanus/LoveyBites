import { useState, useMemo, useCallback } from 'react'
import {
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  pointerWithin,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import type { IngredientNode } from '@/features/recipe/types/recipe'
import { collectGroupTitles, buildLeafIndexMap } from '@/features/recipe/components/editor/nodeTree'
import { moveNodeInTree } from '@/features/recipe/components/editor/dndTree'

type UseNodeEditorProps = {
  nodes: IngredientNode[]
  onChange: (nodes: IngredientNode[]) => void
  commonSections?: string[]
  ordered?: boolean
}

export const useNodeEditor = ({ nodes, onChange, commonSections, ordered }: UseNodeEditorProps) => {
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  )

  const handleDragStart = useCallback(({ active }: DragStartEvent) => {
    setActiveId(active.id as string)
  }, [])

  const handleDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      setActiveId(null)
      if (!over || active.id === over.id) return
      onChange(moveNodeInTree(nodes, active.id as string, over.id as string))
    },
    [nodes, onChange],
  )

  const handleDragCancel = useCallback(() => {
    setActiveId(null)
  }, [])

  const collisionDetection = useCallback<typeof closestCenter>((args) => {
    const hits = pointerWithin(args)
    return hits.length > 0 ? hits : closestCenter(args)
  }, [])

  const existingTitles = useMemo(() => collectGroupTitles(nodes), [nodes])

  const leafIndexMap = useMemo(
    () => (ordered ? buildLeafIndexMap(nodes) : undefined),
    [ordered, nodes],
  )

  const availableSections = useMemo(
    () => commonSections?.filter((name) => !existingTitles.has(name)) ?? [],
    [commonSections, existingTitles],
  )

  return {
    sensors,
    activeId,
    collisionDetection,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
    existingTitles,
    leafIndexMap,
    availableSections,
  }
}
