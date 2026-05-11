import { useState } from 'react'
import Sheet from '@/shared/components/Sheet'
import SearchInput from '@/shared/components/SearchInput'

type FilterSheetProps = {
  visible: boolean
  activeTags: string[]
  allTags: string[]
  onChange: (tags: string[]) => void
  onClose: () => void
}

const FilterSheet = ({ visible, activeTags, allTags, onChange, onClose }: FilterSheetProps) => {
  const [q, setQ] = useState('')
  const filtered = allTags.filter((t) => t.toLowerCase().includes(q.toLowerCase()))
  const toggle = (t: string) =>
    onChange(activeTags.includes(t) ? activeTags.filter((x) => x !== t) : [...activeTags, t])

  return (
    <Sheet visible={visible} onClose={onClose}>
      <div className="px-5 pt-3 flex items-center justify-between">
        <h3 className="lb-display m-0 text-[22px]">Filter op tag</h3>
        {activeTags.length > 0 && (
          <button
            onClick={() => onChange([])}
            className="bg-none border-0 text-bordeaux text-[13px] font-medium cursor-pointer"
          >
            Alles wissen
          </button>
        )}
      </div>
      <div className="px-5 pt-[14px]">
        <SearchInput value={q} onChange={setQ} placeholder="Zoek tags" autoFocus />
      </div>
      <div className="px-5 pt-4 pb-5 flex flex-wrap gap-2 overflow-y-auto overflow-x-hidden flex-1">
        {filtered.map((t) => {
          const isActive = activeTags.includes(t)
          return (
            <button
              key={t}
              type="button"
              className="lb-tag cursor-pointer"
              data-active={isActive ? 'true' : 'false'}
              onClick={() => toggle(t)}
            >
              {t}
            </button>
          )
        })}
        {filtered.length === 0 && (
          <div className="text-[13px] text-stone">Geen tags voor &ldquo;{q}&rdquo;.</div>
        )}
      </div>
      <div className="px-5 pb-[14px] shrink-0">
        <button onClick={onClose} className="lb-btn lb-btn--primary w-full">
          Toepassen
        </button>
      </div>
    </Sheet>
  )
}

export default FilterSheet
