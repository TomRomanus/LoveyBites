import { motion, AnimatePresence } from 'framer-motion'
import { EASE_OUT } from '@/shared/constants/animations'
import { NL_DAYS_LONG, NL_MONTHS_SHORT } from '@/shared/constants/locale'
import Sheet from '@/shared/components/Sheet'
import AnimatedTabBar from '@/shared/components/AnimatedTabBar'
import useAddMeal from './useAddMeal'
import RecipeTabContent from './RecipeTabContent'
import CustomMealTabContent from './CustomMealTabContent'

type AddMealSheetProps = {
  visible: boolean
  date: string
  existingRecipeIds: string[]
  onClose: () => void
  onSaved: () => void
}

const AddMealSheet = (props: AddMealSheetProps) => {
  const { visible, date } = props
  const {
    tab,
    tabDir,
    search,
    setSearch,
    custom,
    setCustom,
    saving,
    selectedId,
    searchRef,
    filtered,
    handleTabChange,
    handleSelectRecipe,
    handleSaveCustom,
    onClose,
  } = useAddMeal(props)

  const dateObj = new Date(date + 'T00:00:00')

  return (
    <Sheet visible={visible} onClose={onClose} height="78%">
      <div className="pt-3 px-[22px]">
        <div className="lb-eyebrow">
          {NL_DAYS_LONG[dateObj.getDay()]}, {NL_MONTHS_SHORT[dateObj.getMonth()]}{' '}
          {dateObj.getDate()}
        </div>
        <h3 className="lb-display mt-1 mb-[14px] text-[24px]">
          Maaltijd <b>toevoegen</b>
        </h3>
      </div>
      <div className="px-[22px] pb-3">
        <AnimatedTabBar
          layoutId="meal-sheet-tabs"
          tabs={[
            { key: 'recipe', label: 'Uit kookboek' },
            { key: 'custom', label: 'Eigen tekst' },
          ]}
          active={tab}
          onChange={handleTabChange}
          variant="pill"
        />
      </div>
      <div className="flex-1 min-h-0 overflow-hidden relative">
        <AnimatePresence mode="wait" initial={false} custom={tabDir}>
          {tab === 'recipe' && (
            <motion.div
              key="recipe"
              custom={tabDir}
              initial={{ opacity: 0, y: tabDir * 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: tabDir * -16 }}
              transition={{ duration: 0.18, ease: EASE_OUT }}
              className="pt-[6px] px-[22px] h-full overflow-y-auto overflow-x-hidden"
            >
              <RecipeTabContent
                recipes={filtered}
                search={search}
                onSearchChange={setSearch}
                onSelect={handleSelectRecipe}
                selectedId={selectedId}
                saving={saving}
                searchRef={searchRef}
              />
            </motion.div>
          )}
          {tab === 'custom' && (
            <motion.div
              key="custom"
              custom={tabDir}
              initial={{ opacity: 0, y: tabDir * -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: tabDir * 16 }}
              transition={{ duration: 0.18, ease: EASE_OUT }}
              className="pt-[6px] px-[22px] h-full overflow-y-auto"
            >
              <CustomMealTabContent
                custom={custom}
                onCustomChange={setCustom}
                saving={saving}
                onSave={handleSaveCustom}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Sheet>
  )
}

export default AddMealSheet
