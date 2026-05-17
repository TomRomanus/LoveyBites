import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { ReactNode } from 'react'
import { TimerProvider, useCookTimers } from './TimerContext'

const wrapper = ({ children }: { children: ReactNode }) => (
  <TimerProvider>{children}</TimerProvider>
)

describe('TimerContext', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('startTimer adds a running timer', () => {
    const { result } = renderHook(() => useCookTimers(), { wrapper })
    act(() => { result.current.startTimer('pasta', 600) })
    expect(result.current.timers).toHaveLength(1)
    expect(result.current.timers[0]).toMatchObject({
      label: 'pasta',
      durationSecs: 600,
      remainingSecs: 600,
      status: 'running',
    })
  })

  it('decrements remainingSecs each second', () => {
    const { result } = renderHook(() => useCookTimers(), { wrapper })
    act(() => { result.current.startTimer('pasta', 10) })
    act(() => { vi.advanceTimersByTime(3000) })
    expect(result.current.timers[0].remainingSecs).toBe(7)
  })

  it('transitions to finished when countdown hits 0', () => {
    const { result } = renderHook(() => useCookTimers(), { wrapper })
    act(() => { result.current.startTimer('pasta', 3) })
    act(() => { vi.advanceTimersByTime(3000) })
    expect(result.current.timers[0].status).toBe('finished')
    expect(result.current.timers[0].remainingSecs).toBe(0)
  })

  it('pauseTimer stops countdown', () => {
    const { result } = renderHook(() => useCookTimers(), { wrapper })
    act(() => { result.current.startTimer('pasta', 10) })
    const id = result.current.timers[0].id
    act(() => { vi.advanceTimersByTime(2000) })        // tick twice: remainingSecs = 8
    expect(result.current.timers[0].remainingSecs).toBe(8)
    act(() => { result.current.pauseTimer(id) })
    act(() => { vi.advanceTimersByTime(5000) })        // should not tick further
    expect(result.current.timers[0].remainingSecs).toBe(8)
    expect(result.current.timers[0].status).toBe('paused')
  })

  it('resumeTimer resumes countdown', () => {
    const { result } = renderHook(() => useCookTimers(), { wrapper })
    act(() => { result.current.startTimer('pasta', 10) })
    const id = result.current.timers[0].id
    act(() => { result.current.pauseTimer(id) })
    act(() => { result.current.resumeTimer(id) })
    act(() => { vi.advanceTimersByTime(3000) })
    expect(result.current.timers[0].remainingSecs).toBe(7)
  })

  it('dismissTimer removes the timer', () => {
    const { result } = renderHook(() => useCookTimers(), { wrapper })
    act(() => { result.current.startTimer('pasta', 10) })
    const id = result.current.timers[0].id
    act(() => { result.current.dismissTimer(id) })
    expect(result.current.timers).toHaveLength(0)
  })

  it('notification fires exactly once when timer finishes', () => {
    // jsdom does not define navigator.vibrate; define it so spyOn can wrap it
    Object.defineProperty(navigator, 'vibrate', {
      value: vi.fn(),
      configurable: true,
      writable: true,
    })
    const vibrateSpy = vi.spyOn(navigator, 'vibrate').mockReturnValue(true)
    const { result } = renderHook(() => useCookTimers(), { wrapper })
    act(() => { result.current.startTimer('pasta', 2) })
    act(() => { vi.advanceTimersByTime(2000) })   // finishes
    expect(vibrateSpy).toHaveBeenCalledTimes(1)
    act(() => { vi.advanceTimersByTime(3000) })   // more ticks — should not re-notify
    expect(vibrateSpy).toHaveBeenCalledTimes(1)
    vibrateSpy.mockRestore()
  })

  it('registerCookModeReturn stores the function', () => {
    const { result } = renderHook(() => useCookTimers(), { wrapper })
    const fn = vi.fn()
    act(() => { result.current.registerCookModeReturn(fn) })
    expect(result.current.cookModeReturn).toBe(fn)
  })

  it('unregisterCookModeReturn clears the function', () => {
    const { result } = renderHook(() => useCookTimers(), { wrapper })
    act(() => { result.current.registerCookModeReturn(vi.fn()) })
    act(() => { result.current.unregisterCookModeReturn() })
    expect(result.current.cookModeReturn).toBeNull()
  })
})
