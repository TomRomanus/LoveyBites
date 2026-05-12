import { describe, it, expect } from 'vitest'
import { flattenCookSteps, updateStepComment } from '../cookSteps'
import type { TreeNode } from '@/features/cooking/types/cooking'

describe('flattenCookSteps', () => {
  it('returns an empty array for empty input', () => {
    expect(flattenCookSteps([])).toEqual([])
  })

  it('flattens a single leaf node', () => {
    const nodes: TreeNode[] = [{ kind: 'leaf', text: 'Kook de pasta' }]
    const result = flattenCookSteps(nodes)
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ text: 'Kook de pasta', globalIndex: 0 })
  })

  it('assigns sequential globalIndex values across multiple leaves', () => {
    const nodes: TreeNode[] = [
      { kind: 'leaf', text: 'Stap 1' },
      { kind: 'leaf', text: 'Stap 2' },
      { kind: 'leaf', text: 'Stap 3' },
    ]
    const result = flattenCookSteps(nodes)
    expect(result.map((s) => s.globalIndex)).toEqual([0, 1, 2])
  })

  it('extracts leaves from a group and attaches the section title', () => {
    const nodes: TreeNode[] = [
      {
        kind: 'group',
        title: 'De saus',
        children: [
          { kind: 'leaf', text: 'Fruit de ui' },
          { kind: 'leaf', text: 'Voeg tomaten toe' },
        ],
      },
    ]
    const result = flattenCookSteps(nodes)
    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({
      text: 'Fruit de ui',
      sectionTitle: 'De saus',
      globalIndex: 0,
    })
    expect(result[1]).toMatchObject({
      text: 'Voeg tomaten toe',
      sectionTitle: 'De saus',
      globalIndex: 1,
    })
  })

  it('preserves ingredientRefs on leaf nodes', () => {
    const nodes: TreeNode[] = [
      { kind: 'leaf', text: 'Kook de pasta', ingredientRefs: ['id-1', 'id-2'] },
    ]
    const result = flattenCookSteps(nodes)
    expect(result[0].ingredientRefs).toEqual(['id-1', 'id-2'])
  })

  it('leaves without ingredientRefs have undefined ingredientRefs', () => {
    const nodes: TreeNode[] = [{ kind: 'leaf', text: 'Kook de pasta' }]
    const result = flattenCookSteps(nodes)
    expect(result[0].ingredientRefs).toBeUndefined()
  })

  it('handles mixed top-level leaves and groups with correct globalIndex', () => {
    const nodes: TreeNode[] = [
      { kind: 'leaf', text: 'Stap 1' },
      {
        kind: 'group',
        title: 'Sectie A',
        children: [{ kind: 'leaf', text: 'Stap 2' }],
      },
      { kind: 'leaf', text: 'Stap 3' },
    ]
    const result = flattenCookSteps(nodes)
    expect(result).toHaveLength(3)
    expect(result[0]).toMatchObject({ text: 'Stap 1', sectionTitle: undefined, globalIndex: 0 })
    expect(result[1]).toMatchObject({ text: 'Stap 2', sectionTitle: 'Sectie A', globalIndex: 1 })
    expect(result[2]).toMatchObject({ text: 'Stap 3', sectionTitle: undefined, globalIndex: 2 })
  })

  it('handles nested groups by using the innermost group title', () => {
    const nodes: TreeNode[] = [
      {
        kind: 'group',
        title: 'Outer',
        children: [
          {
            kind: 'group',
            title: 'Inner',
            children: [{ kind: 'leaf', text: 'Deep stap' }],
          },
        ],
      },
    ]
    const result = flattenCookSteps(nodes)
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ text: 'Deep stap', sectionTitle: 'Inner', globalIndex: 0 })
  })

  it('returns empty array for a group with no children', () => {
    const nodes: TreeNode[] = [{ kind: 'group', title: 'Lege sectie', children: [] }]
    expect(flattenCookSteps(nodes)).toEqual([])
  })

  it('preserves comment on leaf nodes', () => {
    const nodes: TreeNode[] = [
      { kind: 'leaf', text: 'Kook de pasta', comment: 'Let op het kookpunt' },
    ]
    const result = flattenCookSteps(nodes)
    expect(result[0].comment).toBe('Let op het kookpunt')
  })

  it('leaves without comment have undefined comment', () => {
    const nodes: TreeNode[] = [{ kind: 'leaf', text: 'Kook de pasta' }]
    const result = flattenCookSteps(nodes)
    expect(result[0].comment).toBeUndefined()
  })
})

describe('updateStepComment', () => {
  it('sets a comment on the leaf at globalIndex 0', () => {
    const nodes: TreeNode[] = [{ kind: 'leaf', text: 'Kook de pasta' }]
    const result = updateStepComment(nodes, 0, 'Let op!')
    expect((result[0] as { kind: 'leaf'; comment?: string }).comment).toBe('Let op!')
  })

  it('sets a comment on the correct leaf when there are multiple', () => {
    const nodes: TreeNode[] = [
      { kind: 'leaf', text: 'Stap 1' },
      { kind: 'leaf', text: 'Stap 2' },
    ]
    const result = updateStepComment(nodes, 1, 'Notitie')
    expect((result[0] as { kind: 'leaf'; comment?: string }).comment).toBeUndefined()
    expect((result[1] as { kind: 'leaf'; comment?: string }).comment).toBe('Notitie')
  })

  it('clears a comment when undefined is passed', () => {
    const nodes: TreeNode[] = [{ kind: 'leaf', text: 'Kook de pasta', comment: 'Oud bericht' }]
    const result = updateStepComment(nodes, 0, undefined)
    expect((result[0] as { kind: 'leaf'; comment?: string }).comment).toBeUndefined()
    expect('comment' in result[0]).toBe(false)
  })

  it('does not modify other leaves when targeting one', () => {
    const nodes: TreeNode[] = [
      { kind: 'leaf', text: 'Stap 1', comment: 'Blijft' },
      { kind: 'leaf', text: 'Stap 2' },
    ]
    const result = updateStepComment(nodes, 1, 'Nieuw')
    expect((result[0] as { kind: 'leaf'; comment?: string }).comment).toBe('Blijft')
  })

  it('handles a leaf inside a nested group', () => {
    const nodes: TreeNode[] = [
      { kind: 'leaf', text: 'Stap 1' },
      {
        kind: 'group',
        title: 'Sectie',
        children: [{ kind: 'leaf', text: 'Stap 2' }],
      },
    ]
    const result = updateStepComment(nodes, 1, 'In groep')
    const group = result[1] as { kind: 'group'; children: TreeNode[] }
    expect((group.children[0] as { kind: 'leaf'; comment?: string }).comment).toBe('In groep')
  })

  it('returns the same structure when globalIndex is out of range', () => {
    const nodes: TreeNode[] = [{ kind: 'leaf', text: 'Alleen stap' }]
    const result = updateStepComment(nodes, 99, 'Nergens')
    expect((result[0] as { kind: 'leaf'; comment?: string }).comment).toBeUndefined()
  })
})
