import { X } from 'lucide-react'
import IconButton from '@/shared/components/IconButton'
import { TimerPillButton } from './TimerPillButton'

type CookingHeaderProps = {
  onClose: () => void
}

const CookingHeader = ({ onClose }: CookingHeaderProps) => {
  return (
    <div className="relative flex items-center pt-6 px-5 pb-[14px] shrink-0">
      <IconButton
        data-testid="cooking-close-btn"
        onClick={onClose}
        className="bg-transparent border-[0.5px] border-paper/[0.38] text-paper"
      >
        <X size={16} />
      </IconButton>

      <div className="absolute inset-x-0 text-center font-mono text-[10px] tracking-[0.14em] uppercase text-paper/50 pointer-events-none">
        Kookmodus
      </div>

      <div className="ml-auto">
        <TimerPillButton />
      </div>
    </div>
  )
}

export default CookingHeader
