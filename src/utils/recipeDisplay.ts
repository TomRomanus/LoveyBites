import type { IngredientNode } from '../types/recipe'

export const DEFAULT_RECIPE_COLOR = '#6b1f2a'

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

/** Flatten a tree of step nodes into `{ phase, text }[]` for cook mode. */
export function flattenSteps(
  nodes: IngredientNode[],
): { phase: string; text: string }[] {
  const steps: { phase: string; text: string }[] = []

  function traverse(ns: IngredientNode[], phase: string) {
    for (const n of ns) {
      if (n.kind === 'leaf') {
        steps.push({ phase, text: n.text })
      } else {
        traverse(n.children, n.title || phase)
      }
    }
  }

  traverse(nodes, '')
  return steps
}

/** Convert flat `{ section, items }[]` editor format to IngredientNode tree. */
export function sectionsToNodes(
  sections: { section: string; items: string[] }[],
): IngredientNode[] {
  const nodes: IngredientNode[] = []
  for (const sec of sections) {
    const children: IngredientNode[] = sec.items
      .filter(t => t.trim())
      .map(t => ({ kind: 'leaf' as const, text: t }))
    if (sec.section) {
      nodes.push({ kind: 'group', title: sec.section, children })
    } else {
      nodes.push(...children)
    }
  }
  return nodes
}

/** Convert IngredientNode tree to flat `{ section, items }[]` for the editor. */
export function nodesToSections(
  nodes: IngredientNode[],
): { section: string; items: string[] }[] {
  return flattenIngredientSections(nodes)
}
