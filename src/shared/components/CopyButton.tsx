import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { EASE_IN, EASE_OUT } from '@/shared/constants/animations'
import { Copy } from 'lucide-react'

type CopyButtonProps = {
  onCopy: () => Promise<void>
}

const CopyButton = ({ onCopy }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false)

  const handleClick = async () => {
    await onCopy()
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <motion.button
      onClick={handleClick}
      className="lb-btn lb-btn--primary w-full"
      whileTap={{ scale: 0.97 }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span
            key="success"
            initial={{ opacity: 0, y: 10, scale: 0.88 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: { type: 'spring', stiffness: 420, damping: 26 },
            }}
            exit={{
              opacity: 0,
              y: -10,
              scale: 0.88,
              transition: { duration: 0.1, ease: EASE_IN },
            }}
            className="flex items-center gap-2"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <motion.path
                d="M5 13l4 4L19 7"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.32, ease: EASE_OUT, delay: 0.06 }}
              />
            </svg>
            Gekopieerd!
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            initial={{ opacity: 0, y: -10, scale: 0.88 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: { type: 'spring', stiffness: 420, damping: 26 },
            }}
            exit={{
              opacity: 0,
              y: 10,
              scale: 0.88,
              transition: { duration: 0.1, ease: EASE_IN },
            }}
            className="flex items-center gap-2"
          >
            <Copy size={14} />
            Kopieer
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

export default CopyButton
