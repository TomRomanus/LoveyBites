import { describe, it, expect } from 'vitest'
import { flattenIngredientSections, flattenSteps } from '../recipeDisplay'
import type { IngredientNode } from '@/features/recipe/types/recipe'

describe('flattenIngredientSections', () => {
  it('returns [{ section: "", items: [] }] for empty input', () => {
    expect(flattenIngredientSections([])).toEqual([{ section: '', items: [] }])
  })

  it('collects all top-level leaves into a single section with empty section name', () => {
    const nodes: IngredientNode[] = [
      { kind: 'leaf', text: '2 eieren' },
      { kind: 'leaf', text: '100 g bloem' },
      { kind: 'leaf', text: 'zout naar smaak' },
    ]
    expect(flattenIngredientSections(nodes)).toEqual([
      { section: '', items: ['2 eieren', '100 g bloem', 'zout naar smaak'] },
    ])
  })

  it('maps a single group to a section with the group title', () => {
    const nodes: IngredientNode[] = [
      {
        kind: 'group',
        title: 'Deeg',
        children: [
          { kind: 'leaf', text: '200 g bloem' },
          { kind: 'leaf', text: '1 ei' },
        ],
      },
    ]
    expect(flattenIngredientSections(nodes)).toEqual([
      { section: 'Deeg', items: ['200 g bloem', '1 ei'] },
    ])
  })

  it('flushes loose leaves before a group as a separate leading section', () => {
    const nodes: IngredientNode[] = [
      { kind: 'leaf', text: 'olijfolie' },
      {
        kind: 'group',
        title: 'Saus',
        children: [{ kind: 'leaf', text: '400 g tomaten' }],
      },
    ]
    expect(flattenIngredientSections(nodes)).toEqual([
      { section: '', items: ['olijfolie'] },
      { section: 'Saus', items: ['400 g tomaten'] },
    ])
  })

  it('places trailing loose leaves after a group as their own section', () => {
    const nodes: IngredientNode[] = [
      {
        kind: 'group',
        title: 'Deeg',
        children: [{ kind: 'leaf', text: '200 g bloem' }],
      },
      { kind: 'leaf', text: 'zout' },
    ]
    expect(flattenIngredientSections(nodes)).toEqual([
      { section: 'Deeg', items: ['200 g bloem'] },
      { section: '', items: ['zout'] },
    ])
  })

  it('produces multiple sections in order for multiple groups', () => {
    const nodes: IngredientNode[] = [
      {
        kind: 'group',
        title: 'Deeg',
        children: [{ kind: 'leaf', text: '200 g bloem' }],
      },
      {
        kind: 'group',
        title: 'Saus',
        children: [{ kind: 'leaf', text: '400 g tomaten' }],
      },
    ]
    expect(flattenIngredientSections(nodes)).toEqual([
      { section: 'Deeg', items: ['200 g bloem'] },
      { section: 'Saus', items: ['400 g tomaten'] },
    ])
  })

  it('uses an empty string as section name when a group title is empty', () => {
    const nodes: IngredientNode[] = [
      {
        kind: 'group',
        title: '',
        children: [{ kind: 'leaf', text: '1 ei' }],
      },
    ]
    expect(flattenIngredientSections(nodes)).toEqual([{ section: '', items: ['1 ei'] }])
  })
})

describe('flattenSteps', () => {
  it('returns an empty array for empty input', () => {
    expect(flattenSteps([])).toEqual([])
  })

  it('assigns phase "" to all top-level leaf nodes', () => {
    const nodes: IngredientNode[] = [
      { kind: 'leaf', text: 'Verwarm de oven' },
      { kind: 'leaf', text: 'Meng de ingrediënten' },
    ]
    const result = flattenSteps(nodes)
    expect(result).toEqual([
      { phase: '', text: 'Verwarm de oven', ingredientRefs: undefined },
      { phase: '', text: 'Meng de ingrediënten', ingredientRefs: undefined },
    ])
  })

  it('assigns the group title as phase to leaves inside a group', () => {
    const nodes: IngredientNode[] = [
      {
        kind: 'group',
        title: 'Voorbereiden',
        children: [
          { kind: 'leaf', text: 'Was de groenten' },
          { kind: 'leaf', text: 'Snijd de ui' },
        ],
      },
    ]
    const result = flattenSteps(nodes)
    expect(result).toEqual([
      { phase: 'Voorbereiden', text: 'Was de groenten', ingredientRefs: undefined },
      { phase: 'Voorbereiden', text: 'Snijd de ui', ingredientRefs: undefined },
    ])
  })

  it('uses the inner group title as phase for nested groups', () => {
    const nodes: IngredientNode[] = [
      {
        kind: 'group',
        title: 'Outer',
        children: [
          {
            kind: 'group',
            title: 'Inner',
            children: [{ kind: 'leaf', text: 'Diep stap' }],
          },
        ],
      },
    ]
    const result = flattenSteps(nodes)
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ phase: 'Inner', text: 'Diep stap' })
  })

  it('preserves ingredientRefs on leaf nodes', () => {
    const nodes: IngredientNode[] = [
      { kind: 'leaf', text: 'Voeg toe', ingredientRefs: ['id-1', 'id-2'] },
    ]
    const result = flattenSteps(nodes)
    expect(result[0].ingredientRefs).toEqual(['id-1', 'id-2'])
  })

  it('leaves ingredientRefs as undefined when not present on a leaf', () => {
    const nodes: IngredientNode[] = [{ kind: 'leaf', text: 'Roer goed' }]
    const result = flattenSteps(nodes)
    expect(result[0].ingredientRefs).toBeUndefined()
  })
})
