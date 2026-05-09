import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar } from 'lucide-react'

type CalendarFabProps = {
  visible: boolean
  onClick: () => void
}

const CalendarFab = ({ visible, onClick }: CalendarFabProps) =>
  createPortal(
    <AnimatePresence>
      {visible && (
        <motion.button
          key="calendar-fab"
          data-testid="calendar-fab"
          onClick={onClick}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.6, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          className="fixed right-[22px] w-10 h-10 rounded-[20px] bg-bordeaux text-cream border-0 flex items-center justify-center shadow-[0_4px_16px_rgba(107,31,42,0.35)] cursor-pointer z-[90]"
          style={{ bottom: 'max(28px, env(safe-area-inset-bottom))' }}
        >
          <Calendar size={15} />
        </motion.button>
      )}
    </AnimatePresence>,
    document.body,
  )

export default CalendarFab
