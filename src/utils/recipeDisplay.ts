import type { IngredientNode } from '../types/recipe'

/** Flatten a tree of ingredient nodes into `{ section, items }[]` for display. */
export function flattenIngredientSections(
  nodes: IngredientNode[],
): { section: string; items: string[] }[] {
  const sections: { section: string; items: string[] }[] = []
  const loose: string[] = []

  for (const node of nodes) {
    if (node.kind === 'leaf') {
      loose.push(node.text)
    } else {
      if (loose.length) {
        sections.push({ section: '', items: loose.splice(0) })
      }
      const items = collectLeafTexts(node.children)
      sections.push({ section: node.title || '', items })
    }
  }
  if (loose.length) {
    sections.push({ section: '', items: loose })
  }
  return sections.length ? sections : [{ section: '', items: [] }]
}

function collectLeafTexts(nodes: IngredientNode[]): string[] {
  return nodes.flatMap(n =>
    n.kind === 'leaf' ? [n.text] : collectLeafTexts(n.children),
  )
}

/** Flatten a tree of step nodes into `{ phase, text, ingredientRefs }[]` for display. */
export function flattenSteps(
  nodes: IngredientNode[],
): { phase: string; text: string; ingredientRefs?: string[] }[] {
  const steps: { phase: string; text: string; ingredientRefs?: string[] }[] = []

  function traverse(ns: IngredientNode[], phase: string) {
    for (const n of ns) {
      if (n.kind === 'leaf') {
        steps.push({ phase, text: n.text, ingredientRefs: n.ingredientRefs })
      } else {
        traverse(n.children, n.title || phase)
      }
    }
  }

  traverse(nodes, '')
  return steps
}

