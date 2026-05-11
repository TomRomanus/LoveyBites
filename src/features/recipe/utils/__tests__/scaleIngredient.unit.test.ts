import { describe, it, expect } from 'vitest'
import { scaleIngredientText, scaleIngredients, scaleStepAmounts } from '../scaleIngredient'
import type { IngredientNode } from '@/features/recipe/types/recipe'

describe('scaleIngredientText', () => {
  it('returns the text unchanged when ratio is 1', () => {
    expect(scaleIngredientText('4 eieren', 1)).toBe('4 eieren')
  })

  it('returns the text unchanged when there is no leading number', () => {
    expect(scaleIngredientText('zout naar smaak', 2)).toBe('zout naar smaak')
  })

  it('scales an integer down to another integer', () => {
    expect(scaleIngredientText('4 eieren', 0.5)).toBe('2 eieren')
  })

  it('scales an integer up to another integer', () => {
    expect(scaleIngredientText('3 eieren', 2)).toBe('6 eieren')
  })

  it('handles a decimal-comma input and scales it to an integer', () => {
    expect(scaleIngredientText('1,5 dl', 2)).toBe('3 dl')
  })

  it('parses a fraction input and formats as fraction symbol for volume unit', () => {
    // 1/2 * 2 = 1 → integer → "1 tsp zout"
    expect(scaleIngredientText('1/2 tsp zout', 2)).toBe('1 tsp zout')
  })

  it('parses a mixed number and scales correctly', () => {
    // 1 1/2 * 2 = 3 → "3 cup melk"
    expect(scaleIngredientText('1 1/2 cup melk', 2)).toBe('3 cup melk')
  })

  it('formats result as fraction for a volume unit (el) when result is 1/2', () => {
    expect(scaleIngredientText('1 el olie', 0.5)).toBe('1/2 el olie')
  })

  it('formats result as fraction for a volume unit (el) when scaling from different input', () => {
    expect(scaleIngredientText('2 el olie', 0.25)).toBe('1/2 el olie')
  })

  it('formats result with no decimal for non-volume unit when result is integer', () => {
    // 300 * 1.5 = 450 → "450 g bloem"
    expect(scaleIngredientText('300 g bloem', 1.5)).toBe('450 g bloem')
  })

  it('formats result as integer when multiplication yields a whole number', () => {
    // 100 * 1.3 = 130 → "130 g"
    expect(scaleIngredientText('100 g', 1.3)).toBe('130 g')
  })
})

describe('scaleIngredients', () => {
  it('scales all leaf node texts by the given ratio', () => {
    const nodes: IngredientNode[] = [
      { kind: 'leaf', text: '2 eieren' },
      { kind: 'leaf', text: '100 g bloem' },
    ]
    const result = scaleIngredients(nodes, 2)
    expect(result[0]).toMatchObject({ kind: 'leaf', text: '4 eieren' })
    expect(result[1]).toMatchObject({ kind: 'leaf', text: '200 g bloem' })
  })

  it('leaves leaf texts without a leading number unchanged', () => {
    const nodes: IngredientNode[] = [{ kind: 'leaf', text: 'zout naar smaak' }]
    const result = scaleIngredients(nodes, 3)
    expect(result[0]).toMatchObject({ kind: 'leaf', text: 'zout naar smaak' })
  })

  it('recurses into group children and scales their leaf texts', () => {
    const nodes: IngredientNode[] = [
      {
        kind: 'group',
        title: 'Saus',
        children: [
          { kind: 'leaf', text: '4 el tomatenpuree' },
          { kind: 'leaf', text: '200 g tomaten' },
        ],
      },
    ]
    const result = scaleIngredients(nodes, 0.5)
    expect(result[0].kind).toBe('group')
    if (result[0].kind === 'group') {
      expect(result[0].children[0]).toMatchObject({ kind: 'leaf', text: '2 el tomatenpuree' })
      expect(result[0].children[1]).toMatchObject({ kind: 'leaf', text: '100 g tomaten' })
    }
  })

  it('preserves other leaf properties while scaling text', () => {
    const nodes: IngredientNode[] = [
      { kind: 'leaf', text: '2 eieren', id: 'leaf-1', ingredientRefs: ['ref-a'] },
    ]
    const result = scaleIngredients(nodes, 2)
    expect(result[0]).toMatchObject({
      kind: 'leaf',
      text: '4 eieren',
      id: 'leaf-1',
      ingredientRefs: ['ref-a'],
    })
  })
})

// ---------------------------------------------------------------------------
// scaleStepAmounts
// ---------------------------------------------------------------------------

describe('scaleStepAmounts', () => {
  it('returns the same reference when ratio is 1', () => {
    const nodes: IngredientNode[] = [
      { kind: 'leaf', id: 's1', text: 'Bak ui', ingredientAmounts: { ing1: '1/2' } },
    ]
    expect(scaleStepAmounts(nodes, 1)).toBe(nodes)
  })

  it('scales explicit integer amounts by the given ratio', () => {
    const nodes: IngredientNode[] = [
      { kind: 'leaf', id: 's1', text: '', ingredientAmounts: { ing1: '100' } },
    ]
    const result = scaleStepAmounts(nodes, 2)
    const leaf = result[0]
    if (leaf.kind !== 'leaf') throw new Error('Expected leaf')
    expect(leaf.ingredientAmounts?.['ing1']).toBe('200')
  })

  it('scales fraction amounts and formats as fraction', () => {
    const nodes: IngredientNode[] = [
      { kind: 'leaf', id: 's1', text: '', ingredientAmounts: { ing1: '1/2' } },
    ]
    const result = scaleStepAmounts(nodes, 2)
    const leaf = result[0]
    if (leaf.kind !== 'leaf') throw new Error('Expected leaf')
    expect(leaf.ingredientAmounts?.['ing1']).toBe('1')
  })

  it('leaves a leaf without ingredientAmounts unchanged (same reference)', () => {
    const leaf: IngredientNode = { kind: 'leaf', id: 's1', text: 'Doe zout erbij' }
    const nodes: IngredientNode[] = [leaf]
    const result = scaleStepAmounts(nodes, 3)
    expect(result[0]).toBe(leaf)
  })

  it('passes through non-numeric amount strings unchanged', () => {
    const nodes: IngredientNode[] = [
      { kind: 'leaf', id: 's1', text: '', ingredientAmounts: { ing1: 'naar smaak' } },
    ]
    const result = scaleStepAmounts(nodes, 2)
    const leaf = result[0]
    if (leaf.kind !== 'leaf') throw new Error('Expected leaf')
    expect(leaf.ingredientAmounts?.['ing1']).toBe('naar smaak')
  })

  it('recurses into group children', () => {
    const nodes: IngredientNode[] = [
      {
        kind: 'group',
        title: 'Groep',
        children: [
          { kind: 'leaf', id: 's1', text: '', ingredientAmounts: { ing1: '50' } },
        ],
      },
    ]
    const result = scaleStepAmounts(nodes, 2)
    const group = result[0]
    if (group.kind !== 'group') throw new Error('Expected group')
    const leaf = group.children[0]
    if (leaf.kind !== 'leaf') throw new Error('Expected leaf')
    expect(leaf.ingredientAmounts?.['ing1']).toBe('100')
  })
})
