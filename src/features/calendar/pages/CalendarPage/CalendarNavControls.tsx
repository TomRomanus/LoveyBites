import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import AnimatedTabBar from '@/shared/components/AnimatedTabBar'

type CalendarNavControlsProps = {
  view: 'week' | 'month'
  isCurrentPeriod: boolean
  onSwitch: (view: 'week' | 'month') => void
  onPrev: () => void
  onNext: () => void
  onToday: () => void
}

const CalendarNavControls = ({
  view,
  isCurrentPeriod,
  onSwitch,
  onPrev,
  onNext,
  onToday,
}: CalendarNavControlsProps) => {
  return (
    <div className="pt-5 px-5 flex flex-col gap-[10px]">
      <AnimatedTabBar
        layoutId="calendar-tabs"
        tabs={[
          { key: 'week', label: 'WEEK' },
          { key: 'month', label: 'MAAND' },
        ]}
        active={view}
        onChange={onSwitch}
        variant="underline"
      />
      <div className="flex items-center gap-[10px]">
        <motion.button
          data-testid="prev-period-btn"
          onClick={onPrev}
          className="lb-icon-btn w-10 h-10"
          whileTap={{ scale: 0.88 }}
        >
          <ChevronLeft size={18} />
        </motion.button>
        <motion.button
          onClick={onToday}
          disabled={isCurrentPeriod}
          className="lb-btn lb-btn--ghost lb-btn--small flex-1 h-10 rounded-full text-[13px]"
          whileTap={{ scale: 0.95 }}
          style={{ opacity: isCurrentPeriod ? 0.45 : 1 }}
        >
          Vandaag
        </motion.button>
        <motion.button
          data-testid="next-period-btn"
          onClick={onNext}
          className="lb-icon-btn w-10 h-10"
          whileTap={{ scale: 0.88 }}
        >
          <ChevronRight size={18} />
        </motion.button>
      </div>
    </div>
  )
}

export default CalendarNavControls
