import { motion, AnimatePresence } from 'framer-motion'
import { SlidersHorizontal, ArrowUpDown, ChevronDown } from 'lucide-react'
import SearchInput from '@/shared/components/SearchInput'

type RecipeSearchBarProps = {
  searchQuery: string
  onSearchChange: (v: string) => void
  activeTags: string[]
  onFiltersOpen: () => void
  onSortOpen: () => void
  sortLabel: string
  count: number
  loading: boolean
}

const RecipeSearchBar = ({
  searchQuery,
  onSearchChange,
  activeTags,
  onFiltersOpen,
  onSortOpen,
  sortLabel,
  count,
  loading,
}: RecipeSearchBarProps) => (
  <div className="px-5 pt-5 flex flex-col gap-[10px]">
    {loading && <div className="lb-skeleton h-[11px] w-[30%] rounded-[4px]" />}
    {!loading && (
      <div className="lb-eyebrow flex items-center gap-1 overflow-hidden">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={count}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="block"
          >
            {count}
          </motion.span>
        </AnimatePresence>
        {count === 1 ? 'RECEPT' : 'RECEPTEN'}
      </div>
    )}
    <SearchInput
      value={searchQuery}
      onChange={onSearchChange}
      placeholder="Zoek recept of ingrediënt"
    />

    {loading && (
      <div className="flex gap-2">
        <div className="lb-skeleton flex-1 h-9 rounded-[10px]" />
        <div className="lb-skeleton flex-1 h-9 rounded-[10px]" />
      </div>
    )}
    {!loading && (
      <div className="flex gap-2">
        <button
          onClick={onFiltersOpen}
          className="lb-btn lb-btn--ghost lb-btn--small flex-1 !justify-between px-[14px]"
        >
          <span className="inline-flex items-center gap-[6px]">
            <SlidersHorizontal size={14} strokeWidth={1.6} />
            Tags
          </span>
          {activeTags.length > 0 && (
            <span className="bg-bordeaux text-cream rounded-[9px] h-[18px] min-w-[18px] px-[6px] text-[11px] font-semibold inline-flex items-center justify-center">
              {activeTags.length}
            </span>
          )}
        </button>
        <button
          onClick={onSortOpen}
          className="lb-btn lb-btn--ghost lb-btn--small flex-1 !justify-between px-[14px]"
        >
          <span className="inline-flex items-center gap-[6px]">
            <ArrowUpDown size={14} strokeWidth={1.6} />
            {sortLabel}
          </span>
          <ChevronDown size={14} strokeWidth={1.6} />
        </button>
      </div>
    )}
  </div>
)

export default RecipeSearchBar
