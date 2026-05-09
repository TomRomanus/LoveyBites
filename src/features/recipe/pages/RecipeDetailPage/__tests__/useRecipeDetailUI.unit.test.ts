import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useRecipeDetailUI } from '../useRecipeDetailUI'

describe('useRecipeDetailUI', () => {
  it('starts with all states false', () => {
    const { result } = renderHook(() => useRecipeDetailUI())
    expect(result.current.cookMode).toBe(false)
    expect(result.current.calendarOpen).toBe(false)
    expect(result.current.showActions).toBe(false)
    expect(result.current.confirmDelete).toBe(false)
    expect(result.current.deleting).toBe(false)
  })

  it('setCookMode toggles cook mode on and off', () => {
    const { result } = renderHook(() => useRecipeDetailUI())
    act(() => result.current.setCookMode(true))
    expect(result.current.cookMode).toBe(true)
    act(() => result.current.setCookMode(false))
    expect(result.current.cookMode).toBe(false)
  })

  it('setCalendarOpen toggles calendar open state', () => {
    const { result } = renderHook(() => useRecipeDetailUI())
    act(() => result.current.setCalendarOpen(true))
    expect(result.current.calendarOpen).toBe(true)
    act(() => result.current.setCalendarOpen(false))
    expect(result.current.calendarOpen).toBe(false)
  })

  it('setShowActions toggles the actions sheet', () => {
    const { result } = renderHook(() => useRecipeDetailUI())
    act(() => result.current.setShowActions(true))
    expect(result.current.showActions).toBe(true)
    act(() => result.current.setShowActions(false))
    expect(result.current.showActions).toBe(false)
  })

  it('setConfirmDelete toggles delete confirmation dialog', () => {
    const { result } = renderHook(() => useRecipeDetailUI())
    act(() => result.current.setConfirmDelete(true))
    expect(result.current.confirmDelete).toBe(true)
    act(() => result.current.setConfirmDelete(false))
    expect(result.current.confirmDelete).toBe(false)
  })

  it('setDeleting toggles deleting loading state', () => {
    const { result } = renderHook(() => useRecipeDetailUI())
    act(() => result.current.setDeleting(true))
    expect(result.current.deleting).toBe(true)
    act(() => result.current.setDeleting(false))
    expect(result.current.deleting).toBe(false)
  })

  it('each state is independent of the others', () => {
    const { result } = renderHook(() => useRecipeDetailUI())
    act(() => result.current.setCookMode(true))
    act(() => result.current.setCalendarOpen(true))
    expect(result.current.cookMode).toBe(true)
    expect(result.current.calendarOpen).toBe(true)
    expect(result.current.showActions).toBe(false)
    expect(result.current.confirmDelete).toBe(false)
    expect(result.current.deleting).toBe(false)
  })
})
