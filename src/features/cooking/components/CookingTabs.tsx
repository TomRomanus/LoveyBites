import { motion, LayoutGroup } from 'framer-motion'
import type { CookTab } from '@/features/cooking/types/cooking'

type CookingTabsProps = {
  tab: CookTab
  onTabChange: (tab: CookTab) => void
}

const TAB_LABELS: [CookTab, string][] = [
  ['step', 'Instructies'],
  ['ingredients', 'Ingrediënten'],
  ['overview', 'Overzicht'],
]

const CookingTabs = ({ tab, onTabChange }: CookingTabsProps) => (
  <LayoutGroup>
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 4,
        padding: '0 20px 8px',
        flexShrink: 0,
      }}
    >
      {TAB_LABELS.map(([v, l]) => (
        <button
          key={v}
          onClick={() => onTabChange(v)}
          style={{
            position: 'relative',
            background: 'transparent',
            color: tab === v ? '#f8f4ed' : 'rgba(248,244,237,0.5)',
            border: 0,
            padding: '8px 14px',
            borderRadius: 16,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'var(--sans)',
          }}
        >
          {tab === v && (
            <motion.div
              layoutId="cook-pill"
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 16,
                background: 'rgba(248,244,237,0.12)',
                zIndex: 0,
              }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
          <span style={{ position: 'relative', zIndex: 1 }}>{l}</span>
        </button>
      ))}
    </div>
  </LayoutGroup>
)

export default CookingTabs
