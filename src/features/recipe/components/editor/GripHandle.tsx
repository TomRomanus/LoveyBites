import { createContext, useContext } from 'react'
import { GripVertical } from 'lucide-react'

export type DragHandleContextValue = {
  listeners?: Record<string, React.EventHandler<React.SyntheticEvent>>
  attributes?: Record<string, unknown>
}

export const DragHandleCtx = createContext<DragHandleContextValue>({})

export const GripHandle = ({ style }: { style?: React.CSSProperties }) => {
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
