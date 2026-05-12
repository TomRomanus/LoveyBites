import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import AutoGrowTextarea from '@/shared/components/AutoGrowTextarea'

type CookingCommentSheetProps = {
  open: boolean
  stepNumber: number
  comment: string | undefined
  onSave: (comment: string) => void
  onDelete: () => void
  onClose: () => void
}

const CookingCommentSheet = ({
  open,
  stepNumber,
  comment,
  onSave,
  onDelete,
  onClose,
}: CookingCommentSheetProps) => {
  const [value, setValue] = useState(comment ?? '')

  useEffect(() => {
    if (open) setValue(comment ?? '')
  }, [open, comment])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="comment-backdrop"
            data-testid="comment-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/45 z-10"
            onClick={() => {
              onSave(value)
              onClose()
            }}
          />
          <motion.div
            key="comment-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="absolute bottom-0 left-0 right-0 z-20 bg-ink rounded-t-[20px] border-t-[0.5px] border-paper/10 px-[18px] pb-6"
          >
            <div className="w-9 h-1 rounded-full bg-paper/[0.18] mx-auto mt-[10px] mb-3" />
            <div className="font-mono text-[9px] tracking-[0.14em] uppercase text-paper/50 mb-[10px]">
              Stap {stepNumber}
            </div>
            <div className="flex items-start bg-honey-700/15 rounded-md px-[14px] py-[6px]">
              <AutoGrowTextarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                rows={1}
                autoFocus
                className="flex-1 bg-transparent border-0 outline-none resize-none font-sans text-[13px] text-paper/75 leading-[1.5] placeholder:text-honey-700/40"
                placeholder="Opmerking..."
              />
              <button
                type="button"
                aria-label="Opmerking verwijderen"
                onClick={() => {
                  onDelete()
                  onClose()
                }}
                className="shrink-0 text-[10px] leading-none text-honey-700/45 hover:text-honey-700/80 cursor-pointer pl-[6px] self-start mt-[5px] border-0 bg-transparent"
              >
                ✕
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default CookingCommentSheet
