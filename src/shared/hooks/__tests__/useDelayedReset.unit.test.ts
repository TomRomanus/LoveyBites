import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useDelayedReset from '../useDelayedReset'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('useDelayedReset', () => {
  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDelayedReset(false, false, 1500))
    expect(result.current).toBe(false)
  })

  it('updates to the new value immediately when the prop changes', () => {
    const { result, rerender } = renderHook(
      ({ v }) => useDelayedReset(v, false, 1500),
      { initialProps: { v: false } },
    )
    rerender({ v: true })
    expect(result.current).toBe(true)
  })

  it('resets back to resetTo after the delay elapses', () => {
    const { result, rerender } = renderHook(
      ({ v }) => useDelayedReset(v, false, 1500),
      { initialProps: { v: false } },
    )
    rerender({ v: true })
    expect(result.current).toBe(true)
    act(() => vi.advanceTimersByTime(1500))
    expect(result.current).toBe(false)
  })

  it('does not fire a reset timer when value is already equal to resetTo', () => {
    const { result, rerender } = renderHook(
      ({ v }) => useDelayedReset(v, false, 1000),
      { initialProps: { v: false } },
    )
    // value starts as resetTo — no timer should fire
    rerender({ v: false })
    act(() => vi.advanceTimersByTime(2000))
    expect(result.current).toBe(false)
  })

  it('cancels the previous timer when value changes again before the delay', () => {
    const { result, rerender } = renderHook(
      ({ v }: { v: boolean }) => useDelayedReset(v, false, 1000),
      { initialProps: { v: false } },
    )
    rerender({ v: true })
    expect(result.current).toBe(true)

    // Advance partway — timer should not have fired yet
    act(() => vi.advanceTimersByTime(500))
    expect(result.current).toBe(true)

    // Change value back — this should cancel the old timer and set value to false directly
    rerender({ v: false })
    expect(result.current).toBe(false)

    // Advance past the original deadline — no stale timer should trigger
    act(() => vi.advanceTimersByTime(1000))
    expect(result.current).toBe(false)
  })
})
