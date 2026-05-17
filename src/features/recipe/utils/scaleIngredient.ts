import type { IngredientNode } from '@/features/recipe/types/recipe'
import { COOKING_FRACTIONS, VOLUME_UNIT } from '@/features/recipe/utils/ingredientUtils'

const parseFraction = (s: string): number => {
  const normalized = s.replace(',', '.')
  const mixed = normalized.match(/^(\d+)\s+(\d+)\/(\d+)$/)
  if (mixed) return parseInt(mixed[1]) + parseInt(mixed[2]) / parseInt(mixed[3])
  const frac = normalized.match(/^(\d+)\/(\d+)$/)
  if (frac) return parseInt(frac[1]) / parseInt(frac[2])
  return parseFloat(normalized)
}

const formatNumber = (n: number, useFraction = false): string => {
  const rounded = Math.round(n * 1e6) / 1e6
  if (Number.isInteger(rounded)) return String(rounded)
  const whole = Math.floor(rounded)
  const frac = rounded - whole
  if (useFraction) {
    for (const [num, den] of COOKING_FRACTIONS) {
      if (Math.abs(frac - num / den) < 0.01) {
        const str = `${num}/${den}`
        return whole === 0 ? str : `${whole} ${str}`
      }
    }
    // No exact match — round to nearest cooking fraction
    let bestNum = 0, bestDen = 1, bestDiff = frac
    for (const [num, den] of COOKING_FRACTIONS) {
      const diff = Math.abs(frac - num / den)
      if (diff < bestDiff) { bestDiff = diff; bestNum = num; bestDen = den }
    }
    if (1 - frac < bestDiff) return String(whole + 1)
    if (bestNum === 0) return String(whole)
    const str = `${bestNum}/${bestDen}`
    return whole === 0 ? str : `${whole} ${str}`
  }
  const oneDecimal = rounded.toFixed(1)
  if (oneDecimal.endsWith('.0')) return String(Math.round(rounded))
  return oneDecimal.replace('.', ',')
}

const LEADING_NUMBER = /^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?)/

/** Scale a single ingredient text string by the given ratio. */
export const scaleIngredientText = (text: string, ratio: number): string => {
  const match = text.match(LEADING_NUMBER)
  if (!match) return text
  const scaled = parseFraction(match[1]) * ratio
  const rest = text.slice(match[0].length)
  return formatNumber(scaled, VOLUME_UNIT.test(rest.trimStart())) + rest
}

export const scaleIngredients = (nodes: IngredientNode[], ratio: number): IngredientNode[] =>
  nodes.map((node) =>
    node.kind === 'leaf'
      ? { ...node, text: scaleIngredientText(node.text, ratio) }
      : { ...node, children: scaleIngredients(node.children, ratio) },
  )

/** Scale the ingredientAmounts values in a step tree by the given ratio. */
export const scaleStepAmounts = (
  nodes: IngredientNode[],
  ratio: number,
  ingredientMap?: Map<string, string>,
): IngredientNode[] => {
  return nodes.map((node) => {
    if (node.kind === 'leaf') {
      if (!node.ingredientAmounts) return node
      const scaledAmounts: Record<string, string> = {}
      for (const [id, amt] of Object.entries(node.ingredientAmounts)) {
        const num = parseFraction(amt.trim())
        if (isNaN(num)) {
          scaledAmounts[id] = amt
          continue
        }
        const ingredientText = ingredientMap?.get(id) ?? ''
        const match = ingredientText.match(LEADING_NUMBER)
        const unitRest = match ? ingredientText.slice(match[0].length).trimStart() : ''
        scaledAmounts[id] = formatNumber(num * ratio, !unitRest || VOLUME_UNIT.test(unitRest))
      }
      return { ...node, ingredientAmounts: scaledAmounts }
    }
    return { ...node, children: scaleStepAmounts(node.children, ratio, ingredientMap) }
  })
}
