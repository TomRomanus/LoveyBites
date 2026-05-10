import * as RadixDialog from '@radix-ui/react-dialog'
import { motion } from 'framer-motion'
import { sheetVariants } from '@/shared/constants/animations'
import BaseOverlay from '@/shared/components/BaseOverlay'

type SheetProps = {
  visible: boolean
  onClose: () => void
  height?: string
  children: React.ReactNode
}

const Sheet = ({ visible, onClose, height, children }: SheetProps) => (
  <BaseOverlay visible={visible} onClose={onClose} backdropZ="z-[200]">
    <RadixDialog.Content asChild forceMount aria-describedby={undefined}>
      <motion.div
        key="sheet-panel"
        className="lb-sheet"
        style={{ animation: 'none', paddingBottom: 30, ...(height ? { height } : {}) }}
        variants={sheetVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        <RadixDialog.Title className="sr-only">Panel</RadixDialog.Title>
        <div className="lb-sheet-grabber" />
        {children}
      </motion.div>
    </RadixDialog.Content>
  </BaseOverlay>
)

export default Sheet
