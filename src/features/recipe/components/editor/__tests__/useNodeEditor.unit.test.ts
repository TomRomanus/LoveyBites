import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { useNodeEditor } from '../useNodeEditor'
import type { IngredientNode } from '@/features/recipe/types/recipe'
import * as dndTree from '@/features/recipe/components/editor/dndTree'

vi.mock('@dnd-kit/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dnd-kit/core')>()
  return {
    ...actual,
    useSensor: vi.fn((sensor) => ({ sensor })),
    useSensors: vi.fn((...s) => s),
  }
})

vi.mock('@/features/recipe/components/editor/dndTree', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/recipe/components/editor/dndTree')>()
  return {
    ...actual,
    moveNodeInTree: vi.fn((nodes) => nodes),
  }
})

const leaf = (text: string, id: string): IngredientNode => ({ kind: 'leaf', text, id })
const group = (title: string, id: string, children: IngredientNode[] = []): IngredientNode => ({
  kind: 'group',
  title,
  id,
  children,
})

describe('useNodeEditor', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('initial state', () => {
    it('activeId starts as null', () => {
      const { result } = renderHook(() =>
        useNodeEditor({ nodes: [], onChange: vi.fn() }),
      )
      expect(result.current.activeId).toBeNull()
    })
  })

  describe('handleDragStart', () => {
    it('sets activeId to the dragged item id', () => {
      const { result } = renderHook(() =>
        useNodeEditor({ nodes: [], onChange: vi.fn() }),
      )
      act(() => {
        result.current.handleDragStart({ active: { id: 'node-1' } } as any)
      })
      expect(result.current.activeId).toBe('node-1')
    })
  })

  describe('handleDragEnd', () => {
    it('clears activeId after drag ends', () => {
      const { result } = renderHook(() =>
        useNodeEditor({ nodes: [], onChange: vi.fn() }),
      )
      act(() => {
        result.current.handleDragStart({ active: { id: 'node-1' } } as any)
      })
      act(() => {
        result.current.handleDragEnd({ active: { id: 'node-1' }, over: { id: 'node-2' } } as any)
      })
      expect(result.current.activeId).toBeNull()
    })

    it('does NOT call onChange when active and over have the same id', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() =>
        useNodeEditor({ nodes: [leaf('ui', 'node-1')], onChange }),
      )
      act(() => {
        result.current.handleDragEnd({ active: { id: 'node-1' }, over: { id: 'node-1' } } as any)
      })
      expect(onChange).not.toHaveBeenCalled()
    })

    it('does NOT call onChange when there is no over target', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() =>
        useNodeEditor({ nodes: [leaf('ui', 'node-1')], onChange }),
      )
      act(() => {
        result.current.handleDragEnd({ active: { id: 'node-1' }, over: null } as any)
      })
      expect(onChange).not.toHaveBeenCalled()
    })

    it('calls onChange with moved result when active and over differ', () => {
      const onChange = vi.fn()
      const nodes = [leaf('ui', 'node-1'), leaf('knoflook', 'node-2')]
      const movedNodes = [leaf('knoflook', 'node-2'), leaf('ui', 'node-1')]
      vi.mocked(dndTree.moveNodeInTree).mockReturnValue(movedNodes)

      const { result } = renderHook(() =>
        useNodeEditor({ nodes, onChange }),
      )
      act(() => {
        result.current.handleDragEnd({ active: { id: 'node-1' }, over: { id: 'node-2' } } as any)
      })
      expect(dndTree.moveNodeInTree).toHaveBeenCalledWith(nodes, 'node-1', 'node-2')
      expect(onChange).toHaveBeenCalledWith(movedNodes)
    })
  })

  describe('handleDragCancel', () => {
    it('resets activeId to null', () => {
      const { result } = renderHook(() =>
        useNodeEditor({ nodes: [], onChange: vi.fn() }),
      )
      act(() => {
        result.current.handleDragStart({ active: { id: 'node-1' } } as any)
      })
      act(() => {
        result.current.handleDragCancel()
      })
      expect(result.current.activeId).toBeNull()
    })
  })

  describe('availableSections', () => {
    it('filters out sections whose titles already exist in nodes', () => {
      const nodes = [group('Voorbereiding', 'g-1')]
      const { result } = renderHook(() =>
        useNodeEditor({
          nodes,
          onChange: vi.fn(),
          commonSections: ['Voorbereiding', 'Bereiding', 'Saus'],
        }),
      )
      expect(result.current.availableSections).toEqual(['Bereiding', 'Saus'])
    })

    it('returns all commonSections when nodes have no matching groups', () => {
      const nodes = [leaf('ui', 'leaf-1')]
      const { result } = renderHook(() =>
        useNodeEditor({
          nodes,
          onChange: vi.fn(),
          commonSections: ['Voorbereiding', 'Bereiding'],
        }),
      )
      expect(result.current.availableSections).toEqual(['Voorbereiding', 'Bereiding'])
    })

    it('returns empty array when commonSections is not provided', () => {
      const { result } = renderHook(() =>
        useNodeEditor({ nodes: [], onChange: vi.fn() }),
      )
      expect(result.current.availableSections).toEqual([])
    })
  })

  describe('leafIndexMap', () => {
    it('is undefined when ordered is false', () => {
      const nodes = [leaf('ui', 'leaf-1')]
      const { result } = renderHook(() =>
        useNodeEditor({ nodes, onChange: vi.fn(), ordered: false }),
      )
      expect(result.current.leafIndexMap).toBeUndefined()
    })

    it('is undefined when ordered is not provided', () => {
      const nodes = [leaf('ui', 'leaf-1')]
      const { result } = renderHook(() =>
        useNodeEditor({ nodes, onChange: vi.fn() }),
      )
      expect(result.current.leafIndexMap).toBeUndefined()
    })

    it('is a Map when ordered is true', () => {
      const nodes = [leaf('ui', 'leaf-1'), leaf('knoflook', 'leaf-2')]
      const { result } = renderHook(() =>
        useNodeEditor({ nodes, onChange: vi.fn(), ordered: true }),
      )
      expect(result.current.leafIndexMap).toBeInstanceOf(Map)
    })

    it('maps leaf ids to sequential indices when ordered is true', () => {
      const nodes = [leaf('ui', 'leaf-1'), leaf('knoflook', 'leaf-2')]
      const { result } = renderHook(() =>
        useNodeEditor({ nodes, onChange: vi.fn(), ordered: true }),
      )
      expect(result.current.leafIndexMap!.get('leaf-1')).toBe(0)
      expect(result.current.leafIndexMap!.get('leaf-2')).toBe(1)
    })
  })
})
