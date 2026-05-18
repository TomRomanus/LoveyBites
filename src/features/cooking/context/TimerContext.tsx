import {
  createContext, useContext, useRef, useState, useEffect,
  useCallback, ReactNode,
} from 'react'

export interface CookTimer {
  id: string
  label: string
  durationSecs: number
  remainingSecs: number
  status: 'running' | 'paused' | 'finished'
}

interface TimerContextValue {
  timers: CookTimer[]
  startTimer: (label: string, durationSecs: number) => string
  pauseTimer: (id: string) => void
  resumeTimer: (id: string) => void
  dismissTimer: (id: string) => void
  sheetOpen: boolean
  openSheet: () => void
  closeSheet: () => void
  // cookModeReturn: set by the recipe detail page — re-enters cook mode from outside it.
  registerCookModeReturn: (fn: () => void) => void
  unregisterCookModeReturn: () => void
  cookModeReturn: (() => void) | null
  // cookModeActive: true while CookingScreen is mounted.
  cookModeActive: boolean
  registerCookMode: () => void
  unregisterCookMode: () => void
}

const TimerContext = createContext<TimerContextValue | null>(null)

function playFinishSound() {
  try {
    const ctx = new AudioContext()
    const beepAt = (t: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.3, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3)
      osc.start(t)
      osc.stop(t + 0.3)
    }
    beepAt(ctx.currentTime)
    beepAt(ctx.currentTime + 0.4)
    beepAt(ctx.currentTime + 0.8)
    setTimeout(() => ctx.close(), 2000)
  } catch {}
}

export function TimerProvider({ children }: { children: ReactNode }) {
  const [timers, setTimers] = useState<CookTimer[]>([])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [cookModeReturn, setCookModeReturn] = useState<(() => void) | null>(null)
  const [cookModeActive, setCookModeActive] = useState(false)
  const notifiedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const id = setInterval(() => {
      setTimers(prev => {
        if (!prev.some(t => t.status === 'running')) return prev
        return prev.map(t => {
          if (t.status !== 'running') return t
          const remaining = t.remainingSecs - 1
          return remaining <= 0
            ? { ...t, remainingSecs: 0, status: 'finished' }
            : { ...t, remainingSecs: remaining }
        })
      })
    }, 1000)
    return () => clearInterval(id)
  }, [])

  // First notification fires immediately when a timer transitions to finished.
  useEffect(() => {
    timers
      .filter(t => t.status === 'finished' && !notifiedRef.current.has(t.id))
      .forEach(t => {
        notifiedRef.current.add(t.id)
        playFinishSound()
        navigator.vibrate?.([200, 100, 200, 100, 400])
      })
  }, [timers])

  // Repeat notification every 4 s while any finished timer remains uncleared.
  const finishedCount = timers.filter(t => t.status === 'finished').length
  useEffect(() => {
    if (finishedCount === 0) return
    const id = setInterval(() => {
      playFinishSound()
      navigator.vibrate?.([200, 100, 200, 100, 400])
    }, 4000)
    return () => clearInterval(id)
  }, [finishedCount])

  const startTimer = useCallback((label: string, durationSecs: number): string => {
    const id = crypto.randomUUID()
    setTimers(prev => [
      ...prev,
      { id, label, durationSecs, remainingSecs: durationSecs, status: 'running' },
    ])
    return id
  }, [])

  const pauseTimer = useCallback((id: string) => {
    setTimers(prev =>
      prev.map(t => (t.id === id && t.status === 'running' ? { ...t, status: 'paused' } : t)),
    )
  }, [])

  const resumeTimer = useCallback((id: string) => {
    setTimers(prev =>
      prev.map(t => (t.id === id && t.status === 'paused' ? { ...t, status: 'running' } : t)),
    )
  }, [])

  const dismissTimer = useCallback((id: string) => {
    notifiedRef.current.delete(id)
    setTimers(prev => prev.filter(t => t.id !== id))
  }, [])

  const openSheet = useCallback(() => setSheetOpen(true), [])
  const closeSheet = useCallback(() => setSheetOpen(false), [])

  const registerCookModeReturn = useCallback((fn: () => void) => {
    setCookModeReturn(() => fn)
  }, [])

  const unregisterCookModeReturn = useCallback(() => {
    setCookModeReturn(null)
  }, [])

  const registerCookMode = useCallback(() => setCookModeActive(true), [])
  const unregisterCookMode = useCallback(() => setCookModeActive(false), [])

  return (
    <TimerContext.Provider
      value={{
        timers, startTimer, pauseTimer, resumeTimer, dismissTimer,
        sheetOpen, openSheet, closeSheet,
        registerCookModeReturn, unregisterCookModeReturn, cookModeReturn,
        cookModeActive, registerCookMode, unregisterCookMode,
      }}
    >
      {children}
    </TimerContext.Provider>
  )
}

export function useCookTimers(): TimerContextValue {
  const ctx = useContext(TimerContext)
  if (!ctx) throw new Error('useCookTimers must be used within TimerProvider')
  return ctx
}
