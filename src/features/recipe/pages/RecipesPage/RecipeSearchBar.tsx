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
  <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
    {loading && (
      <div className="lb-skeleton" style={{ height: 11, width: '30%', borderRadius: 4 }} />
    )}
    {!loading && (
      <div
        className="lb-eyebrow"
        style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden' }}
      >
        <AnimatePresence mode="popLayout">
          <motion.span
            key={count}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            style={{ display: 'block' }}
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
      <div style={{ display: 'flex', gap: 8 }}>
        <div className="lb-skeleton" style={{ flex: 1, height: 36, borderRadius: 10 }} />
        <div className="lb-skeleton" style={{ flex: 1, height: 36, borderRadius: 10 }} />
      </div>
    )}
    {!loading && (
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onFiltersOpen}
          className="lb-btn lb-btn--ghost lb-btn--small"
          style={{ flex: 1, justifyContent: 'space-between', padding: '0 14px' }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <SlidersHorizontal size={14} strokeWidth={1.6} />
            Tags
          </span>
          {activeTags.length > 0 && (
            <span
              style={{
                background: 'var(--bordeaux)',
                color: 'var(--cream-card)',
                borderRadius: 9,
                height: 18,
                minWidth: 18,
                padding: '0 6px',
                fontSize: 11,
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {activeTags.length}
            </span>
          )}
        </button>
        <button
          onClick={onSortOpen}
          className="lb-btn lb-btn--ghost lb-btn--small"
          style={{ flex: 1, justifyContent: 'space-between', padding: '0 14px' }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
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
