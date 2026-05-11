import type { IngredientNode } from '@/features/recipe/types/recipe'
import { extractLeafTexts } from '@/features/recipe/utils/ingredientUtils'

/** Flatten a tree of ingredient nodes into `{ section, items }[]` for display. */
export const flattenIngredientSections = (
  nodes: IngredientNode[],
): { section: string; items: string[] }[] => {
  const sections: { section: string; items: string[] }[] = []
  const loose: string[] = []

  for (const node of nodes) {
    if (node.kind === 'leaf') {
      loose.push(node.text)
    } else {
      if (loose.length) {
        sections.push({ section: '', items: loose.splice(0) })
      }
      const items = extractLeafTexts(node.children)
      sections.push({ section: node.title || '', items })
    }
  }
  if (loose.length) {
    sections.push({ section: '', items: loose })
  }
  return sections.length ? sections : [{ section: '', items: [] }]
}

/** Flatten a tree of step nodes into `{ phase, text, ingredientRefs, ingredientAmounts }[]` for display. */
export const flattenSteps = (
  nodes: IngredientNode[],
): { phase: string; text: string; ingredientRefs?: string[]; ingredientAmounts?: Record<string, string> }[] => {
  const steps: { phase: string; text: string; ingredientRefs?: string[]; ingredientAmounts?: Record<string, string> }[] = []

  const traverse = (ns: IngredientNode[], phase: string) => {
    for (const n of ns) {
      if (n.kind === 'leaf') {
        steps.push({ phase, text: n.text, ingredientRefs: n.ingredientRefs, ingredientAmounts: n.ingredientAmounts })
      } else {
        traverse(n.children, n.title || phase)
      }
    }
  }

  traverse(nodes, '')
  return steps
}
