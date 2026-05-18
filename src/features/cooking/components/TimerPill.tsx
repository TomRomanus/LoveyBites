import { useCookTimers } from '@/features/cooking/context/TimerContext'
import { TimerPillButton } from './TimerPillButton'

export function TimerPill() {
  const { timers, cookModeReturn } = useCookTimers()

  // Hide when cook mode is active so the layoutId shared transition can animate the pill
  // from center-top to the cook mode header position (top-right).
  if (timers.length === 0 || cookModeReturn !== null) return null

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-[90]"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 24px)' }}
    >
      <TimerPillButton variant="light" />
    </div>
  )
}
