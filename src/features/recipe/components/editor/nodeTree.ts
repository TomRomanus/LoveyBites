import type { IngredientNode } from '@/features/recipe/types/recipe'

export const newLeaf = (): IngredientNode => ({ kind: 'leaf', text: '', id: crypto.randomUUID() })

export const replaceAt = (
  nodes: IngredientNode[],
  path: number[],
  replacement: IngredientNode,
): IngredientNode[] => {
  if (path.length === 1) return nodes.map((n, i) => (i === path[0] ? replacement : n))
  return nodes.map((n, i) => {
    if (i !== path[0] || n.kind !== 'group') return n
    return { ...n, children: replaceAt(n.children, path.slice(1), replacement) }
  })
}

export const removeAt = (nodes: IngredientNode[], path: number[]): IngredientNode[] => {
  if (path.length === 1) return nodes.filter((_, i) => i !== path[0])
  return nodes.map((n, i) => {
    if (i !== path[0] || n.kind !== 'group') return n
    return { ...n, children: removeAt(n.children, path.slice(1)) }
  })
}

export const appendChild = (
  nodes: IngredientNode[],
  path: number[],
  node: IngredientNode,
): IngredientNode[] => {
  if (path.length === 0) return [...nodes, node]
  return nodes.map((n, i) => {
    if (i !== path[0] || n.kind !== 'group') return n
    if (path.length === 1) return { ...n, children: [...n.children, node] }
    return { ...n, children: appendChild(n.children, path.slice(1), node) }
  })
}

export const collectGroupTitles = (nodes: IngredientNode[]): Set<string> => {
  const titles = new Set<string>()
  for (const node of nodes) {
    if (node.kind === 'group') {
      if (node.title) titles.add(node.title)
      for (const t of collectGroupTitles(node.children)) titles.add(t)
    }
  }
  return titles
}

export const buildLeafIndexMap = (nodes: IngredientNode[]): Map<string, number> => {
  const map = new Map<string, number>()
  let n = 0
  const walk = (ns: IngredientNode[]) => {
    for (const node of ns) {
      if (node.kind === 'leaf') {
        if (node.id) map.set(node.id, n++)
      } else walk(node.children)
    }
  }
  walk(nodes)
  return map
}
