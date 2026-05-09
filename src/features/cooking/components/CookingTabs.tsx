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
    <div className="flex justify-center gap-1 px-5 pb-2 shrink-0">
      {TAB_LABELS.map(([v, l]) => (
        <button
          key={v}
          onClick={() => onTabChange(v)}
          className="relative bg-transparent border-0 py-2 px-[14px] rounded-[16px] text-[13px] font-medium cursor-pointer font-sans"
          style={{ color: tab === v ? '#f8f4ed' : 'rgba(248,244,237,0.5)' }}
        >
          {tab === v && (
            <motion.div
              layoutId="cook-pill"
              className="absolute inset-0 rounded-[16px] z-0 bg-paper/[0.12]"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
          <span className="relative z-[1]">{l}</span>
        </button>
      ))}
    </div>
  </LayoutGroup>
)

export default CookingTabs
