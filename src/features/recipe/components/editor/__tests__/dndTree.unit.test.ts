import { describe, it, expect } from 'vitest'
import type { IngredientNode } from '@/features/recipe/types/recipe'
import { findNode, moveNodeInTree } from '../dndTree'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const leaf = (id: string, text = ''): IngredientNode => ({ kind: 'leaf', id, text })
const group = (id: string, children: IngredientNode[]): IngredientNode => ({
  kind: 'group',
  id,
  title: id,
  children,
})

// ---------------------------------------------------------------------------
// findNode
// ---------------------------------------------------------------------------

describe('findNode', () => {
  it('returns null for empty input', () => {
    expect(findNode([], 'a')).toBeNull()
  })

  it('finds a top-level leaf by id', () => {
    const nodes: IngredientNode[] = [leaf('a'), leaf('b')]
    const result = findNode(nodes, 'a')
    expect(result?.id).toBe('a')
  })

  it('finds a top-level group by id', () => {
    const nodes: IngredientNode[] = [group('g1', [])]
    const result = findNode(nodes, 'g1')
    expect(result?.id).toBe('g1')
  })

  it('finds a leaf nested inside a group', () => {
    const nodes: IngredientNode[] = [group('g1', [leaf('a'), leaf('b')])]
    const result = findNode(nodes, 'b')
    expect(result?.id).toBe('b')
  })

  it('returns null when the id does not exist', () => {
    const nodes: IngredientNode[] = [leaf('a'), group('g1', [leaf('b')])]
    expect(findNode(nodes, 'z')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// moveNodeInTree — no-op when activeId === overId
// ---------------------------------------------------------------------------

describe('moveNodeInTree — no-op', () => {
  it('returns the same array reference when activeId equals overId', () => {
    const nodes: IngredientNode[] = [leaf('a'), leaf('b')]
    const result = moveNodeInTree(nodes, 'a', 'a')
    expect(result).toBe(nodes)
  })
})

// ---------------------------------------------------------------------------
// moveNodeInTree — root-level group reorder
// ---------------------------------------------------------------------------

describe('moveNodeInTree — root-level group reorder', () => {
  it('swaps two adjacent root-level groups', () => {
    const nodes: IngredientNode[] = [
      group('g1', [leaf('a')]),
      group('g2', [leaf('b')]),
    ]
    const result = moveNodeInTree(nodes, 'g1', 'g2')
    expect(result[0].id).toBe('g2')
    expect(result[1].id).toBe('g1')
  })

  it('moves a group from the first position to the last', () => {
    const nodes: IngredientNode[] = [
      group('g1', []),
      group('g2', []),
      group('g3', []),
    ]
    const result = moveNodeInTree(nodes, 'g1', 'g3')
    expect(result.map((n) => n.id)).toEqual(['g2', 'g3', 'g1'])
  })

  it('moves a group from the last position to the first', () => {
    const nodes: IngredientNode[] = [
      group('g1', []),
      group('g2', []),
      group('g3', []),
    ]
    const result = moveNodeInTree(nodes, 'g3', 'g1')
    expect(result.map((n) => n.id)).toEqual(['g3', 'g1', 'g2'])
  })

  it('preserves group children when reordering groups', () => {
    const nodes: IngredientNode[] = [
      group('g1', [leaf('a'), leaf('b')]),
      group('g2', [leaf('c')]),
    ]
    const result = moveNodeInTree(nodes, 'g1', 'g2')
    const first = result[0]
    if (first.kind !== 'group') throw new Error('Expected group')
    expect(first.id).toBe('g2')
    expect(first.children).toHaveLength(1)
  })

  it('returns nodes unchanged when group id is not found at root', () => {
    const nodes: IngredientNode[] = [leaf('a'), group('g1', [])]
    // 'a' is a leaf, not a group, so dragging a group over it at a non-root position
    // — both ids must be root-level groups; if overId is not at root, arrayMove returns unchanged
    const result = moveNodeInTree(nodes, 'g1', 'nonexistent')
    expect(result).toBe(nodes)
  })
})

// ---------------------------------------------------------------------------
// moveNodeInTree — root-level leaf reorder (same container: null)
// ---------------------------------------------------------------------------

describe('moveNodeInTree — root-level leaf reorder', () => {
  it('reorders two adjacent root leaves', () => {
    const nodes: IngredientNode[] = [leaf('a'), leaf('b'), leaf('c')]
    const result = moveNodeInTree(nodes, 'a', 'b')
    expect(result.map((n) => n.id)).toEqual(['b', 'a', 'c'])
  })

  it('moves a leaf from the first position to the last', () => {
    const nodes: IngredientNode[] = [leaf('a'), leaf('b'), leaf('c')]
    const result = moveNodeInTree(nodes, 'a', 'c')
    expect(result.map((n) => n.id)).toEqual(['b', 'c', 'a'])
  })

  it('moves a leaf from the last position to the first', () => {
    const nodes: IngredientNode[] = [leaf('a'), leaf('b'), leaf('c')]
    const result = moveNodeInTree(nodes, 'c', 'a')
    expect(result.map((n) => n.id)).toEqual(['c', 'a', 'b'])
  })

  it('does not alter list length when reordering root leaves', () => {
    const nodes: IngredientNode[] = [leaf('a'), leaf('b'), leaf('c')]
    const result = moveNodeInTree(nodes, 'b', 'c')
    expect(result).toHaveLength(3)
  })
})

// ---------------------------------------------------------------------------
// moveNodeInTree — leaf dragged over a group header (append to group)
// ---------------------------------------------------------------------------

describe('moveNodeInTree — leaf → group append', () => {
  it('appends a root leaf to a group when dropped on the group header', () => {
    const nodes: IngredientNode[] = [leaf('a'), group('g1', [leaf('b')])]
    const result = moveNodeInTree(nodes, 'a', 'g1')
    // 'a' should be removed from root and appended to g1
    const rootIds = result.map((n) => n.id)
    expect(rootIds).not.toContain('a')
    const g = result.find((n) => n.id === 'g1')
    if (g?.kind !== 'group') throw new Error('Expected group')
    expect(g.children.map((c) => c.id)).toContain('a')
  })

  it('appends the leaf at the end of the group children', () => {
    const nodes: IngredientNode[] = [
      leaf('a'),
      group('g1', [leaf('b'), leaf('c')]),
    ]
    const result = moveNodeInTree(nodes, 'a', 'g1')
    const g = result.find((n) => n.id === 'g1')
    if (g?.kind !== 'group') throw new Error('Expected group')
    const childIds = g.children.map((c) => c.id)
    expect(childIds[childIds.length - 1]).toBe('a')
  })

  it('appends a leaf from one group into another group', () => {
    const nodes: IngredientNode[] = [
      group('g1', [leaf('a')]),
      group('g2', [leaf('b')]),
    ]
    const result = moveNodeInTree(nodes, 'a', 'g2')
    const g1 = result.find((n) => n.id === 'g1')
    const g2 = result.find((n) => n.id === 'g2')
    if (g1?.kind !== 'group' || g2?.kind !== 'group') throw new Error('Expected groups')
    expect(g1.children.map((c) => c.id)).not.toContain('a')
    expect(g2.children.map((c) => c.id)).toContain('a')
  })
})

// ---------------------------------------------------------------------------
// moveNodeInTree — leaf reorder inside the same group
// ---------------------------------------------------------------------------

describe('moveNodeInTree — leaf reorder inside same group', () => {
  it('reorders two leaves within the same group', () => {
    const nodes: IngredientNode[] = [group('g1', [leaf('a'), leaf('b'), leaf('c')])]
    const result = moveNodeInTree(nodes, 'a', 'b')
    const g = result[0]
    if (g.kind !== 'group') throw new Error('Expected group')
    expect(g.children.map((c) => c.id)).toEqual(['b', 'a', 'c'])
  })

  it('moves a leaf to the last position inside its group', () => {
    const nodes: IngredientNode[] = [group('g1', [leaf('a'), leaf('b'), leaf('c')])]
    const result = moveNodeInTree(nodes, 'a', 'c')
    const g = result[0]
    if (g.kind !== 'group') throw new Error('Expected group')
    expect(g.children.map((c) => c.id)).toEqual(['b', 'c', 'a'])
  })

  it('does not alter other groups when reordering within one group', () => {
    const nodes: IngredientNode[] = [
      group('g1', [leaf('a'), leaf('b')]),
      group('g2', [leaf('c'), leaf('d')]),
    ]
    const result = moveNodeInTree(nodes, 'a', 'b')
    const g2 = result.find((n) => n.id === 'g2')
    if (g2?.kind !== 'group') throw new Error('Expected group')
    expect(g2.children.map((c) => c.id)).toEqual(['c', 'd'])
  })
})

// ---------------------------------------------------------------------------
// moveNodeInTree — cross-container leaf move
// ---------------------------------------------------------------------------

describe('moveNodeInTree — cross-container leaf move', () => {
  it('moves a leaf from a group into a root position (over a root leaf)', () => {
    const nodes: IngredientNode[] = [leaf('a'), group('g1', [leaf('b')])]
    // drag 'b' (in g1) over 'a' (at root)
    const result = moveNodeInTree(nodes, 'b', 'a')
    // 'b' should appear at root level near 'a', no longer inside g1
    const rootIds = result.map((n) => n.id)
    expect(rootIds).toContain('b')
    const g1 = result.find((n) => n.id === 'g1')
    if (g1?.kind !== 'group') throw new Error('Expected group')
    expect(g1.children.map((c) => c.id)).not.toContain('b')
  })

  it('moves a leaf from one group into another at the target leaf position', () => {
    const nodes: IngredientNode[] = [
      group('g1', [leaf('a'), leaf('b')]),
      group('g2', [leaf('c'), leaf('d')]),
    ]
    // drag 'a' (in g1) over 'c' (in g2)
    const result = moveNodeInTree(nodes, 'a', 'c')
    const g1 = result.find((n) => n.id === 'g1')
    const g2 = result.find((n) => n.id === 'g2')
    if (g1?.kind !== 'group' || g2?.kind !== 'group') throw new Error('Expected groups')
    expect(g1.children.map((c) => c.id)).not.toContain('a')
    expect(g2.children.map((c) => c.id)).toContain('a')
  })

  it('inserts the cross-container leaf before the over-leaf', () => {
    const nodes: IngredientNode[] = [
      group('g1', [leaf('a')]),
      group('g2', [leaf('b'), leaf('c')]),
    ]
    // drag 'a' over 'b' in g2 — 'a' should be inserted at index of 'b'
    const result = moveNodeInTree(nodes, 'a', 'b')
    const g2 = result.find((n) => n.id === 'g2')
    if (g2?.kind !== 'group') throw new Error('Expected group')
    const childIds = g2.children.map((c) => c.id)
    expect(childIds.indexOf('a')).toBeLessThan(childIds.indexOf('b'))
  })

  it('moves a leaf from a group to root level and inserts before the target', () => {
    const nodes: IngredientNode[] = [
      leaf('a'),
      leaf('b'),
      group('g1', [leaf('c')]),
    ]
    // drag 'c' (in g1) over 'a' at root
    const result = moveNodeInTree(nodes, 'c', 'a')
    const rootIds = result.map((n) => n.id)
    expect(rootIds).toContain('c')
    const idxC = rootIds.indexOf('c')
    const idxA = rootIds.indexOf('a')
    expect(idxC).toBeLessThanOrEqual(idxA)
    // g1 should no longer contain 'c'
    const g1 = result.find((n) => n.id === 'g1')
    if (g1?.kind !== 'group') throw new Error('Expected group')
    expect(g1.children.map((c) => c.id)).not.toContain('c')
  })

  it('returns unchanged nodes when active node is not found', () => {
    const nodes: IngredientNode[] = [leaf('a'), leaf('b')]
    const result = moveNodeInTree(nodes, 'nonexistent', 'a')
    expect(result).toBe(nodes)
  })

  it('returns unchanged nodes when over node is not found', () => {
    const nodes: IngredientNode[] = [leaf('a'), leaf('b')]
    const result = moveNodeInTree(nodes, 'a', 'nonexistent')
    expect(result).toBe(nodes)
  })
})
