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
          onClick={onClick}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.6, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          style={{
            position: 'fixed',
            bottom: 'max(28px, env(safe-area-inset-bottom))',
            right: 22,
            width: 40,
            height: 40,
            borderRadius: 20,
            background: 'var(--bordeaux)',
            color: 'var(--cream-card)',
            border: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(107,31,42,0.35)',
            cursor: 'pointer',
            zIndex: 90,
          }}
        >
          <Calendar size={15} />
        </motion.button>
      )}
    </AnimatePresence>,
    document.body,
  )

export default CalendarFab
