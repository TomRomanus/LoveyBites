import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import useStarDrag from '../useStarDrag'

vi.mock('framer-motion', () => ({ animate: vi.fn() }))

// Injects a mock DOM node with a controllable bounding rect into the hook's rowRef.
function mockRowRect(result: { current: ReturnType<typeof useStarDrag> }, left: number, width: number) {
  ;(result.current.rowRef as any).current = {
    getBoundingClientRect: () => ({ left, width }),
  }
}

describe('useStarDrag', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('initial state', () => {
    it('livePos equals the value prop', () => {
      const { result } = renderHook(() => useStarDrag({ value: 3 }))
      expect(result.current.livePos).toBe(3)
    })

    it('dir starts as "up"', () => {
      const { result } = renderHook(() => useStarDrag({ value: 2 }))
      expect(result.current.dir).toBe('up')
    })

    it('onMouseDown is undefined when onChange is not provided', () => {
      const { result } = renderHook(() => useStarDrag({ value: 2 }))
      expect(result.current.onMouseDown).toBeUndefined()
    })

    it('onTouchStart is undefined when onChange is not provided', () => {
      const { result } = renderHook(() => useStarDrag({ value: 2 }))
      expect(result.current.onTouchStart).toBeUndefined()
    })

    it('onMouseDown is defined when onChange is provided', () => {
      const { result } = renderHook(() => useStarDrag({ value: 2, onChange: vi.fn() }))
      expect(result.current.onMouseDown).toBeDefined()
    })

    it('onTouchStart is defined when onChange is provided', () => {
      const { result } = renderHook(() => useStarDrag({ value: 2, onChange: vi.fn() }))
      expect(result.current.onTouchStart).toBeDefined()
    })
  })

  describe('value prop sync', () => {
    it('livePos updates when value prop changes', () => {
      const { result, rerender } = renderHook(({ v }: { v: number }) => useStarDrag({ value: v }), {
        initialProps: { v: 2 },
      })
      expect(result.current.livePos).toBe(2)
      rerender({ v: 4 })
      expect(result.current.livePos).toBe(4)
    })
  })

  describe('mousedown', () => {
    it('updates livePos immediately to the clicked position', () => {
      const { result } = renderHook(() => useStarDrag({ value: 0, onChange: vi.fn() }))
      // 70px into a 140px row = position 2.5 out of 5
      mockRowRect(result, 0, 140)
      act(() => {
        result.current.onMouseDown!({ clientX: 70 } as React.MouseEvent<HTMLDivElement>)
      })
      expect(result.current.livePos).toBeCloseTo(2.5)
    })
  })

  describe('mousemove', () => {
    it('updates livePos as the pointer moves while dragging', () => {
      const { result } = renderHook(() => useStarDrag({ value: 0, onChange: vi.fn() }))
      mockRowRect(result, 0, 140)
      act(() => {
        result.current.onMouseDown!({ clientX: 0 } as React.MouseEvent<HTMLDivElement>)
      })
      act(() => {
        window.dispatchEvent(new MouseEvent('mousemove', { clientX: 70 }))
      })
      expect(result.current.livePos).toBeCloseTo(2.5)
    })

    it('does not update livePos from mousemove when not dragging', () => {
      const { result } = renderHook(() => useStarDrag({ value: 0, onChange: vi.fn() }))
      mockRowRect(result, 0, 140)
      act(() => {
        window.dispatchEvent(new MouseEvent('mousemove', { clientX: 70 }))
      })
      expect(result.current.livePos).toBe(0) // unchanged
    })
  })

  describe('mouseup / drag end', () => {
    it('calls onChange with the snapped value when drag ends', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() => useStarDrag({ value: 0, onChange }))
      // 84px into 140px row → (84/140)*5 = 3.0 → snapToHalf(3.0) = 3
      mockRowRect(result, 0, 140)
      act(() => {
        result.current.onMouseDown!({ clientX: 84 } as React.MouseEvent<HTMLDivElement>)
      })
      act(() => {
        window.dispatchEvent(new MouseEvent('mouseup'))
      })
      expect(onChange).toHaveBeenCalledWith(3)
    })

    it('snaps to the nearest half-star on drag end', () => {
      const onChange = vi.fn()
      const { result } = renderHook(() => useStarDrag({ value: 0, onChange }))
      // 55px into 140px → (55/140)*5 ≈ 1.964 → snapToHalf(1.964) = 2
      mockRowRect(result, 0, 140)
      act(() => {
        result.current.onMouseDown!({ clientX: 55 } as React.MouseEvent<HTMLDivElement>)
      })
      act(() => {
        window.dispatchEvent(new MouseEvent('mouseup'))
      })
      expect(onChange).toHaveBeenCalledWith(2)
    })

    it('sets dir to "up" when ending on a higher value', () => {
      const { result } = renderHook(() => useStarDrag({ value: 1, onChange: vi.fn() }))
      mockRowRect(result, 0, 140)
      // drag to position 3 (84px)
      act(() => {
        result.current.onMouseDown!({ clientX: 84 } as React.MouseEvent<HTMLDivElement>)
      })
      act(() => {
        window.dispatchEvent(new MouseEvent('mouseup'))
      })
      expect(result.current.dir).toBe('up')
    })

    it('sets dir to "down" when ending on a lower value', () => {
      const { result } = renderHook(() => useStarDrag({ value: 4, onChange: vi.fn() }))
      mockRowRect(result, 0, 140)
      // drag to position 1 (28px)
      act(() => {
        result.current.onMouseDown!({ clientX: 28 } as React.MouseEvent<HTMLDivElement>)
      })
      act(() => {
        window.dispatchEvent(new MouseEvent('mouseup'))
      })
      expect(result.current.dir).toBe('down')
    })

    it('does not call onChange when mouseup fires without a prior mousedown', () => {
      const onChange = vi.fn()
      renderHook(() => useStarDrag({ value: 0, onChange }))
      act(() => {
        window.dispatchEvent(new MouseEvent('mouseup'))
      })
      expect(onChange).not.toHaveBeenCalled()
    })
  })
})
