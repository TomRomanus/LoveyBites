import { describe, it, expect } from 'vitest'
import type { IngredientNode } from '@/features/recipe/types/recipe'
import {
  newLeaf,
  replaceAt,
  removeAt,
  appendChild,
  collectGroupTitles,
  buildLeafIndexMap,
} from '../nodeTree'

// ---------------------------------------------------------------------------
// newLeaf
// ---------------------------------------------------------------------------

describe('newLeaf', () => {
  it('returns a leaf node with empty text', () => {
    const leaf = newLeaf()
    expect(leaf.kind).toBe('leaf')
    if (leaf.kind !== 'leaf') throw new Error('Expected leaf')
    expect(leaf.text).toBe('')
  })

  it('assigns a non-empty id', () => {
    const leaf = newLeaf()
    expect(leaf.id).toBeTruthy()
    expect(typeof leaf.id).toBe('string')
  })

  it('generates unique ids on each call', () => {
    const a = newLeaf()
    const b = newLeaf()
    expect(a.id).not.toBe(b.id)
  })
})

// ---------------------------------------------------------------------------
// replaceAt
// ---------------------------------------------------------------------------

describe('replaceAt', () => {
  const leaf = (id: string, text = ''): IngredientNode => ({ kind: 'leaf', id, text })
  const group = (id: string, children: IngredientNode[]): IngredientNode => ({
    kind: 'group',
    id,
    title: id,
    children,
  })

  it('replaces a top-level node at the given index', () => {
    const nodes: IngredientNode[] = [leaf('a'), leaf('b'), leaf('c')]
    const replacement = leaf('x', 'vervangen')
    const result = replaceAt(nodes, [1], replacement)
    expect(result[0].id).toBe('a')
    expect(result[1].id).toBe('x')
    expect(result[2].id).toBe('c')
    expect(result).toHaveLength(3)
  })

  it('replaces at index 0', () => {
    const nodes: IngredientNode[] = [leaf('a'), leaf('b')]
    const result = replaceAt(nodes, [0], leaf('x'))
    expect(result[0].id).toBe('x')
    expect(result[1].id).toBe('b')
  })

  it('replaces at the last index', () => {
    const nodes: IngredientNode[] = [leaf('a'), leaf('b'), leaf('c')]
    const result = replaceAt(nodes, [2], leaf('x'))
    expect(result[2].id).toBe('x')
    expect(result).toHaveLength(3)
  })

  it('replaces a child node inside a group', () => {
    const nodes: IngredientNode[] = [group('g1', [leaf('a'), leaf('b')])]
    const result = replaceAt(nodes, [0, 1], leaf('x'))
    const g = result[0]
    if (g.kind !== 'group') throw new Error('Expected group')
    expect(g.children[0].id).toBe('a')
    expect(g.children[1].id).toBe('x')
  })

  it('does not replace siblings when replacing a nested node', () => {
    const nodes: IngredientNode[] = [
      group('g1', [leaf('a'), leaf('b')]),
      leaf('c'),
    ]
    const result = replaceAt(nodes, [0, 0], leaf('x'))
    expect(result[1].id).toBe('c')
    const g = result[0]
    if (g.kind !== 'group') throw new Error('Expected group')
    expect(g.children[1].id).toBe('b')
  })

  it('does not mutate the original array', () => {
    const nodes: IngredientNode[] = [leaf('a')]
    const original = nodes[0]
    replaceAt(nodes, [0], leaf('x'))
    expect(nodes[0]).toBe(original)
  })
})

// ---------------------------------------------------------------------------
// removeAt
// ---------------------------------------------------------------------------

describe('removeAt', () => {
  const leaf = (id: string): IngredientNode => ({ kind: 'leaf', id, text: id })
  const group = (id: string, children: IngredientNode[]): IngredientNode => ({
    kind: 'group',
    id,
    title: id,
    children,
  })

  it('removes a top-level node at the given index', () => {
    const nodes: IngredientNode[] = [leaf('a'), leaf('b'), leaf('c')]
    const result = removeAt(nodes, [1])
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('a')
    expect(result[1].id).toBe('c')
  })

  it('removes the first top-level node', () => {
    const nodes: IngredientNode[] = [leaf('a'), leaf('b')]
    const result = removeAt(nodes, [0])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('b')
  })

  it('removes the last top-level node', () => {
    const nodes: IngredientNode[] = [leaf('a'), leaf('b')]
    const result = removeAt(nodes, [1])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('a')
  })

  it('returns empty array when removing the only element', () => {
    const nodes: IngredientNode[] = [leaf('a')]
    expect(removeAt(nodes, [0])).toEqual([])
  })

  it('removes a child node inside a group', () => {
    const nodes: IngredientNode[] = [group('g1', [leaf('a'), leaf('b'), leaf('c')])]
    const result = removeAt(nodes, [0, 1])
    const g = result[0]
    if (g.kind !== 'group') throw new Error('Expected group')
    expect(g.children).toHaveLength(2)
    expect(g.children[0].id).toBe('a')
    expect(g.children[1].id).toBe('c')
  })

  it('does not affect sibling groups when removing from one group', () => {
    const nodes: IngredientNode[] = [
      group('g1', [leaf('a'), leaf('b')]),
      group('g2', [leaf('c')]),
    ]
    const result = removeAt(nodes, [0, 0])
    const g1 = result[0]
    const g2 = result[1]
    if (g1.kind !== 'group' || g2.kind !== 'group') throw new Error('Expected groups')
    expect(g1.children).toHaveLength(1)
    expect(g1.children[0].id).toBe('b')
    expect(g2.children).toHaveLength(1)
    expect(g2.children[0].id).toBe('c')
  })

  it('does not mutate the original array', () => {
    const nodes: IngredientNode[] = [leaf('a'), leaf('b')]
    removeAt(nodes, [0])
    expect(nodes).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// appendChild
// ---------------------------------------------------------------------------

describe('appendChild', () => {
  const leaf = (id: string): IngredientNode => ({ kind: 'leaf', id, text: id })
  const group = (id: string, children: IngredientNode[]): IngredientNode => ({
    kind: 'group',
    id,
    title: id,
    children,
  })

  it('appends to the root when path is empty', () => {
    const nodes: IngredientNode[] = [leaf('a')]
    const result = appendChild(nodes, [], leaf('b'))
    expect(result).toHaveLength(2)
    expect(result[1].id).toBe('b')
  })

  it('appends to a group at the given path index', () => {
    const nodes: IngredientNode[] = [group('g1', [leaf('a')])]
    const result = appendChild(nodes, [0], leaf('b'))
    const g = result[0]
    if (g.kind !== 'group') throw new Error('Expected group')
    expect(g.children).toHaveLength(2)
    expect(g.children[1].id).toBe('b')
  })

  it('appends to an empty group', () => {
    const nodes: IngredientNode[] = [group('g1', [])]
    const result = appendChild(nodes, [0], leaf('a'))
    const g = result[0]
    if (g.kind !== 'group') throw new Error('Expected group')
    expect(g.children).toHaveLength(1)
    expect(g.children[0].id).toBe('a')
  })

  it('does not affect sibling nodes when appending to a group', () => {
    const nodes: IngredientNode[] = [
      group('g1', [leaf('a')]),
      group('g2', [leaf('b')]),
    ]
    const result = appendChild(nodes, [0], leaf('c'))
    const g1 = result[0]
    const g2 = result[1]
    if (g1.kind !== 'group' || g2.kind !== 'group') throw new Error('Expected groups')
    expect(g1.children).toHaveLength(2)
    expect(g2.children).toHaveLength(1)
  })

  it('does not mutate the original nodes array', () => {
    const nodes: IngredientNode[] = [leaf('a')]
    appendChild(nodes, [], leaf('b'))
    expect(nodes).toHaveLength(1)
  })

  it('preserves existing children order when appending', () => {
    const nodes: IngredientNode[] = [group('g1', [leaf('a'), leaf('b')])]
    const result = appendChild(nodes, [0], leaf('c'))
    const g = result[0]
    if (g.kind !== 'group') throw new Error('Expected group')
    expect(g.children.map((c) => c.id)).toEqual(['a', 'b', 'c'])
  })
})

// ---------------------------------------------------------------------------
// collectGroupTitles
// ---------------------------------------------------------------------------

describe('collectGroupTitles', () => {
  it('returns empty set for empty input', () => {
    expect(collectGroupTitles([])).toEqual(new Set())
  })

  it('returns empty set for a list of only leaves', () => {
    const nodes: IngredientNode[] = [
      { kind: 'leaf', text: 'a', id: 'a' },
      { kind: 'leaf', text: 'b', id: 'b' },
    ]
    expect(collectGroupTitles(nodes)).toEqual(new Set())
  })

  it('collects a single group title', () => {
    const nodes: IngredientNode[] = [
      { kind: 'group', title: 'De saus', id: 'g1', children: [] },
    ]
    expect(collectGroupTitles(nodes)).toEqual(new Set(['De saus']))
  })

  it('collects multiple group titles', () => {
    const nodes: IngredientNode[] = [
      { kind: 'group', title: 'De saus', id: 'g1', children: [] },
      { kind: 'group', title: 'Het deeg', id: 'g2', children: [] },
    ]
    expect(collectGroupTitles(nodes)).toEqual(new Set(['De saus', 'Het deeg']))
  })

  it('collects nested group titles', () => {
    const nodes: IngredientNode[] = [
      {
        kind: 'group',
        title: 'Buiten',
        id: 'g1',
        children: [
          { kind: 'group', title: 'Binnen', id: 'g2', children: [] },
        ],
      },
    ]
    expect(collectGroupTitles(nodes)).toEqual(new Set(['Buiten', 'Binnen']))
  })

  it('does not add a group with empty title', () => {
    const nodes: IngredientNode[] = [
      { kind: 'group', title: '', id: 'g1', children: [] },
    ]
    const titles = collectGroupTitles(nodes)
    expect(titles.has('')).toBe(false)
    expect(titles.size).toBe(0)
  })

  it('deduplicates identical titles', () => {
    const nodes: IngredientNode[] = [
      { kind: 'group', title: 'De saus', id: 'g1', children: [] },
      { kind: 'group', title: 'De saus', id: 'g2', children: [] },
    ]
    const titles = collectGroupTitles(nodes)
    expect(titles.size).toBe(1)
    expect(titles.has('De saus')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// buildLeafIndexMap
// ---------------------------------------------------------------------------

describe('buildLeafIndexMap', () => {
  it('returns empty map for empty input', () => {
    expect(buildLeafIndexMap([])).toEqual(new Map())
  })

  it('assigns index 0 to the only leaf', () => {
    const nodes: IngredientNode[] = [{ kind: 'leaf', text: 'bloem', id: 'a' }]
    const map = buildLeafIndexMap(nodes)
    expect(map.get('a')).toBe(0)
    expect(map.size).toBe(1)
  })

  it('assigns sequential indices to multiple leaves', () => {
    const nodes: IngredientNode[] = [
      { kind: 'leaf', text: 'a', id: 'a' },
      { kind: 'leaf', text: 'b', id: 'b' },
      { kind: 'leaf', text: 'c', id: 'c' },
    ]
    const map = buildLeafIndexMap(nodes)
    expect(map.get('a')).toBe(0)
    expect(map.get('b')).toBe(1)
    expect(map.get('c')).toBe(2)
  })

  it('skips leaves without an id', () => {
    const nodes: IngredientNode[] = [
      { kind: 'leaf', text: 'zonder id' },
      { kind: 'leaf', text: 'met id', id: 'b' },
    ]
    const map = buildLeafIndexMap(nodes)
    expect(map.size).toBe(1)
    // the counter only advances when a leaf has an id, so 'b' gets index 0
    expect(map.get('b')).toBe(0)
  })

  it('indexes leaves inside groups', () => {
    const nodes: IngredientNode[] = [
      {
        kind: 'group',
        title: 'De saus',
        id: 'g1',
        children: [
          { kind: 'leaf', text: 'a', id: 'a' },
          { kind: 'leaf', text: 'b', id: 'b' },
        ],
      },
    ]
    const map = buildLeafIndexMap(nodes)
    expect(map.get('a')).toBe(0)
    expect(map.get('b')).toBe(1)
  })

  it('builds a continuous index across top-level leaves and group children', () => {
    const nodes: IngredientNode[] = [
      { kind: 'leaf', text: 'a', id: 'a' },
      {
        kind: 'group',
        title: 'De saus',
        id: 'g1',
        children: [{ kind: 'leaf', text: 'b', id: 'b' }],
      },
      { kind: 'leaf', text: 'c', id: 'c' },
    ]
    const map = buildLeafIndexMap(nodes)
    expect(map.get('a')).toBe(0)
    expect(map.get('b')).toBe(1)
    expect(map.get('c')).toBe(2)
  })

  it('does not include group ids in the map', () => {
    const nodes: IngredientNode[] = [
      { kind: 'group', title: 'De saus', id: 'g1', children: [] },
    ]
    const map = buildLeafIndexMap(nodes)
    expect(map.has('g1')).toBe(false)
  })
})
