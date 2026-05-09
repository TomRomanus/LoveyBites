import { createPortal } from 'react-dom'
import { Check, ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type ReorderFabProps = {
  active: boolean
  onToggle: () => void
}

const ReorderFab = ({ active, onToggle }: ReorderFabProps) => {
  return createPortal(
    <button
      type="button"
      onClick={onToggle}
      aria-label={active ? 'Klaar met sorteren' : 'Volgorde aanpassen'}
      className={cn(
        'fixed flex items-center justify-center w-10 h-10 rounded-[20px] cursor-pointer z-[90]',
        'transition-[background,border-color,box-shadow] duration-[180ms] ease-[ease]',
        'border-[0.5px]',
        active
          ? 'bg-bordeaux-tint border-bordeaux/22 shadow-[0_1px_4px_rgba(107,31,42,0.10)]'
          : 'bg-cream border-ink/18 shadow-[0_1px_4px_rgba(0,0,0,0.08)]',
      )}
      style={{ bottom: 'max(28px, env(safe-area-inset-bottom))', right: 22 }}
    >
      {active ? (
        <Check size={16} strokeWidth={2.5} className="text-bordeaux" />
      ) : (
        <ArrowUpDown size={16} strokeWidth={2.1} className="text-stone" />
      )}
    </button>,
    document.body,
  )
}

export default ReorderFab
