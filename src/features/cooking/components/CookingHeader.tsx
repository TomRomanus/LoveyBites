import { useMemo } from 'react'
import { X, Timer } from 'lucide-react'
import IconButton from '@/shared/components/IconButton'
import { useCookTimers } from '@/features/cooking/context/TimerContext'
import { formatCookTime } from '@/features/cooking/utils/formatCookTime'

type CookingHeaderProps = {
  onClose: () => void
}

const CookingHeader = ({ onClose }: CookingHeaderProps) => {
  const { timers, openSheet } = useCookTimers()
  const { hasFinished, soonest } = useMemo(() => {
    const running = timers.filter(t => t.status === 'running')
    return {
      hasFinished: timers.some(t => t.status === 'finished'),
      soonest: running.sort((a, b) => a.remainingSecs - b.remainingSecs)[0] ?? null,
    }
  }, [timers])

  return (
    <div className="flex items-center py-5 px-5 pb-[14px] shrink-0">
      <IconButton
        data-testid="cooking-close-btn"
        onClick={onClose}
        className="bg-transparent border-[0.5px] border-paper/[0.38] text-paper"
      >
        <X size={16} />
      </IconButton>

      <div className="flex-1 text-center font-mono text-[10px] tracking-[0.14em] uppercase text-paper/50">
        Kookmodus
      </div>

      {timers.length > 0 ? (
        <button
          onClick={openSheet}
          aria-label="Timers openen"
          className="flex items-center gap-[6px] bg-transparent border-0 p-0 cursor-pointer"
        >
          {soonest && (
            <span className="font-mono text-[11px] tabular-nums text-honey-400">
              {formatCookTime(soonest.remainingSecs)}
            </span>
          )}
          {hasFinished && !soonest && (
            <span className="font-sans text-[11px] font-semibold text-rust">Klaar!</span>
          )}
          <div className="relative">
            <div
              className={`w-10 h-10 flex items-center justify-center rounded-full border-[0.5px] ${
                hasFinished ? 'border-rust/60 text-rust' : 'border-paper/[0.38] text-paper'
              }`}
            >
              <Timer size={16} />
            </div>
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-bordeaux-mid text-paper text-[9px] font-bold font-sans flex items-center justify-center leading-none pointer-events-none">
              {timers.length}
            </span>
          </div>
        </button>
      ) : (
        <div className="w-10" />
      )}
    </div>
  )
}

export default CookingHeader
