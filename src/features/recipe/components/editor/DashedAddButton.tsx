import { Plus } from 'lucide-react'

const DashedAddButton = ({ onClick, label }: { onClick: () => void; label: string }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex items-center gap-2 px-3 py-[9px] border border-dashed border-stone-2 rounded-[9px] text-stone text-[12px] bg-none cursor-pointer min-h-[38px] font-sans"
  >
    <Plus size={11} strokeWidth={2.5} />
    {label}
  </button>
)

export default DashedAddButton
