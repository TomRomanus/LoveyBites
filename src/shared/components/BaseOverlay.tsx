import * as RadixDialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { backdropVariants } from '@/shared/constants/animations'

type BaseOverlayProps = {
  visible: boolean
  onClose: () => void
  backdropZ?: string
  children: React.ReactNode
}

const BaseOverlay = ({ visible, onClose, backdropZ = 'z-[200]', children }: BaseOverlayProps) => (
  <RadixDialog.Root open={visible} onOpenChange={(open) => !open && onClose()}>
    <RadixDialog.Portal forceMount>
      <AnimatePresence>
        {visible && (
          <>
            <RadixDialog.Overlay asChild forceMount>
              <motion.div
                key="overlay-bd"
                variants={backdropVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className={`fixed inset-0 ${backdropZ}`}
                style={{
                  background: 'rgba(31,29,26,0.12)',
                  backdropFilter: 'blur(1px)',
                  WebkitBackdropFilter: 'blur(1px)',
                }}
              />
            </RadixDialog.Overlay>
            {children}
          </>
        )}
      </AnimatePresence>
    </RadixDialog.Portal>
  </RadixDialog.Root>
)

export default BaseOverlay
