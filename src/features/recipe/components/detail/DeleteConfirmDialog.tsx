import { motion } from 'framer-motion'
import Dialog from '@/shared/components/Dialog'

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
}: DeleteConfirmDialogProps) => (
  <Dialog visible={visible} onClose={onCancel}>
    <motion.div
      className="bg-paper rounded-[18px] p-6 w-full pointer-events-auto"
      initial={{ scale: 0.92, y: 8 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0.92, y: 8 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      <h3 className="lb-display m-0 text-[22px] text-center">Dit recept verwijderen?</h3>
      <p className="mt-[10px] mb-[22px] text-center text-[14px] text-ink-2 leading-[1.5]">
        &ldquo;{recipeTitle}&rdquo; wordt uit ons kookboek gehaald.
      </p>
      <div className="flex gap-[10px]">
        <button onClick={onCancel} className="lb-btn lb-btn--ghost flex-1">
          Annuleren
        </button>
        <button onClick={onConfirm} disabled={deleting} className="lb-btn lb-btn--primary flex-1">
          {deleting ? <span className="lb-spinner" /> : 'Verwijderen'}
        </button>
      </div>
    </motion.div>
  </Dialog>
)

export default DeleteConfirmDialog
