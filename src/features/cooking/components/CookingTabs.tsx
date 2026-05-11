import AnimatedTabBar from '@/shared/components/AnimatedTabBar'
import type { CookTab } from '@/features/cooking/types/cooking'

type CookingTabsProps = {
  tab: CookTab
  onTabChange: (tab: CookTab) => void
}

const TABS: { key: CookTab; label: string }[] = [
  { key: 'step', label: 'Instructies' },
  { key: 'ingredients', label: 'Ingrediënten' },
  { key: 'overview', label: 'Overzicht' },
]

const CookingTabs = ({ tab, onTabChange }: CookingTabsProps) => (
  <div className="px-5 pb-2 shrink-0">
    <AnimatedTabBar
      layoutId="cook-tabs"
      tabs={TABS}
      active={tab}
      onChange={onTabChange}
      theme="dark"
    />
  </div>
)

export default CookingTabs
