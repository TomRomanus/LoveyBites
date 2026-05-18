import { useMemo } from 'react'
import { motion } from 'framer-motion'
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
    <div className="relative flex items-center py-5 px-5 pb-[14px] shrink-0">
      <IconButton
        data-testid="cooking-close-btn"
        onClick={onClose}
        className="bg-transparent border-[0.5px] border-paper/[0.38] text-paper"
      >
        <X size={16} />
      </IconButton>

      <div className="absolute inset-x-0 text-center font-mono text-[10px] tracking-[0.14em] uppercase text-paper/50 pointer-events-none">
        Kookmodus
      </div>

      <div className="ml-auto relative flex items-center justify-center">
        {hasFinished && (
          <motion.span
            className="absolute inset-0 rounded-full border border-bordeaux-mid/60 pointer-events-none"
            animate={{ scale: [1, 1.9], opacity: [0.7, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
        <motion.button
          onClick={openSheet}
          aria-label="Timers openen"
          animate={hasFinished ? { scale: [1, 1.1, 1] } : { scale: 1 }}
          transition={hasFinished ? { duration: 0.7, repeat: Infinity, repeatDelay: 0.9, ease: 'easeInOut' } : undefined}
          className={`flex items-center justify-center rounded-full border-[0.5px] text-paper ${
            timers.length > 0
              ? 'gap-2 h-10 px-4 bg-bordeaux/35 border-bordeaux-mid/50'
              : 'w-10 h-10 bg-transparent border-paper/[0.38]'
          }`}
        >
          {soonest && (
            <>
              <span className="font-mono text-[13px] tabular-nums text-honey-400 leading-none">
                {formatCookTime(soonest.remainingSecs)}
              </span>
              <span className="text-paper/30 text-[13px] leading-none">·</span>
            </>
          )}
          <motion.span
            className="inline-flex items-center"
            animate={hasFinished && !soonest
              ? { rotate: [0, -18, 18, -12, 12, -6, 6, 0] }
              : { rotate: 0 }}
            transition={hasFinished && !soonest
              ? { duration: 0.6, repeat: Infinity, repeatDelay: 1.4 }
              : undefined}
          >
            <Timer size={16} />
          </motion.span>
          {timers.length > 0 && (
            <span className="font-sans text-[13px] font-bold leading-none">
              {timers.length}
            </span>
          )}
        </motion.button>
      </div>
    </div>
  )
}

export default CookingHeader
