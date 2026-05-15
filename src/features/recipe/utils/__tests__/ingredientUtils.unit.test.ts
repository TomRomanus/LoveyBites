import { describe, it, expect } from 'vitest'
import type { IngredientNode } from '@/features/recipe/types/recipe'
import {
  extractLeafTexts,
  ensureIngredientIds,
  pruneEmpty,
  pruneOrphanedRefs,
  collectIngredientMap,
  parseAmount,
  formatAmount,
  parseIngredientText,
  formatStepIngredient,
  collectUsedAmounts,
  normalizeStepAmount,
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

// ---------------------------------------------------------------------------
// parseAmount
// ---------------------------------------------------------------------------

describe('parseAmount', () => {
  it('parses an integer', () => {
    expect(parseAmount('4')).toBe(4)
  })

  it('parses a decimal with dot', () => {
    expect(parseAmount('1.5')).toBe(1.5)
  })

  it('parses a decimal with comma', () => {
    expect(parseAmount('1,5')).toBe(1.5)
  })

  it('parses a simple fraction', () => {
    expect(parseAmount('1/2')).toBeCloseTo(0.5)
  })

  it('parses a mixed number', () => {
    expect(parseAmount('1 1/2')).toBeCloseTo(1.5)
  })

  it('handles leading and trailing whitespace', () => {
    expect(parseAmount(' 3 ')).toBe(3)
  })

  it('returns NaN for non-numeric input', () => {
    expect(parseAmount('abc')).toBeNaN()
  })

  it('returns NaN for an empty string', () => {
    expect(parseAmount('')).toBeNaN()
  })

  it('returns NaN for a fraction with zero denominator', () => {
    expect(parseAmount('1/0')).toBeNaN()
  })
})

// ---------------------------------------------------------------------------
// formatAmount
// ---------------------------------------------------------------------------

describe('formatAmount', () => {
  it('formats an integer', () => {
    expect(formatAmount(4)).toBe('4')
  })

  it('formats 0 as "0"', () => {
    expect(formatAmount(0)).toBe('0')
  })

  it('formats a negative number as "0"', () => {
    expect(formatAmount(-1)).toBe('0')
  })

  it('formats 0.5 as "1/2"', () => {
    expect(formatAmount(0.5)).toBe('1/2')
  })

  it('formats 0.25 as "1/4"', () => {
    expect(formatAmount(0.25)).toBe('1/4')
  })

  it('formats 1.5 as "1 1/2"', () => {
    expect(formatAmount(1.5)).toBe('1 1/2')
  })

  it('formats 2.75 as "2 3/4"', () => {
    expect(formatAmount(2.75)).toBe('2 3/4')
  })
})

// ---------------------------------------------------------------------------
// parseIngredientText
// ---------------------------------------------------------------------------

describe('parseIngredientText', () => {
  it('parses amount + known unit + name', () => {
    expect(parseIngredientText('200 g bloem')).toEqual({
      amount: '200',
      maxLabel: '200 g',
      name: 'bloem',
    })
  })

  it('parses amount + name when the word after the number is not a known unit', () => {
    expect(parseIngredientText('3 eieren')).toEqual({
      amount: '3',
      maxLabel: '3',
      name: 'eieren',
    })
  })

  it('parses amount only (no name or unit)', () => {
    expect(parseIngredientText('5')).toEqual({ amount: '5', maxLabel: '5', name: '' })
  })

  it('returns empty amount for text with no leading number', () => {
    expect(parseIngredientText('zout')).toEqual({ amount: '', maxLabel: '', name: 'zout' })
  })

  it('parses a fraction amount', () => {
    const result = parseIngredientText('1/2 tsp zout')
    expect(result.amount).toBe('1/2')
    expect(result.maxLabel).toBe('1/2 tsp')
    expect(result.name).toBe('zout')
  })

  it('parses decimal-comma amount', () => {
    const result = parseIngredientText('1,5 dl melk')
    expect(result.amount).toBe('1,5')
  })

  it('trims surrounding whitespace', () => {
    expect(parseIngredientText('  100 ml water  ')).toMatchObject({
      amount: '100',
      name: 'water',
    })
  })
})

// ---------------------------------------------------------------------------
// formatStepIngredient
// ---------------------------------------------------------------------------

describe('formatStepIngredient', () => {
  it('substitutes the step amount while preserving unit and name', () => {
    expect(formatStepIngredient('200 g bloem', '100')).toBe('100 g bloem')
  })

  it('substitutes the step amount when there is no unit', () => {
    expect(formatStepIngredient('3 eieren', '2')).toBe('2 eieren')
  })

  it('returns the original ingredient text when stepAmount is empty', () => {
    expect(formatStepIngredient('200 g bloem', '')).toBe('200 g bloem')
  })

  it('works with a fraction step amount', () => {
    expect(formatStepIngredient('2 el olie', '1/2')).toBe('1/2 el olie')
  })
})

// ---------------------------------------------------------------------------
// collectUsedAmounts
// ---------------------------------------------------------------------------

describe('collectUsedAmounts', () => {
  it('returns an empty object for empty nodes', () => {
    expect(collectUsedAmounts([], 'step1', [])).toEqual({})
  })

  it('sums explicit amounts from other step nodes', () => {
    const nodes: IngredientNode[] = [
      {
        kind: 'leaf',
        id: 'step1',
        text: '',
        ingredientRefs: ['ing1'],
        ingredientAmounts: { ing1: '100' },
      },
    ]
    const result = collectUsedAmounts(nodes, 'other', [])
    expect(result['ing1']).toBe(100)
  })

  it('excludes the node matching excludeId', () => {
    const nodes: IngredientNode[] = [
      {
        kind: 'leaf',
        id: 'current',
        text: '',
        ingredientRefs: ['ing1'],
        ingredientAmounts: { ing1: '200' },
      },
    ]
    expect(collectUsedAmounts(nodes, 'current', [])).toEqual({})
  })

  it('treats a ref without an explicit amount as the full ingredient amount', () => {
    const nodes: IngredientNode[] = [
      { kind: 'leaf', id: 'step1', text: '', ingredientRefs: ['ing1'] },
    ]
    const options = [{ id: 'ing1', text: '300 g bloem' }]
    const result = collectUsedAmounts(nodes, 'other', options)
    expect(result['ing1']).toBe(300)
  })

  it('accumulates amounts across multiple step nodes', () => {
    const nodes: IngredientNode[] = [
      {
        kind: 'leaf',
        id: 's1',
        text: '',
        ingredientRefs: ['ing1'],
        ingredientAmounts: { ing1: '100' },
      },
      {
        kind: 'leaf',
        id: 's2',
        text: '',
        ingredientRefs: ['ing1'],
        ingredientAmounts: { ing1: '75' },
      },
    ]
    const result = collectUsedAmounts(nodes, 'current', [])
    expect(result['ing1']).toBe(175)
  })

  it('recurses into group children', () => {
    const nodes: IngredientNode[] = [
      {
        kind: 'group',
        title: 'G',
        children: [
          {
            kind: 'leaf',
            id: 's1',
            text: '',
            ingredientRefs: ['ing1'],
            ingredientAmounts: { ing1: '50' },
          },
        ],
      },
    ]
    const result = collectUsedAmounts(nodes, 'other', [])
    expect(result['ing1']).toBe(50)
  })
})

// ---------------------------------------------------------------------------
// normalizeStepAmount
// ---------------------------------------------------------------------------

describe('normalizeStepAmount', () => {
  it('converts a decimal to a fraction for a volume unit', () => {
    expect(normalizeStepAmount('0.5', '2 el olie')).toBe('1/2')
  })

  it('converts a decimal mixed number to fraction notation for a volume unit', () => {
    expect(normalizeStepAmount('1.5', '2 tbsp mosterd')).toBe('1 1/2')
  })

  it('normalises a dot-decimal to comma notation for a non-volume unit', () => {
    expect(normalizeStepAmount('1,5', '200 g bloem')).toBe('1,5')
  })

  it('leaves an integer amount unchanged for a non-volume unit', () => {
    expect(normalizeStepAmount('100', '200 g bloem')).toBe('100')
  })

  it('returns the original string unchanged when it is not a valid number', () => {
    expect(normalizeStepAmount('abc', '200 g bloem')).toBe('abc')
  })
})

// ---------------------------------------------------------------------------
// pruneOrphanedRefs
// ---------------------------------------------------------------------------

describe('pruneOrphanedRefs', () => {
  it('returns empty array for empty input', () => {
    expect(pruneOrphanedRefs([], new Set())).toEqual([])
  })

  it('leaves a node without refs unchanged', () => {
    const nodes: IngredientNode[] = [{ kind: 'leaf', id: 's1', text: 'Bak de ui' }]
    expect(pruneOrphanedRefs(nodes, new Set(['ing1']))).toEqual(nodes)
  })

  it('leaves a node whose refs are all valid unchanged', () => {
    const nodes: IngredientNode[] = [
      {
        kind: 'leaf',
        id: 's1',
        text: 'Bak de ui',
        ingredientRefs: ['ing1', 'ing2'],
        ingredientAmounts: { ing1: '1', ing2: '2' },
      },
    ]
    const result = pruneOrphanedRefs(nodes, new Set(['ing1', 'ing2']))
    expect(result).toEqual(nodes)
  })

  it('strips a ref that is no longer in validIds', () => {
    const nodes: IngredientNode[] = [
      {
        kind: 'leaf',
        id: 's1',
        text: 'Bak de ui',
        ingredientRefs: ['ing1', 'ing2'],
        ingredientAmounts: { ing1: '1', ing2: '2' },
      },
    ]
    const result = pruneOrphanedRefs(nodes, new Set(['ing1']))
    const leaf = result[0]
    if (leaf.kind !== 'leaf') throw new Error('expected leaf')
    expect(leaf.ingredientRefs).toEqual(['ing1'])
    expect(leaf.ingredientAmounts).toEqual({ ing1: '1' })
  })

  it('removes ingredientRefs and ingredientAmounts entirely when all refs are orphaned', () => {
    const nodes: IngredientNode[] = [
      {
        kind: 'leaf',
        id: 's1',
        text: 'Bak de ui',
        ingredientRefs: ['ing1'],
        ingredientAmounts: { ing1: '1' },
      },
    ]
    const result = pruneOrphanedRefs(nodes, new Set())
    const leaf = result[0]
    if (leaf.kind !== 'leaf') throw new Error('expected leaf')
    expect(leaf.ingredientRefs).toBeUndefined()
    expect(leaf.ingredientAmounts).toBeUndefined()
  })

  it('recurses into group children', () => {
    const nodes: IngredientNode[] = [
      {
        kind: 'group',
        id: 'g1',
        title: 'Bereiding',
        children: [
          {
            kind: 'leaf',
            id: 's1',
            text: 'Bak de ui',
            ingredientRefs: ['ing1', 'ing2'],
            ingredientAmounts: { ing1: '1', ing2: '2' },
          },
        ],
      },
    ]
    const result = pruneOrphanedRefs(nodes, new Set(['ing1']))
    const group = result[0]
    if (group.kind !== 'group') throw new Error('expected group')
    const leaf = group.children[0]
    if (leaf.kind !== 'leaf') throw new Error('expected leaf')
    expect(leaf.ingredientRefs).toEqual(['ing1'])
    expect(leaf.ingredientAmounts).toEqual({ ing1: '1' })
  })
})
