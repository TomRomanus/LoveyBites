import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'

type DeleteConfirmDialogProps = {
  visible: boolean
  recipeTitle: string
  deleting: boolean
  onConfirm: () => void
  onCancel: () => void
}

const DeleteConfirmDialog = ({
  visible,
  recipeTitle,
  deleting,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) =>
  createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          key="confirm-bd"
          className="lb-sheet-backdrop"
          style={{ animation: 'none', zIndex: 202 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onCancel}
        />
      )}
      {visible && (
        <motion.div
          key="confirm-dialog"
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 24px',
            zIndex: 203,
            pointerEvents: 'none',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            style={{
              background: 'var(--paper)',
              borderRadius: 18,
              padding: 24,
              width: '100%',
              pointerEvents: 'auto',
            }}
            initial={{ scale: 0.92, y: 8 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <h3 className="lb-display" style={{ margin: 0, fontSize: 22, textAlign: 'center' }}>
              Dit recept verwijderen?
            </h3>
            <p
              style={{
                margin: '10px 0 22px',
                textAlign: 'center',
                fontSize: 14,
                color: 'var(--ink-2)',
                lineHeight: 1.5,
              }}
            >
              &ldquo;{recipeTitle}&rdquo; wordt uit ons kookboek gehaald.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onCancel} className="lb-btn lb-btn--ghost" style={{ flex: 1 }}>
                Annuleren
              </button>
              <button
                onClick={onConfirm}
                disabled={deleting}
                className="lb-btn lb-btn--primary"
                style={{ flex: 1 }}
              >
                {deleting ? <span className="lb-spinner" /> : 'Verwijderen'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )

export default DeleteConfirmDialog
