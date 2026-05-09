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
    <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <motion.button
          data-testid="prev-period-btn"
          onClick={onPrev}
          className="lb-icon-btn"
          whileTap={{ scale: 0.88 }}
          style={{ width: 40, height: 40 }}
        >
          <ChevronLeft size={18} />
        </motion.button>
        <motion.button
          onClick={onToday}
          disabled={isCurrentPeriod}
          className="lb-btn lb-btn--ghost lb-btn--small"
          whileTap={{ scale: 0.95 }}
          style={{
            flex: 1,
            height: 40,
            borderRadius: 20,
            fontSize: 13,
            opacity: isCurrentPeriod ? 0.45 : 1,
          }}
        >
          Vandaag
        </motion.button>
        <motion.button
          data-testid="next-period-btn"
          onClick={onNext}
          className="lb-icon-btn"
          whileTap={{ scale: 0.88 }}
          style={{ width: 40, height: 40 }}
        >
          <ChevronRight size={18} />
        </motion.button>
      </div>
    </div>
  )
}

export default CalendarNavControls
