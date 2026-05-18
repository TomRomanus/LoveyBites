import { useCookTimers } from '@/features/cooking/context/TimerContext'
import { TimerPillButton } from './TimerPillButton'

export function TimerPill() {
  const { timers } = useCookTimers()

  if (timers.length === 0) return null

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-[90]"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 24px)' }}
    >
      <TimerPillButton variant="light" />
    </div>
  )
}
