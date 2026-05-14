import { GripVertical } from 'lucide-react'
import type { IngredientNode } from '@/features/recipe/types/recipe'

type DragOverlayContentProps = {
  node: IngredientNode
  ordered?: boolean
  leafIndexMap?: Map<string, number>
}

const DragOverlayContent = ({ node, ordered, leafIndexMap }: DragOverlayContentProps) => {
  const overlayCls =
    'bg-cream rounded-[10px] shadow-[0_8px_24px_rgba(0,0,0,0.14)] border-[0.5px] border-ink/12 flex items-center gap-2 py-1.5 pr-3 pl-2'

  if (node.kind === 'group') {
    return (
      <div className={overlayCls}>
        <GripVertical size={12} />
        <span className="font-serif italic text-[13px] font-medium text-bordeaux">
          {node.title || 'Sectie'}
        </span>
      </div>
    )
  }

  const num = ordered && node.id ? (leafIndexMap?.get(node.id) ?? 0) + 1 : null
  return (
    <div className={overlayCls}>
      <GripVertical size={12} />
      {ordered && (
        <span className="font-serif italic text-[22px] text-bordeaux font-medium w-[22px] shrink-0 leading-[1.1]">
          {num}
        </span>
      )}
      <span className="font-sans text-[14px] text-ink-2">{node.text || '…'}</span>
    </div>
  )
}

export default DragOverlayContent
