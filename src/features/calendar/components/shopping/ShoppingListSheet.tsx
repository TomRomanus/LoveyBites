import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { EASE_OUT } from '@/shared/constants/animations'
import DatePickerInput from '@/features/calendar/components/DatePickerInput'
import Sheet from '@/shared/components/Sheet'
import useShoppingList from '@/features/calendar/hooks/useShoppingList'
import useCheckedSet from '@/shared/hooks/useCheckedSet'
import ShoppingSection from '@/features/calendar/components/shopping/ShoppingSection'
import ShoppingListSkeleton from '@/features/calendar/components/shopping/ShoppingListSkeleton'
import CopyButton from '@/shared/components/CopyButton'

type ShoppingListSheetProps = {
  visible: boolean
  defaultStart: string
  defaultEnd: string
  onClose: () => void
}

const ShoppingListSheet = ({
  visible,
  defaultStart,
  defaultEnd,
  onClose,
}: ShoppingListSheetProps) => {
  const [from, setFrom] = useState(defaultStart)
  const [to, setTo] = useState(defaultEnd)
  const { checked, toggle, reset } = useCheckedSet()

  const { loading, fetched, sections, buildCopyText } = useShoppingList(from, to, visible)

  const handleFromChange = (v: string) => { setFrom(v); reset() }
  const handleToChange = (v: string) => { setTo(v); reset() }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(buildCopyText())
  }

  return (
    <Sheet visible={visible} onClose={onClose} height="88%">
      <div className="pt-3 px-[22px]">
        <div className="lb-eyebrow">BOODSCHAPPENLIJST</div>
        <h3 className="lb-display mt-1 text-[26px]">
          Wat we <b>nodig hebben</b>
        </h3>
      </div>
      <div className="py-[14px] px-[22px] pb-4 flex gap-[10px] items-end">
        <DatePickerInput label="VAN" value={from} onChange={handleFromChange} />
        <div className="text-stone-2 text-[14px] mb-[14px] shrink-0">→</div>
        <DatePickerInput label="TOT" value={to} onChange={handleToChange} openLeft />
      </div>
      <div className="flex-1 min-h-0 overflow-auto py-[6px] px-[22px]">
        <AnimatePresence mode="wait">
          {loading && <ShoppingListSkeleton />}
          {fetched && !loading && sections.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
              className="text-center text-stone font-serif italic p-[30px]"
            >
              Geen geplande recepten in deze periode.
            </motion.div>
          )}
          {!loading && sections.length > 0 && (
            <motion.div
              key="content"
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, transition: { duration: 0.12 } }}
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
              }}
            >
              {sections.map((s, i) => (
                <ShoppingSection
                  key={i}
                  label={s.label}
                  days={s.days}
                  ingredients={s.ingredients}
                  checkedKeys={checked}
                  sectionIndex={i}
                  onToggle={toggle}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {fetched && sections.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="py-5 px-[22px] pb-[14px]"
          >
            <CopyButton onCopy={handleCopy} />
          </motion.div>
        )}
      </AnimatePresence>
    </Sheet>
  )
}

export default ShoppingListSheet
