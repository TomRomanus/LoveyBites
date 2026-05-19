import {
  createContext, useContext, useRef, useState, useEffect,
  useCallback, ReactNode,
} from 'react'

export interface CookTimer {
  id: string
  label: string
  durationSecs: number
  remainingSecs: number
  // Absolute timestamp (ms) when this timer will finish. null when paused or finished.
  endTime: number | null
  status: 'running' | 'paused' | 'finished'
}

interface TimerContextValue {
  timers: CookTimer[]
  startTimer: (label: string, durationSecs: number) => string
  pauseTimer: (id: string) => void
  resumeTimer: (id: string) => void
  dismissTimer: (id: string) => void
  addTime: (id: string, secs: number) => void
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

function scheduleAlarm(id: string, label: string, endTime: number) {
  navigator.serviceWorker?.ready
    .then(reg => reg.active?.postMessage({ type: 'SCHEDULE_ALARM', id, label, endTime }))
    .catch(() => {})
}

function cancelAlarm(id: string) {
  navigator.serviceWorker?.ready
    .then(reg => reg.active?.postMessage({ type: 'CANCEL_ALARM', id }))
    .catch(() => {})
}

// navigator.vibrate() is blocked in Chrome 86+ without a transient user gesture.
// Posting VIBRATE_NOW to the SW triggers an OS notification which bypasses this restriction.
function vibrateNow(id: string, label: string) {
  navigator.vibrate?.([400, 150, 400, 150, 400, 150, 600])
  navigator.serviceWorker?.ready
    .then(reg => reg.active?.postMessage({ type: 'VIBRATE_NOW', id, label }))
    .catch(() => {})
}

export function TimerProvider({ children }: { children: ReactNode }) {
  const [timers, setTimers] = useState<CookTimer[]>([])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [cookModeReturn, setCookModeReturn] = useState<(() => void) | null>(null)
  const [cookModeActive, setCookModeActive] = useState(false)
  const notifiedRef = useRef<Set<string>>(new Set())

  // Recomputes from endTime rather than decrementing — stays accurate after background throttling.
  useEffect(() => {
    const id = setInterval(() => {
      setTimers(prev => {
        if (!prev.some(t => t.status === 'running')) return prev
        return prev.map(t => {
          if (t.status !== 'running' || t.endTime === null) return t
          const remaining = Math.max(0, Math.round((t.endTime - Date.now()) / 1000))
          return remaining <= 0
            ? { ...t, remainingSecs: 0, endTime: null, status: 'finished' }
            : { ...t, remainingSecs: remaining }
        })
      })
    }, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return
      setTimers(prev => {
        if (!prev.some(t => t.status === 'running')) return prev
        const now = Date.now()
        return prev.map(t => {
          if (t.status !== 'running' || t.endTime === null) return t
          const remaining = Math.max(0, Math.round((t.endTime - now) / 1000))
          return remaining <= 0
            ? { ...t, remainingSecs: 0, endTime: null, status: 'finished' }
            : { ...t, remainingSecs: remaining }
        })
      })
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  useEffect(() => {
    timers
      .filter(t => t.status === 'finished' && !notifiedRef.current.has(t.id))
      .forEach(t => {
        notifiedRef.current.add(t.id)
        cancelAlarm(t.id)
        playFinishSound()
        vibrateNow(t.id, t.label)
      })
  }, [timers])

  const finishedCount = timers.filter(t => t.status === 'finished').length
  useEffect(() => {
    if (finishedCount === 0) return
    const soundId = setInterval(() => playFinishSound(), 4000)
    // Vibrate continuously: re-trigger every 2.25s so there's no gap between pattern repetitions.
    const vibrateId = setInterval(() => navigator.vibrate?.([400, 150, 400, 150, 400, 150, 600]), 2250)
    return () => {
      clearInterval(soundId)
      clearInterval(vibrateId)
      navigator.vibrate?.(0)
    }
  }, [finishedCount])

  const startTimer = useCallback((label: string, durationSecs: number): string => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
    const id = crypto.randomUUID()
    if (durationSecs <= 0) {
      setTimers(prev => [
        ...prev,
        { id, label, durationSecs, remainingSecs: 0, endTime: null, status: 'finished' },
      ])
      return id
    }
    const endTime = Date.now() + durationSecs * 1000
    scheduleAlarm(id, label, endTime)
    setTimers(prev => [
      ...prev,
      { id, label, durationSecs, remainingSecs: durationSecs, endTime, status: 'running' },
    ])
    return id
  }, [])

  const pauseTimer = useCallback((id: string) => {
    cancelAlarm(id)
    setTimers(prev =>
      prev.map(t => {
        if (t.id !== id || t.status !== 'running' || t.endTime === null) return t
        return { ...t, status: 'paused', endTime: null, remainingSecs: Math.max(0, Math.round((t.endTime - Date.now()) / 1000)) }
      }),
    )
  }, [])

  const resumeTimer = useCallback((id: string) => {
    setTimers(prev =>
      prev.map(t => {
        if (t.id !== id || t.status !== 'paused') return t
        const endTime = Date.now() + t.remainingSecs * 1000
        scheduleAlarm(id, t.label, endTime)
        return { ...t, status: 'running', endTime }
      }),
    )
  }, [])

  const dismissTimer = useCallback((id: string) => {
    cancelAlarm(id)
    notifiedRef.current.delete(id)
    setTimers(prev => prev.filter(t => t.id !== id))
  }, [])

  const addTime = useCallback((id: string, secs: number) => {
    notifiedRef.current.delete(id)
    setTimers(prev =>
      prev.map(t => {
        if (t.id !== id) return t
        if (t.status === 'finished') {
          const endTime = Date.now() + secs * 1000
          scheduleAlarm(id, t.label, endTime)
          return { ...t, remainingSecs: secs, endTime, status: 'running' }
        }
        if (t.status === 'paused') {
          return { ...t, remainingSecs: t.remainingSecs + secs }
        }
        const endTime = t.endTime! + secs * 1000
        scheduleAlarm(id, t.label, endTime)
        return { ...t, endTime, remainingSecs: Math.round((endTime - Date.now()) / 1000) }
      }),
    )
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
        timers, startTimer, pauseTimer, resumeTimer, dismissTimer, addTime,
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
