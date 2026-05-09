import { Check } from 'lucide-react'
import Sheet from '../../shared/components/Sheet'
import { SortOption, SORT_LABELS } from '../hooks/useRecipeFilter'

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
      <div style={{ padding: '12px 20px 0' }}>
        <h3 className="lb-display" style={{ margin: 0, fontSize: 22 }}>
          Sorteren
        </h3>
      </div>
      <div style={{ padding: '14px 12px 16px' }}>
        {opts.map((o) => (
          <button
            key={o}
            onClick={() => {
              onChange(o)
              onClose()
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '14px 16px',
              background: 'transparent',
              border: 0,
              fontFamily: 'var(--sans)',
              fontSize: 15,
              color: 'var(--ink)',
              borderRadius: 12,
              fontWeight: sort === o ? 600 : 400,
              cursor: 'pointer',
            }}
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
