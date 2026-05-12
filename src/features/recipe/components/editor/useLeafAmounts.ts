import { useMemo } from 'react'
import {
  parseIngredientText,
  parseAmount,
  formatAmount,
  collectUsedAmounts,
  VOLUME_UNIT,
} from '@/features/recipe/utils/ingredientUtils'
import type { IngredientNode } from '@/features/recipe/types/recipe'
import type { IngredientOption } from './LeafRow'

export const useLeafAmounts = (
  node: IngredientNode & { kind: 'leaf' },
  allNodes: IngredientNode[],
  ingredientOptions: IngredientOption[] | undefined,
  ordered: boolean,
  selectedIds: Set<string>,
) => {
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

  return { remainingDefault, fullyAssignedIds, remainingAmounts }
}
