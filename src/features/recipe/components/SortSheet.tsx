import { Check } from 'lucide-react'
import Sheet from '@/shared/components/Sheet'
import { SortOption, SORT_LABELS } from '@/features/recipe/hooks/useRecipeFilter'

type SortSheetProps = {
  visible: boolean
  sort: SortOption
  onChange: (v: SortOption) => void
  onClose: () => void
}

const SortSheet = ({ visible, sort, onChange, onClose }: SortSheetProps) => {
  const opts = Object.keys(SORT_LABELS) as SortOption[]

  return (
    <Sheet visible={visible} onClose={onClose}>
      <div className="px-5 pt-3">
        <h3 className="lb-display m-0 text-[22px]">Sorteren</h3>
      </div>
      <div className="px-3 pt-[14px] pb-4">
        {opts.map((o) => (
          <button
            key={o}
            onClick={() => {
              onChange(o)
              onClose()
            }}
            className={`flex items-center justify-between w-full px-4 py-[14px] bg-transparent border-0 font-sans text-[15px] text-ink rounded-[12px] cursor-pointer ${sort === o ? 'font-semibold' : 'font-normal'}`}
          >
            {SORT_LABELS[o]}
            {sort === o && <Check size={18} color="var(--bordeaux)" />}
          </button>
        ))}
      </div>
    </Sheet>
  )
}

export default SortSheet
