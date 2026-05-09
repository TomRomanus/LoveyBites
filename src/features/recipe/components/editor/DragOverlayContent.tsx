import { GripVertical } from 'lucide-react'
import type { IngredientNode } from '@/features/recipe/types/recipe'

type DragOverlayContentProps = {
  node: IngredientNode
  ordered?: boolean
  leafIndexMap?: Map<string, number>
}

const DragOverlayContent = ({ node, ordered, leafIndexMap }: DragOverlayContentProps) => {
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

export default DragOverlayContent
