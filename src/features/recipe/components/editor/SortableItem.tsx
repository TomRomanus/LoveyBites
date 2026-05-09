import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DragHandleCtx } from '@/features/recipe/components/editor/GripHandle'

const SortableItem = ({ id, children }: { id: string; children: React.ReactNode }) => {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id,
  })
  return (
    <DragHandleCtx.Provider value={{ listeners, attributes }}>
      <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}>
        {isDragging ? <div className="h-[38px] opacity-0" /> : children}
      </div>
    </DragHandleCtx.Provider>
  )
}

export default SortableItem
