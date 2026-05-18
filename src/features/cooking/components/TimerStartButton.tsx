import { motion, AnimatePresence } from 'framer-motion'
import { Check, Play } from 'lucide-react'

type TimerStartButtonProps = {
  active: boolean
  displayTime: string
  onStart: () => void
}

function TimerStartButton({ active, displayTime, onStart }: TimerStartButtonProps) {
  return (
    <motion.button
      onClick={() => !active && onStart()}
      disabled={active}
      whileTap={active ? undefined : { scale: 0.97, opacity: 0.8 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`flex items-center gap-2 self-start rounded-xl px-4 h-10 text-[13px] font-semibold font-sans transition-colors duration-300 ${
        active
          ? 'border border-honey-500/10 text-honey-500/40 cursor-not-allowed'
          : 'border-[0.5px] border-honey-500/30 text-honey-500'
      }`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={active ? 'active' : 'idle'}
          className="flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {active ? <Check size={13} /> : <Play size={13} fill="currentColor" stroke="none" />}
          <span>{active ? `${displayTime} timer actief` : `Start ${displayTime} timer`}</span>
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}

export default TimerStartButton
