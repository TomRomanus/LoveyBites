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
    act(() => { vi.advanceTimersByTime(2000) })   // finishes — 1st vibrate
    expect(vibrateSpy).toHaveBeenCalledTimes(1)
    act(() => { vi.advanceTimersByTime(3000) })   // continuous interval fires at 2250 ms
    expect(vibrateSpy).toHaveBeenCalledTimes(2)
    vibrateSpy.mockRestore()
  })

  describe('addTime', () => {
    it('adds seconds to a running timer', () => {
      const { result } = renderHook(() => useCookTimers(), { wrapper })
      act(() => { result.current.startTimer('pasta', 60) })
      const id = result.current.timers[0].id
      act(() => { result.current.addTime(id, 60) })
      expect(result.current.timers[0].remainingSecs).toBe(120)
      expect(result.current.timers[0].status).toBe('running')
    })

    it('adds seconds to a paused timer without resuming it', () => {
      const { result } = renderHook(() => useCookTimers(), { wrapper })
      act(() => { result.current.startTimer('pasta', 60) })
      const id = result.current.timers[0].id
      act(() => { result.current.pauseTimer(id) })
      act(() => { result.current.addTime(id, 30) })
      expect(result.current.timers[0].remainingSecs).toBe(90)
      expect(result.current.timers[0].status).toBe('paused')
    })

    it('resets a finished timer to the given seconds and resumes it', () => {
      const { result } = renderHook(() => useCookTimers(), { wrapper })
      act(() => { result.current.startTimer('pasta', 0) })
      const id = result.current.timers[0].id
      act(() => { result.current.addTime(id, 60) })
      expect(result.current.timers[0].remainingSecs).toBe(60)
      expect(result.current.timers[0].status).toBe('running')
    })

    it('allows the finish notification to fire again after adding time to a finished timer', () => {
      Object.defineProperty(navigator, 'vibrate', {
        value: vi.fn(), configurable: true, writable: true,
      })
      const vibrateSpy = vi.spyOn(navigator, 'vibrate').mockReturnValue(true)
      const { result } = renderHook(() => useCookTimers(), { wrapper })
      act(() => { result.current.startTimer('pasta', 1) })
      act(() => { vi.advanceTimersByTime(1000) })   // finishes — 1st notification
      expect(vibrateSpy).toHaveBeenCalledTimes(1)
      const id = result.current.timers[0].id
      act(() => { result.current.addTime(id, 1) })  // restart — cleanup calls vibrate(0) to stop buzzing
      act(() => { vi.advanceTimersByTime(1000) })   // finishes again — 2nd notification
      expect(vibrateSpy).toHaveBeenCalledTimes(3)  // initial + cleanup-stop + 2nd finish
      vibrateSpy.mockRestore()
    })
  })

  it('replay restarts a finished timer to its original duration', () => {
    const { result } = renderHook(() => useCookTimers(), { wrapper })
    act(() => { result.current.startTimer('pasta', 180) })
    const id = result.current.timers[0].id
    act(() => { vi.advanceTimersByTime(180_000) })
    expect(result.current.timers[0].status).toBe('finished')
    act(() => { result.current.addTime(id, result.current.timers[0].durationSecs) })
    expect(result.current.timers[0].remainingSecs).toBe(180)
    expect(result.current.timers[0].status).toBe('running')
  })

  describe('page visibility resync', () => {
    it('resyncs remainingSecs from endTime when tab becomes visible', () => {
      const { result } = renderHook(() => useCookTimers(), { wrapper })
      act(() => { result.current.startTimer('pasta', 10) })
      // Advance Date.now() without firing the interval (simulates background throttling)
      vi.setSystemTime(new Date(Date.now() + 7000))
      act(() => { document.dispatchEvent(new Event('visibilitychange')) })
      expect(result.current.timers[0].remainingSecs).toBe(3)
    })

    it('marks timer as finished if endTime has already passed when tab becomes visible', () => {
      const { result } = renderHook(() => useCookTimers(), { wrapper })
      act(() => { result.current.startTimer('pasta', 5) })
      vi.setSystemTime(new Date(Date.now() + 6000))
      act(() => { document.dispatchEvent(new Event('visibilitychange')) })
      expect(result.current.timers[0].status).toBe('finished')
      expect(result.current.timers[0].remainingSecs).toBe(0)
    })
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
