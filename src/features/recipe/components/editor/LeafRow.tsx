import { useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { replaceAt, removeAt } from '@/features/recipe/components/editor/nodeTree'
import { GripHandle } from '@/features/recipe/components/editor/GripHandle'
import IngredientPickerSheet from '@/features/recipe/components/editor/IngredientPickerSheet'
import AutoGrowTextarea from '@/shared/components/AutoGrowTextarea'
import type { IngredientNode } from '@/features/recipe/types/recipe'

export type EditorLabels = {
  leafPlaceholder: string
  groupPlaceholder: string
  addLeafInGroup: string
  addLeaf: string
  addGroup: string
}

export type IngredientOption = {
  id: string
  text: string
}

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

export default LeafRow
