import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, MessageCircleHeart } from 'lucide-react'
import { replaceAt, removeAt } from '@/features/recipe/components/editor/nodeTree'
import { parseIngredientText, parseAmount, formatAmount, formatStepIngredient, collectUsedAmounts, normalizeStepAmount, VOLUME_UNIT } from '@/features/recipe/utils/ingredientUtils'
import { GripHandle } from '@/features/recipe/components/editor/GripHandle'
import IngredientPickerSheet from '@/features/recipe/components/editor/IngredientPickerSheet'
import AutoGrowTextarea from '@/shared/components/AutoGrowTextarea'
import StepCommentBox from '@/features/recipe/components/editor/StepCommentBox'
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
  const [commentOpen, setCommentOpen] = useState(!!node.comment)
  const selectedIds = new Set(node.ingredientRefs ?? [])
  const selectedIngredients = ingredientOptions?.filter((opt) => selectedIds.has(opt.id)) ?? []
  const amounts = node.ingredientAmounts ?? {}

  const usedElsewhere = ordered
    ? collectUsedAmounts(allNodes, node.id ?? '', ingredientOptions ?? [])
    : {}

  // Return the remaining available amount for an ingredient as a display string
  const remainingDefault = (id: string, text: string): string => {
    const { amount, maxLabel } = parseIngredientText(text)
    const used = usedElsewhere[id] ?? 0
    if (used === 0) return amount
    const maxNum = parseAmount(amount)
    if (isNaN(maxNum)) return amount
    const rem = Math.max(0, maxNum - used)
    const unit = maxLabel.slice(amount.length).trim().toLowerCase()
    const useFractions = amount.includes('/') || VOLUME_UNIT.test(unit)
    return useFractions ? formatAmount(rem) : rem % 1 === 0 ? String(rem) : parseFloat(rem.toFixed(6)).toString()
  }

  // Ingredients fully consumed by other steps — visible but not selectable in this step
  const fullyAssignedIds = new Set<string>()
  for (const opt of ingredientOptions ?? []) {
    if (selectedIds.has(opt.id)) continue
    const maxNum = parseAmount(parseIngredientText(opt.text).amount)
    if (!isNaN(maxNum) && maxNum > 0 && (usedElsewhere[opt.id] ?? 0) >= maxNum) {
      fullyAssignedIds.add(opt.id)
    }
  }

  // Remaining amounts to prefill/placeholder the amounts tab inputs
  const remainingAmounts: Record<string, string> = {}
  for (const opt of ingredientOptions ?? []) {
    remainingAmounts[opt.id] = remainingDefault(opt.id, opt.text)
  }

  const toggleIngredient = (id: string) => {
    const cur = node.ingredientRefs ?? []
    const isRemoving = selectedIds.has(id)
    const newRefs = isRemoving ? cur.filter((r) => r !== id) : [...cur, id]
    const newAmounts = { ...amounts }
    if (isRemoving) {
      delete newAmounts[id]
    } else {
      const fullText = ingredientOptions?.find((o) => o.id === id)?.text ?? ''
      newAmounts[id] = remainingDefault(id, fullText)
    }
    const { ingredientRefs: _ir, ingredientAmounts: _ia, ...base } = node
    onChange(
      replaceAt(allNodes, path, {
        ...base,
        ...(newRefs.length > 0 ? { ingredientRefs: newRefs } : {}),
        ...(Object.keys(newAmounts).length > 0 ? { ingredientAmounts: newAmounts } : {}),
      }),
    )
  }

  const changeAmount = (id: string, amount: string) => {
    const newAmounts = { ...amounts, [id]: amount }
    const { ingredientAmounts: _ia, ...base } = node
    onChange(replaceAt(allNodes, path, { ...base, ingredientAmounts: newAmounts }))
  }

  const handlePickerClose = () => {
    const normalized: Record<string, string> = {}
    let anyChange = false
    for (const [id, amt] of Object.entries(amounts)) {
      const fullText = ingredientOptions?.find((o) => o.id === id)?.text ?? ''
      const norm = normalizeStepAmount(amt, fullText)
      normalized[id] = norm
      if (norm !== amt) anyChange = true
    }
    if (anyChange) {
      const { ingredientAmounts: _ia, ...base } = node
      onChange(replaceAt(allNodes, path, { ...base, ingredientAmounts: { ...amounts, ...normalized } }))
    }
    setPickerOpen(false)
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
              {formatStepIngredient(o.text, amounts[o.id] ?? '')}
            </span>
          ))}
        </button>
      )}
      <IngredientPickerSheet
        visible={pickerOpen}
        selectedIds={selectedIds}
        disabledIds={fullyAssignedIds}
        options={ingredientOptions ?? []}
        amounts={amounts}
        remainingAmounts={remainingAmounts}
        onToggle={toggleIngredient}
        onAmountChange={changeAmount}
        onClose={handlePickerClose}
      />
    </div>
  )

  return (
    <div className={isLast ? '' : 'border-b-[0.5px] border-ink/14'}>
      <div className={`flex items-start ${ordered ? `gap-2 pt-2 ${commentOpen ? 'pb-0' : 'pb-2'}` : 'gap-[3px]'}`}>
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
          <div className="flex flex-col shrink-0 gap-[8px] mt-[-3px] w-[22px]">
            <span className="font-serif italic text-[22px] text-bordeaux font-medium leading-[1.1] text-right block">
              {(leafIndexMap?.get(node.id ?? '') ?? itemIndex ?? 0) + 1}
            </span>
            <button
              type="button"
              aria-label="Opmerking toevoegen"
              onClick={() => setCommentOpen((o) => !o)}
              className={cn(
                'border-0 bg-transparent p-0 cursor-pointer flex items-center justify-end w-full',
                commentOpen ? 'text-honey-700/75' : 'text-stone-2',
              )}
            >
              <MessageCircleHeart size={16} strokeWidth={1.5} />
            </button>
          </div>
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

      {ordered && (
        <StepCommentBox
          open={commentOpen}
          node={node}
          allNodes={allNodes}
          path={path}
          onChange={onChange}
          onDismiss={() => setCommentOpen(false)}
        />
      )}
    </div>
  )
}

export default LeafRow
