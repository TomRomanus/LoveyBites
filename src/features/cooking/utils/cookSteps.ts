import type { TreeNode, FlatStep } from '@/features/cooking/types/cooking'

export const updateStepComment = (
  nodes: TreeNode[],
  globalIndex: number,
  comment: string | undefined,
  counter = { n: 0 },
): TreeNode[] =>
  nodes.map((node) => {
    if (node.kind === 'leaf') {
      if (counter.n++ === globalIndex) {
        const { comment: _c, ...base } = node
        return comment ? { ...base, comment } : base
      }
      return node
    }
    return { ...node, children: updateStepComment(node.children, globalIndex, comment, counter) }
  })

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
        ingredientAmounts: node.ingredientAmounts,
        comment: node.comment,
        globalIndex: counter.n++,
      })
    } else {
      result.push(...flattenCookSteps(node.children, node.title, counter))
    }
  }
  return result
}
