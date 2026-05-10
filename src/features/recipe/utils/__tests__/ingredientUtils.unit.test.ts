import { describe, it, expect } from 'vitest'
import type { IngredientNode } from '@/features/recipe/types/recipe'
import {
  extractLeafTexts,
  ensureIngredientIds,
  pruneEmpty,
  collectIngredientMap,
} from '../ingredientUtils'

// ---------------------------------------------------------------------------
// extractLeafTexts
// ---------------------------------------------------------------------------

describe('extractLeafTexts', () => {
  it('returns empty array for empty input', () => {
    expect(extractLeafTexts([])).toEqual([])
  })

  it('returns text from a single leaf', () => {
    const nodes: IngredientNode[] = [{ kind: 'leaf', text: '200g bloem' }]
    expect(extractLeafTexts(nodes)).toEqual(['200g bloem'])
  })

  it('returns texts from multiple top-level leaves in order', () => {
    const nodes: IngredientNode[] = [
      { kind: 'leaf', text: '200g bloem' },
      { kind: 'leaf', text: '3 eieren' },
      { kind: 'leaf', text: '50ml melk' },
    ]
    expect(extractLeafTexts(nodes)).toEqual(['200g bloem', '3 eieren', '50ml melk'])
  })

  it('extracts leaf texts from a group', () => {
    const nodes: IngredientNode[] = [
      {
        kind: 'group',
        title: 'De saus',
        children: [
          { kind: 'leaf', text: '1 ui' },
          { kind: 'leaf', text: '400g tomaten' },
        ],
      },
    ]
    expect(extractLeafTexts(nodes)).toEqual(['1 ui', '400g tomaten'])
  })

  it('does not include group nodes in output', () => {
    const nodes: IngredientNode[] = [{ kind: 'group', title: 'Lege groep', children: [] }]
    expect(extractLeafTexts(nodes)).toEqual([])
  })

  it('extracts leaves from mixed top-level leaves and groups', () => {
    const nodes: IngredientNode[] = [
      { kind: 'leaf', text: 'zout' },
      {
        kind: 'group',
        title: 'Deeg',
        children: [
          { kind: 'leaf', text: '200g bloem' },
          { kind: 'leaf', text: '100ml water' },
        ],
      },
      { kind: 'leaf', text: 'peper' },
    ]
    expect(extractLeafTexts(nodes)).toEqual(['zout', '200g bloem', '100ml water', 'peper'])
  })

  it('handles deeply nested groups recursively', () => {
    const nodes: IngredientNode[] = [
      {
        kind: 'group',
        title: 'Buiten',
        children: [
          {
            kind: 'group',
            title: 'Binnen',
            children: [{ kind: 'leaf', text: 'diep ingredient' }],
          },
        ],
      },
    ]
    expect(extractLeafTexts(nodes)).toEqual(['diep ingredient'])
  })
})

// ---------------------------------------------------------------------------
// ensureIngredientIds
// ---------------------------------------------------------------------------

describe('ensureIngredientIds', () => {
  it('returns empty array for empty input', () => {
    expect(ensureIngredientIds([])).toEqual([])
  })

  it('assigns an id to a leaf that has none', () => {
    const nodes: IngredientNode[] = [{ kind: 'leaf', text: '200g bloem' }]
    const result = ensureIngredientIds(nodes)
    expect(result[0].id).toBeTruthy()
    expect(typeof result[0].id).toBe('string')
  })

  it('preserves the existing id on a leaf that already has one', () => {
    const nodes: IngredientNode[] = [{ kind: 'leaf', text: '200g bloem', id: 'leaf-1' }]
    const result = ensureIngredientIds(nodes)
    expect(result[0].id).toBe('leaf-1')
  })

  it('assigns an id to a group that has none', () => {
    const nodes: IngredientNode[] = [{ kind: 'group', title: 'De saus', children: [] }]
    const result = ensureIngredientIds(nodes)
    expect(result[0].id).toBeTruthy()
  })

  it('preserves the existing id on a group that already has one', () => {
    const nodes: IngredientNode[] = [
      { kind: 'group', title: 'De saus', id: 'group-1', children: [] },
    ]
    const result = ensureIngredientIds(nodes)
    expect(result[0].id).toBe('group-1')
  })

  it('recursively assigns ids to children inside a group', () => {
    const nodes: IngredientNode[] = [
      {
        kind: 'group',
        title: 'De saus',
        id: 'group-1',
        children: [
          { kind: 'leaf', text: '1 ui' },
          { kind: 'leaf', text: '400g tomaten', id: 'leaf-existing' },
        ],
      },
    ]
    const result = ensureIngredientIds(nodes)
    const group = result[0]
    if (group.kind !== 'group') throw new Error('Expected group')

    expect(group.id).toBe('group-1')
    expect(group.children[0].id).toBeTruthy()
    expect(group.children[1].id).toBe('leaf-existing')
  })

  it('assigns unique ids to multiple leaves without ids', () => {
    const nodes: IngredientNode[] = [
      { kind: 'leaf', text: 'a' },
      { kind: 'leaf', text: 'b' },
      { kind: 'leaf', text: 'c' },
    ]
    const result = ensureIngredientIds(nodes)
    const ids = result.map((n) => n.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(3)
  })

  it('does not mutate the original nodes', () => {
    const original: IngredientNode = { kind: 'leaf', text: '200g bloem' }
    const nodes: IngredientNode[] = [original]
    ensureIngredientIds(nodes)
    expect(original.id).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// pruneEmpty
// ---------------------------------------------------------------------------

describe('pruneEmpty', () => {
  it('returns empty array for empty input', () => {
    expect(pruneEmpty([])).toEqual([])
  })

  it('keeps non-empty leaves', () => {
    const nodes: IngredientNode[] = [{ kind: 'leaf', text: '200g bloem', id: 'a' }]
    expect(pruneEmpty(nodes)).toHaveLength(1)
  })

  it('removes a leaf with an empty string', () => {
    const nodes: IngredientNode[] = [
      { kind: 'leaf', text: '', id: 'a' },
      { kind: 'leaf', text: '200g bloem', id: 'b' },
    ]
    const result = pruneEmpty(nodes)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('b')
  })

  it('removes a leaf with only whitespace', () => {
    const nodes: IngredientNode[] = [
      { kind: 'leaf', text: '   ', id: 'a' },
      { kind: 'leaf', text: '\t\n', id: 'b' },
      { kind: 'leaf', text: 'zout', id: 'c' },
    ]
    const result = pruneEmpty(nodes)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('c')
  })

  it('removes a group that becomes empty after pruning its children', () => {
    const nodes: IngredientNode[] = [
      {
        kind: 'group',
        title: 'Leeg',
        id: 'g1',
        children: [{ kind: 'leaf', text: '', id: 'a' }],
      },
    ]
    expect(pruneEmpty(nodes)).toEqual([])
  })

  it('keeps a group that still has non-empty children after pruning', () => {
    const nodes: IngredientNode[] = [
      {
        kind: 'group',
        title: 'De saus',
        id: 'g1',
        children: [
          { kind: 'leaf', text: '', id: 'a' },
          { kind: 'leaf', text: '1 ui', id: 'b' },
        ],
      },
    ]
    const result = pruneEmpty(nodes)
    expect(result).toHaveLength(1)
    const group = result[0]
    if (group.kind !== 'group') throw new Error('Expected group')
    expect(group.children).toHaveLength(1)
    expect(group.children[0].id).toBe('b')
  })

  it('removes a group with no children at all', () => {
    const nodes: IngredientNode[] = [{ kind: 'group', title: 'Lege groep', id: 'g1', children: [] }]
    expect(pruneEmpty(nodes)).toEqual([])
  })

  it('handles a mix of valid leaves, empty leaves, and empty groups', () => {
    const nodes: IngredientNode[] = [
      { kind: 'leaf', text: 'zout', id: 'a' },
      { kind: 'leaf', text: '', id: 'b' },
      { kind: 'group', title: 'Leeg', id: 'g1', children: [] },
      {
        kind: 'group',
        title: 'Vol',
        id: 'g2',
        children: [{ kind: 'leaf', text: 'peper', id: 'c' }],
      },
    ]
    const result = pruneEmpty(nodes)
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('a')
    expect(result[1].id).toBe('g2')
  })
})

// ---------------------------------------------------------------------------
// collectIngredientMap
// ---------------------------------------------------------------------------

describe('collectIngredientMap', () => {
  it('returns an empty map for empty input', () => {
    expect(collectIngredientMap([])).toEqual(new Map())
  })

  it('maps a single leaf id to its text', () => {
    const nodes: IngredientNode[] = [{ kind: 'leaf', text: '200g bloem', id: 'a' }]
    const map = collectIngredientMap(nodes)
    expect(map.get('a')).toBe('200g bloem')
    expect(map.size).toBe(1)
  })

  it('maps multiple leaf ids to their texts', () => {
    const nodes: IngredientNode[] = [
      { kind: 'leaf', text: '200g bloem', id: 'a' },
      { kind: 'leaf', text: '3 eieren', id: 'b' },
    ]
    const map = collectIngredientMap(nodes)
    expect(map.get('a')).toBe('200g bloem')
    expect(map.get('b')).toBe('3 eieren')
    expect(map.size).toBe(2)
  })

  it('skips leaves without an id', () => {
    const nodes: IngredientNode[] = [
      { kind: 'leaf', text: 'zonder id' },
      { kind: 'leaf', text: 'met id', id: 'a' },
    ]
    const map = collectIngredientMap(nodes)
    expect(map.size).toBe(1)
    expect(map.get('a')).toBe('met id')
  })

  it('collects leaf ids from within groups', () => {
    const nodes: IngredientNode[] = [
      {
        kind: 'group',
        title: 'De saus',
        id: 'g1',
        children: [
          { kind: 'leaf', text: '1 ui', id: 'a' },
          { kind: 'leaf', text: '400g tomaten', id: 'b' },
        ],
      },
    ]
    const map = collectIngredientMap(nodes)
    expect(map.get('a')).toBe('1 ui')
    expect(map.get('b')).toBe('400g tomaten')
    expect(map.size).toBe(2)
  })

  it('collects from both top-level leaves and group children', () => {
    const nodes: IngredientNode[] = [
      { kind: 'leaf', text: 'zout', id: 'a' },
      {
        kind: 'group',
        title: 'De saus',
        id: 'g1',
        children: [{ kind: 'leaf', text: '1 ui', id: 'b' }],
      },
    ]
    const map = collectIngredientMap(nodes)
    expect(map.get('a')).toBe('zout')
    expect(map.get('b')).toBe('1 ui')
    expect(map.size).toBe(2)
  })

  it('does not add the group id itself to the map', () => {
    const nodes: IngredientNode[] = [{ kind: 'group', title: 'De saus', id: 'g1', children: [] }]
    const map = collectIngredientMap(nodes)
    expect(map.has('g1')).toBe(false)
  })
})
