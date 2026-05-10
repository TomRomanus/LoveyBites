import * as RadixDialog from '@radix-ui/react-dialog'
import BaseOverlay from '@/shared/components/BaseOverlay'

type DialogProps = {
  visible: boolean
  onClose: () => void
  children: React.ReactNode
}

const Dialog = ({ visible, onClose, children }: DialogProps) => (
  <BaseOverlay visible={visible} onClose={onClose} backdropZ="z-[202]">
    <RadixDialog.Content
      forceMount
      aria-describedby={undefined}
      className="fixed inset-0 z-[203] flex items-center justify-center px-6 pointer-events-none outline-none"
    >
      <RadixDialog.Title className="sr-only">Dialog</RadixDialog.Title>
      {children}
    </RadixDialog.Content>
  </BaseOverlay>
)

export default Dialog
