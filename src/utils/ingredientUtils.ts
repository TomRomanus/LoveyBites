import type { IngredientNode } from '../types/recipe'

/** Recursively collect all leaf text values from an ingredient/step tree. */
export const extractLeafTexts = (nodes: IngredientNode[]): string[] =>
  nodes.flatMap(n =>
    n.kind === 'leaf' ? [n.text] : extractLeafTexts(n.children)
  )

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
