import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { sheetVariants, backdropVariants } from '../constants/animations'

type SheetProps = {
  visible: boolean
  onClose: () => void
  height?: string
  children: React.ReactNode
}

const Sheet = ({ visible, onClose, height, children }: SheetProps) => {
  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          key="sheet-bd"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(31,29,26,0.12)',
            backdropFilter: 'blur(1px)',
            WebkitBackdropFilter: 'blur(1px)',
            zIndex: 200,
          }}
        />
      )}
      {visible && (
        <motion.div
          key="sheet-panel"
          className="lb-sheet"
          style={{ animation: 'none', paddingBottom: 30, ...(height ? { height } : {}) }}
          variants={sheetVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <div className="lb-sheet-grabber" />
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

export default Sheet
