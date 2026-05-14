import type { IngredientNode } from '@/features/recipe/types/recipe'

/** Matches the unit portion of a volume/fractional ingredient (e.g. "el", "tbsp", "cups"). */
export const VOLUME_UNIT =
  /^(cups?|c\.|tbsp?\.?|tbs\.?|tablespoons?|tsp\.?|teaspoons?|kop(?:jes?|pen)?|el|tl|eetlepels?|theelepels?)\b/i

export const COOKING_FRACTIONS: [number, number][] = [
  [1, 8],
  [1, 4],
  [1, 3],
  [3, 8],
  [1, 2],
  [5, 8],
  [2, 3],
  [3, 4],
  [7, 8],
]

/** Recursively collect all leaf text values from an ingredient/step tree. */
export const extractLeafTexts = (nodes: IngredientNode[]): string[] =>
  nodes.flatMap((n) => (n.kind === 'leaf' ? [n.text] : extractLeafTexts(n.children)))

/** Ensure every leaf and group node has a unique id, assigning one if missing. */
export const ensureIngredientIds = (nodes: IngredientNode[]): IngredientNode[] =>
  nodes.map((node) => {
    if (node.kind === 'leaf') return node.id ? node : { ...node, id: crypto.randomUUID() }
    return {
      ...node,
      id: node.id ?? crypto.randomUUID(),
      children: ensureIngredientIds(node.children),
    }
  })

/** Remove empty leaf nodes and groups with no remaining children. */
export const pruneEmpty = (nodes: IngredientNode[]): IngredientNode[] =>
  nodes
    .map((n) => (n.kind === 'leaf' ? n : { ...n, children: pruneEmpty(n.children) }))
    .filter((n) => (n.kind === 'leaf' ? n.text.trim() !== '' : n.children.length > 0))

/** Strip ingredientRefs/ingredientAmounts that reference IDs not in validIds. */
export const pruneOrphanedRefs = (nodes: IngredientNode[], validIds: Set<string>): IngredientNode[] =>
  nodes.map((n) => {
    if (n.kind === 'group') return { ...n, children: pruneOrphanedRefs(n.children, validIds) }
    if (!n.ingredientRefs?.length) return n
    const refs = n.ingredientRefs.filter((id) => validIds.has(id))
    if (refs.length === n.ingredientRefs.length) return n
    const amounts = refs.length > 0 && n.ingredientAmounts
      ? Object.fromEntries(refs.map((id) => [id, n.ingredientAmounts![id]]))
      : undefined
    const { ingredientRefs: _r, ingredientAmounts: _a, ...base } = n
    return {
      ...base,
      ...(refs.length > 0 ? { ingredientRefs: refs } : {}),
      ...(amounts ? { ingredientAmounts: amounts } : {}),
    }
  })

/** Parse a numeric amount string — integers, decimals, fractions "1/2", and mixed numbers "1 1/2". Returns NaN for anything else. */
export const parseAmount = (value: string): number => {
  const s = value.trim().replace(',', '.')
  const mixed = s.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/)
  if (mixed) {
    const den = parseInt(mixed[3], 10)
    return den === 0 ? NaN : parseInt(mixed[1], 10) + parseInt(mixed[2], 10) / den
  }
  const fraction = s.match(/^(\d+)\s*\/\s*(\d+)$/)
  if (fraction) {
    const den = parseInt(fraction[2], 10)
    return den === 0 ? NaN : parseInt(fraction[1], 10) / den
  }
  if (/^\d+(\.\d+)?$/.test(s)) return parseFloat(s)
  return NaN
}

/** Format a number using common cooking fractions (e.g. 0.5 → "1/2", 1.5 → "1 1/2"). */
export const formatAmount = (n: number): string => {
  if (n <= 0) return '0'
  const whole = Math.floor(n)
  const frac = n - whole
  if (frac < 0.005) return String(whole)
  for (const [num, den] of COOKING_FRACTIONS) {
    if (Math.abs(frac - num / den) < 0.01) {
      const str = `${num}/${den}`
      return whole === 0 ? str : `${whole} ${str}`
    }
  }
  return parseFloat(n.toFixed(4)).toString()
}

/**
 * Split a free-form ingredient text into its numeric amount, max label, and name.
 * e.g. "225 g eiwitten" → { amount: "225", maxLabel: "225 g", name: "eiwitten" }
 *      "2 eieren"       → { amount: "2",   maxLabel: "2",     name: "eieren" }
 */
export const parseIngredientText = (
  text: string,
): { amount: string; maxLabel: string; name: string } => {
  const trimmed = text.trim()
  const numMatch = trimmed.match(/^(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?)\s*/)
  if (!numMatch) return { amount: '', maxLabel: '', name: trimmed }

  const amount = numMatch[1].replace(/\s/g, '')
  const rest = trimmed.slice(numMatch[0].length).trim()
  if (!rest) return { amount, maxLabel: amount, name: '' }

  const unitMatch = rest.match(/^([a-zA-Z]+)\s+(.+)$/)
  if (unitMatch) {
    const [, maybeUnit, name] = unitMatch
    if (KNOWN_UNITS.has(maybeUnit.toLowerCase())) {
      const maxLabel = trimmed.slice(0, numMatch[0].length + maybeUnit.length)
      return { amount, maxLabel, name }
    }
  }

  return { amount, maxLabel: amount, name: rest }
}

/**
 * Format a single ingredient reference for display in a step, substituting the
 * step-specific amount for the ingredient's original amount while preserving unit and name.
 * e.g. text="200 g bloem", stepAmount="100" → "100 g bloem"
 */
export const formatStepIngredient = (ingredientText: string, stepAmount: string): string => {
  if (!stepAmount) return ingredientText
  const { amount, maxLabel, name } = parseIngredientText(ingredientText)
  const unitPart = maxLabel.slice(amount.length)
  const parts = [stepAmount + unitPart, name].filter(Boolean)
  return parts.join(' ')
}

/**
 * Normalize a step-specific amount string on save:
 * - For volume/fractional units (el, tbsp, cup…): convert any decimal to fraction notation
 * - For all others: normalize comma decimal separator to dot
 */
export const normalizeStepAmount = (amt: string, ingredientText: string): string => {
  const num = parseAmount(amt)
  if (isNaN(num)) return amt
  const { maxLabel, amount } = parseIngredientText(ingredientText)
  const unit = maxLabel.slice(amount.length).trim()
  if (VOLUME_UNIT.test(unit)) return formatAmount(num)
  return parseFloat(num.toFixed(6)).toString()
}

/** Build a map from ingredient leaf id → text for cook-mode ingredient refs. */
export const collectIngredientMap = (nodes: IngredientNode[]): Map<string, string> => {
  const map = new Map<string, string>()
  const traverse = (ns: IngredientNode[]) => {
    for (const node of ns) {
      if (node.kind === 'leaf' && node.id) {
        map.set(node.id, node.text)
      } else if (node.kind === 'group') {
        traverse(node.children)
      }
    }
  }
  traverse(nodes)
  return map
}

/**
 * Sum the amounts assigned to each ingredient across all step leaf nodes, excluding
 * the node with the given id. Refs without an explicit amount count as the full ingredient amount.
 */
export const collectUsedAmounts = (
  nodes: IngredientNode[],
  excludeId: string,
  ingredientOptions: Array<{ id: string; text: string }>,
): Record<string, number> => {
  const used: Record<string, number> = {}
  const traverse = (ns: IngredientNode[]) => {
    for (const n of ns) {
      if (n.kind === 'leaf' && n.id !== excludeId) {
        for (const id of n.ingredientRefs ?? []) {
          const amt = n.ingredientAmounts?.[id]
          if (amt !== undefined) {
            const num = parseAmount(amt)
            if (!isNaN(num)) used[id] = (used[id] ?? 0) + num
          } else {
            const fullText = ingredientOptions.find((o) => o.id === id)?.text ?? ''
            const num = parseAmount(parseIngredientText(fullText).amount)
            if (!isNaN(num)) used[id] = (used[id] ?? 0) + num
          }
        }
      } else if (n.kind === 'group') {
        traverse(n.children)
      }
    }
  }
  traverse(nodes)
  return used
}

const KNOWN_UNITS = new Set([
  'g',
  'kg',
  'ml',
  'l',
  'dl',
  'cl',
  'el',
  'tl',
  'eetlepel',
  'theelepel',
  'st',
  'stuks',
  'stuk',
  'zakje',
  'blikje',
  'snufje',
  'snuf',
  'scheutje',
  'tbsp',
  'tsp',
  'cup',
  'cups',
  'oz',
  'lb',
])
