import * as RadixDialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { backdropVariants } from '@/shared/constants/animations'

type DialogProps = {
  visible: boolean
  onClose: () => void
  children: React.ReactNode
}

const Dialog = ({ visible, onClose, children }: DialogProps) => (
  <RadixDialog.Root open={visible} onOpenChange={(open) => !open && onClose()}>
    <RadixDialog.Portal forceMount>
      <AnimatePresence>
        {visible && (
          <>
            <RadixDialog.Overlay asChild forceMount>
              <motion.div
                key="dialog-bd"
                variants={backdropVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="fixed inset-0 z-[202]"
                style={{
                  background: 'rgba(31,29,26,0.12)',
                  backdropFilter: 'blur(1px)',
                  WebkitBackdropFilter: 'blur(1px)',
                }}
              />
            </RadixDialog.Overlay>
            <RadixDialog.Content
              forceMount
              className="fixed inset-0 z-[203] flex items-center justify-center px-6 pointer-events-none outline-none"
            >
              <RadixDialog.Title className="sr-only">Dialog</RadixDialog.Title>
              {children}
            </RadixDialog.Content>
          </>
        )}
      </AnimatePresence>
    </RadixDialog.Portal>
  </RadixDialog.Root>
)

export default Dialog
