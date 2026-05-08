import type { TreeNode, FlatStep } from '../types/cooking'

export const flattenCookSteps = (
  nodes: TreeNode[],
  sectionTitle?: string,
  counter = { n: 0 },
): FlatStep[] => {
  const result: FlatStep[] = []
  for (const node of nodes) {
    if (node.kind === 'leaf') {
      result.push({
        text: node.text,
        sectionTitle,
        ingredientRefs: node.ingredientRefs,
        globalIndex: counter.n++,
      })
    } else {
      result.push(...flattenCookSteps(node.children, node.title, counter))
    }
  }
  return result
}
