import { useMemo } from 'react'
import { useCookTimers } from '@/features/cooking/context/TimerContext'
import { formatCookTime } from '@/features/cooking/utils/formatCookTime'

export function TimerPill() {
  const { timers, openSheet } = useCookTimers()

  const { soonest, hasFinished } = useMemo(() => {
    const running = timers.filter(t => t.status === 'running')
    return {
      soonest: running.sort((a, b) => a.remainingSecs - b.remainingSecs)[0] ?? null,
      hasFinished: timers.some(t => t.status === 'finished'),
    }
  }, [timers])

  if (timers.length === 0) return null

  return (
    <button
      onClick={openSheet}
      className="fixed left-1/2 -translate-x-1/2 z-[90] flex items-center gap-2 bg-bordeaux text-paper rounded-full px-4 font-sans shadow-[0_4px_16px_rgba(107,31,42,0.4)]"
      style={{
        bottom: 'calc(max(24px, env(safe-area-inset-bottom, 0px)) + 60px)',
        paddingTop: '8px',
        paddingBottom: '8px',
      }}
    >
      <span
        className={`w-[6px] h-[6px] rounded-full animate-pulse flex-shrink-0 ${
          hasFinished ? 'bg-rust' : 'bg-honey-400'
        }`}
      />
      <span className="text-[13px] font-semibold">
        {timers.length === 1 ? '1 timer' : `${timers.length} timers`}
      </span>
      {soonest && (
        <span className="font-mono text-[12px] text-honey-400">
          {formatCookTime(soonest.remainingSecs)}
        </span>
      )}
      {hasFinished && !soonest && (
        <span className="text-[13px] font-semibold text-rust">Klaar!</span>
      )}
    </button>
  )
}
