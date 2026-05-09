import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { toISO } from '@/features/calendar/utils/dateUtils'

type WeekHeaderProps = {
  weekStart: Date
  weekDir: 'next' | 'prev'
  weekLabel: string
  onPrevWeek: () => void
  onNextWeek: () => void
}

export function WeekHeader({
  weekStart,
  weekDir,
  weekLabel,
  onPrevWeek,
  onNextWeek,
}: WeekHeaderProps) {
  return (
    <div className="flex items-center justify-between mt-3">
      <button
        onClick={onPrevWeek}
        className="w-7 h-7 flex items-center justify-center rounded-full text-stone border-[0.5px] border-ink/10 bg-[var(--cream-card)] cursor-pointer"
      >
        <ChevronLeft size={14} strokeWidth={2.5} />
      </button>
      <div className="overflow-hidden">
        <AnimatePresence mode="popLayout" custom={weekDir}>
          <motion.span
            key={toISO(weekStart)}
            custom={weekDir}
            variants={{
              enter: (d: 'next' | 'prev') => ({ x: d === 'next' ? 24 : -24, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (d: 'next' | 'prev') => ({ x: d === 'next' ? -24 : 24, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 420, damping: 36 }}
            className="block text-[14px] font-medium text-ink-2 capitalize"
          >
            {weekLabel}
          </motion.span>
        </AnimatePresence>
      </div>
      <button
        onClick={onNextWeek}
        className="w-7 h-7 flex items-center justify-center rounded-full text-stone border-[0.5px] border-ink/10 bg-[var(--cream-card)] cursor-pointer"
      >
        <ChevronRight size={14} strokeWidth={2.5} />
      </button>
    </div>
  )
}
