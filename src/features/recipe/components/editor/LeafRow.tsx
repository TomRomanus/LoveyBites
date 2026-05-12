import { useMemo, useState } from 'react'
import { X, MessageCircleHeart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { replaceAt, removeAt } from '@/features/recipe/components/editor/nodeTree'
import {
  parseIngredientText,
  parseAmount,
  formatAmount,
  collectUsedAmounts,
  normalizeStepAmount,
  VOLUME_UNIT,
} from '@/features/recipe/utils/ingredientUtils'
import IngredientGripToggle from '@/features/recipe/components/editor/IngredientGripToggle'
import IngredientPickerSection from '@/features/recipe/components/editor/IngredientPickerSection'
import IngredientInputField from '@/features/recipe/components/editor/IngredientInputField'
import StepCommentBox from '@/features/recipe/components/editor/StepCommentBox'
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

const xBtnCls =
  'bg-none border-0 text-stone-2 p-1.5 cursor-pointer shrink-0 flex items-center justify-center opacity-80'

export type LeafEdgeFlags = {
  isOnly: boolean
  isLast: boolean
  ordered: boolean
  reordering: boolean
  shouldFocus: boolean
}

type LeafRowProps = {
  node: IngredientNode & { kind: 'leaf' }
  path: number[]
  flags: LeafEdgeFlags
  allNodes: IngredientNode[]
  labels: EditorLabels
  onChange: (nodes: IngredientNode[]) => void
  ingredientOptions?: IngredientOption[]
  itemIndex?: number
  leafIndexMap?: Map<string, number>
}

const LeafRow = ({
  node,
  path,
  flags,
  allNodes,
  labels,
  onChange,
  ingredientOptions,
  itemIndex,
  leafIndexMap,
}: LeafRowProps) => {
  const { isOnly, isLast, ordered, reordering, shouldFocus } = flags
  const [pickerOpen, setPickerOpen] = useState(false)
  const [commentOpen, setCommentOpen] = useState(!!node.comment)
  const [commentAutoFocus, setCommentAutoFocus] = useState(false)
  const selectedIds = useMemo(() => new Set(node.ingredientRefs ?? []), [node.ingredientRefs])
  const selectedIngredients = ingredientOptions?.filter((opt) => selectedIds.has(opt.id)) ?? []
  const amounts = node.ingredientAmounts ?? {}

  const usedElsewhere = useMemo(
    () => (ordered ? collectUsedAmounts(allNodes, node.id ?? '', ingredientOptions ?? []) : {}),
    [ordered, allNodes, node.id, ingredientOptions],
  )

  const remainingDefault = useMemo(() => {
    return (id: string, text: string): string => {
      const { amount, maxLabel } = parseIngredientText(text)
      const used = usedElsewhere[id] ?? 0
      if (used === 0) return amount
      const maxNum = parseAmount(amount)
      if (isNaN(maxNum)) return amount
      const rem = Math.max(0, maxNum - used)
      const unit = maxLabel.slice(amount.length).trim().toLowerCase()
      const useFractions = amount.includes('/') || VOLUME_UNIT.test(unit)
      return useFractions
        ? formatAmount(rem)
        : rem % 1 === 0
          ? String(rem)
          : parseFloat(rem.toFixed(6)).toString()
    }
  }, [usedElsewhere])

  const fullyAssignedIds = useMemo(() => {
    const ids = new Set<string>()
    for (const opt of ingredientOptions ?? []) {
      if (selectedIds.has(opt.id)) continue
      const maxNum = parseAmount(parseIngredientText(opt.text).amount)
      if (!isNaN(maxNum) && maxNum > 0 && (usedElsewhere[opt.id] ?? 0) >= maxNum) {
        ids.add(opt.id)
      }
    }
    return ids
  }, [ingredientOptions, selectedIds, usedElsewhere])

  const remainingAmounts = useMemo(() => {
    const result: Record<string, string> = {}
    for (const opt of ingredientOptions ?? []) {
      result[opt.id] = remainingDefault(opt.id, opt.text)
    }
    return result
  }, [ingredientOptions, remainingDefault])

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
      onChange(
        replaceAt(allNodes, path, { ...base, ingredientAmounts: { ...amounts, ...normalized } }),
      )
    }
    setPickerOpen(false)
  }

  return (
    <div className={isLast ? '' : 'border-b-[0.5px] border-ink/14'}>
      <div
        className={`flex items-start ${ordered ? `gap-2 pt-2 ${commentOpen ? 'pb-0' : 'pb-2'}` : 'gap-[3px]'}`}
      >
        <IngredientGripToggle ordered={ordered} reordering={reordering} />

        {ordered && (
          <div className="flex flex-col shrink-0 gap-[8px] mt-[-3px] w-[22px]">
            <span className="font-serif italic text-[22px] text-bordeaux font-medium leading-[1.1] text-right block">
              {(leafIndexMap?.get(node.id ?? '') ?? itemIndex ?? 0) + 1}
            </span>
            <button
              type="button"
              aria-label="Opmerking toevoegen"
              onClick={() => {
                const opening = !commentOpen
                setCommentAutoFocus(opening)
                setCommentOpen(opening)
              }}
              className={cn(
                'border-0 bg-transparent p-0 cursor-pointer flex items-center justify-end w-full',
                commentOpen ? 'text-honey-700/75' : 'text-stone-2/50',
              )}
            >
              <MessageCircleHeart size={16} strokeWidth={1.5} />
            </button>
          </div>
        )}

        {ordered ? (
          <div className="flex-1 min-w-0 ml-[12px]">
            <IngredientPickerSection
              selectedIngredients={selectedIngredients}
              amounts={amounts}
              pickerOpen={pickerOpen}
              selectedIds={selectedIds}
              disabledIds={fullyAssignedIds}
              options={ingredientOptions ?? []}
              remainingAmounts={remainingAmounts}
              onOpenPicker={() => setPickerOpen(true)}
              onToggle={toggleIngredient}
              onAmountChange={changeAmount}
              onClose={handlePickerClose}
            />
            <IngredientInputField
              value={node.text}
              ordered={true}
              autoFocus={shouldFocus}
              placeholder={labels.leafPlaceholder}
              onChange={(text) => onChange(replaceAt(allNodes, path, { ...node, text }))}
            />
          </div>
        ) : (
          <IngredientInputField
            value={node.text}
            ordered={false}
            autoFocus={shouldFocus}
            placeholder={labels.leafPlaceholder}
            onChange={(text) => onChange(replaceAt(allNodes, path, { ...node, text }))}
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
          autoFocus={commentAutoFocus}
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
