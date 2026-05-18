import { useMemo, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Timer } from 'lucide-react'
import { useCookTimers } from '@/features/cooking/context/TimerContext'
import { formatCookTime } from '@/features/cooking/utils/formatCookTime'
import { EASE_OUT } from '@/shared/constants/animations'

const LAYOUT_TRANSITION = { type: 'tween', duration: 0.52, ease: EASE_OUT } as const

type TimerPillButtonProps = {
  variant?: 'dark' | 'light'
}

export function TimerPillButton({ variant = 'dark' }: TimerPillButtonProps) {
  const { timers, openSheet } = useCookTimers()
  // Trails timers.length: expands immediately, collapses only after content exit animation completes.
  const [pillExpanded, setPillExpanded] = useState(false)

  const { hasFinished, soonest } = useMemo(() => {
    const running = timers.filter(t => t.status === 'running')
    return {
      hasFinished: timers.some(t => t.status === 'finished'),
      soonest: running.sort((a, b) => a.remainingSecs - b.remainingSecs)[0] ?? null,
    }
  }, [timers])

  useEffect(() => {
    if (timers.length > 0) setPillExpanded(true)
  }, [timers.length])

  const hasContent = timers.length > 0

  return (
    <motion.button
      onClick={openSheet}
      aria-label="Timers openen"
      layout
      layoutId="timer-pill"
      animate={hasFinished ? { scale: [1, 1.08, 1] } : { scale: 1 }}
      transition={{
        layout: LAYOUT_TRANSITION,
        scale: hasFinished
          ? { duration: 0.7, repeat: Infinity, repeatDelay: 0.9, ease: 'easeInOut' }
          : { duration: 0 },
      }}
      style={{ borderRadius: 9999 }}
      className={`relative flex items-center justify-center border-[0.5px] text-paper transition-colors duration-300 ${
        variant === 'light'
          ? pillExpanded
            ? 'gap-2 h-10 px-4 bg-bordeaux border-paper/20 shadow-[0_4px_16px_rgba(107,31,42,0.35)]'
            : 'w-10 h-10 bg-bordeaux border-paper/20'
          : pillExpanded
            ? 'gap-2 h-10 px-4 bg-bordeaux/35 border-bordeaux-mid/50'
            : 'w-10 h-10 bg-transparent border-paper/20'
      }`}
    >
      <AnimatePresence>
        {hasFinished && (
          <motion.span
            className="absolute inset-0 rounded-full border border-bordeaux-mid/60 pointer-events-none"
            animate={{ scale: [1, 1.9], opacity: [0.7, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence
        onExitComplete={() => {
          if (timers.length === 0) setPillExpanded(false)
        }}
      >
        {hasContent && soonest && (
          <motion.span
            key="countdown"
            className="flex items-center gap-2 whitespace-nowrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <span className="font-mono text-[13px] font-bold tabular-nums text-honey-500 leading-none">
              {formatCookTime(soonest.remainingSecs)}
            </span>
            <span className="text-paper/30 text-[16px] leading-none">·</span>
          </motion.span>
        )}
      </AnimatePresence>

      <motion.span
        layout
        className="inline-flex items-center shrink-0"
        animate={hasFinished && !soonest
          ? { rotate: [0, -18, 18, -12, 12, -6, 6, 0] }
          : { rotate: 0 }}
        transition={{
          layout: LAYOUT_TRANSITION,
          rotate: hasFinished && !soonest
            ? { duration: 0.6, repeat: Infinity, repeatDelay: 1.4 }
            : { duration: 0 },
        }}
      >
        <Timer size={16} />
      </motion.span>

      <AnimatePresence
        onExitComplete={() => {
          if (timers.length === 0) setPillExpanded(false)
        }}
      >
        {hasContent && (
          <motion.span
            key="count"
            className="font-sans text-[13px] font-bold leading-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {timers.length}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
