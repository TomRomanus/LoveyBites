import { X } from 'lucide-react'
import IconButton from '@/shared/components/IconButton'

type CookingHeaderProps = {
  onClose: () => void
}

const CookingHeader = ({ onClose }: CookingHeaderProps) => (
  <div className="flex items-center py-5 px-5 pb-[14px] shrink-0">
    <IconButton
      data-testid="cooking-close-btn"
      onClick={onClose}
      className="bg-transparent border-[0.5px] border-paper/[0.38] text-paper"
    >
      <X size={16} />
    </IconButton>
    <div className="flex-1 text-center font-mono text-[10px] tracking-[0.14em] uppercase text-paper/50">
      Kookmodus
    </div>
    <div className="w-10" />
  </div>
)

export default CookingHeader
