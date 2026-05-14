import { createContext, useContext } from 'react'
import { GripVertical } from 'lucide-react'
import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core'

type DragHandleContextValue = {
  listeners?: DraggableSyntheticListeners
  attributes?: DraggableAttributes
}

export const DragHandleCtx = createContext<DragHandleContextValue>({})

export const GripHandle = ({ className }: { className?: string }) => {
  const { listeners, attributes } = useContext(DragHandleCtx)
  return (
    <div
      {...listeners}
      {...attributes}
      className={`flex items-center justify-center cursor-grab text-stone-2 px-1 touch-none select-none shrink-0${className ? ` ${className}` : ''}`}
    >
      <GripVertical size={20} />
    </div>
  )
}
