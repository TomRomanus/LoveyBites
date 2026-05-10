import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useCheckedSet from '../useCheckedSet'

describe('useCheckedSet', () => {
  it('starts with an empty checked set', () => {
    const { result } = renderHook(() => useCheckedSet())
    expect(result.current.checked.size).toBe(0)
  })

  it('toggle adds a key that is not yet present', () => {
    const { result } = renderHook(() => useCheckedSet())
    act(() => result.current.toggle('item-1'))
    expect(result.current.checked.has('item-1')).toBe(true)
  })

  it('toggle removes a key that is already present', () => {
    const { result } = renderHook(() => useCheckedSet())
    act(() => result.current.toggle('item-1'))
    act(() => result.current.toggle('item-1'))
    expect(result.current.checked.has('item-1')).toBe(false)
  })

  it('toggling different keys accumulates both in the set', () => {
    const { result } = renderHook(() => useCheckedSet())
    act(() => result.current.toggle('item-1'))
    act(() => result.current.toggle('item-2'))
    expect(result.current.checked.has('item-1')).toBe(true)
    expect(result.current.checked.has('item-2')).toBe(true)
    expect(result.current.checked.size).toBe(2)
  })

  it('reset clears all checked keys', () => {
    const { result } = renderHook(() => useCheckedSet())
    act(() => {
      result.current.toggle('item-1')
      result.current.toggle('item-2')
    })
    expect(result.current.checked.size).toBe(2)
    act(() => result.current.reset())
    expect(result.current.checked.size).toBe(0)
  })

  it('checked is a Set (supports .has())', () => {
    const { result } = renderHook(() => useCheckedSet())
    act(() => result.current.toggle('x'))
    expect(result.current.checked).toBeInstanceOf(Set)
    expect(result.current.checked.has('x')).toBe(true)
  })
})
