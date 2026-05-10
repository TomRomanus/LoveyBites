import { useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { replaceAt, removeAt } from '@/features/recipe/components/editor/nodeTree'
import { GripHandle } from '@/features/recipe/components/editor/GripHandle'
import IngredientPickerSheet from '@/features/recipe/components/editor/IngredientPickerSheet'
import AutoGrowTextarea from '@/shared/components/AutoGrowTextarea'
import type { IngredientNode } from '@/features/recipe/types/recipe'
import { cn } from '@/lib/utils'

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

const leafInputCls =
  'flex-1 bg-transparent border-0 outline-none font-sans text-[14px] text-ink px-1 py-[10px] resize-none leading-[1.45]'
const xBtnCls =
  'bg-none border-0 text-stone-2 p-1.5 cursor-pointer shrink-0 flex items-center justify-center opacity-80'

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
  shouldFocus?: boolean
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
  shouldFocus,
}: LeafRowProps) => {
  const [pickerOpen, setPickerOpen] = useState(false)
  const selectedIds = new Set(node.ingredientRefs ?? [])
  const selectedIngredients = ingredientOptions?.filter((opt) => selectedIds.has(opt.id)) ?? []

  const toggleIngredient = (id: string) => {
    const cur = node.ingredientRefs ?? []
    const newRefs = selectedIds.has(id) ? cur.filter((r) => r !== id) : [...cur, id]
    const { ingredientRefs: _ingredientRefs, ...nodeWithoutRefs } = node
    onChange(
      replaceAt(
        allNodes,
        path,
        newRefs.length > 0 ? { ...nodeWithoutRefs, ingredientRefs: newRefs } : nodeWithoutRefs,
      ),
    )
  }

  const refsPanel = ordered && (
    <div className="mb-[5px]">
      {selectedIngredients.length === 0 ? (
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="bg-none border-0 text-[10px] text-bordeaux/45 cursor-pointer p-0 font-mono tracking-[0.08em] uppercase block text-left leading-normal"
        >
          + ingrediënten
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="bg-none border-0 p-0 cursor-pointer block text-left font-mono text-[10px] tracking-[0.08em] uppercase text-bordeaux/55 leading-normal w-full"
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
    <div className={isLast ? '' : 'border-b-[0.5px] border-ink/14'}>
      <div className={`flex items-start ${ordered ? 'gap-2 py-2' : 'gap-[3px]'}`}>
        {ordered ? (
          // Steps: grip slides in alongside the number — animate width so layout shifts smoothly
          <motion.div
            animate={{ width: reordering ? 24 : 0, opacity: reordering ? 1 : 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            className="overflow-hidden shrink-0 flex items-start"
          >
            <GripHandle className="pt-[7px]" />
          </motion.div>
        ) : (
          // Ingredients: dot ↔ grip crossfade in a fixed-size slot — no layout shift at all
          // overflow-hidden + width animation (not opacity) ensures the hidden grip has zero
          // pointer-event area, preventing scroll conflicts on mobile
          <div className="relative shrink-0 pt-[13px]">
            <motion.div
              animate={{ width: reordering ? 20 : 0, opacity: reordering ? 1 : 0 }}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
              className="absolute top-[14px] left-0 bottom-0 overflow-hidden flex"
            >
              <GripHandle />
            </motion.div>
            <motion.span
              animate={{ opacity: reordering ? 0 : 1 }}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
              className="text-bordeaux text-[11px] flex items-center justify-center leading-none pointer-events-none"
            >
              •
            </motion.span>
          </div>
        )}

        {ordered && (
          <span className="font-serif italic text-[22px] text-bordeaux font-medium w-[22px] shrink-0 leading-[1.1] pt-[1px] text-right">
            {(leafIndexMap?.get(node.id ?? '') ?? itemIndex ?? 0) + 1}
          </span>
        )}

        {ordered ? (
          <div className="flex-1 min-w-0 ml-[12px]">
            {refsPanel}
            <AutoGrowTextarea
              value={node.text}
              onChange={(e) =>
                onChange(replaceAt(allNodes, path, { ...node, text: e.target.value }))
              }
              rows={1}
              autoFocus={shouldFocus}
              className={cn(
                leafInputCls,
                'flex-none w-full box-border leading-[1.5] py-0 pr-1 pl-0',
              )}
              placeholder={labels.leafPlaceholder}
            />
          </div>
        ) : (
          <AutoGrowTextarea
            value={node.text}
            onChange={(e) => onChange(replaceAt(allNodes, path, { ...node, text: e.target.value }))}
            rows={1}
            autoFocus={shouldFocus}
            className={`${leafInputCls} flex-1 w-full !pt-[9px] !pb-[11px]`}
            placeholder={labels.leafPlaceholder}
          />
        )}

        {!isOnly && (
          <button
            type="button"
            onClick={() => onChange(removeAt(allNodes, path))}
            className={`${xBtnCls} ${ordered ? 'mt-0' : 'mt-[7px]'}`}
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
