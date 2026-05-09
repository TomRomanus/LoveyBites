import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'
import type { MealPlanEntry, Recipe } from '@/features/recipe/types/recipe'
import { NL_DAYS_LONG, NL_MONTHS } from '@/shared/constants/locale'
import Sheet from '@/shared/components/Sheet'
import DayEntryRow from '@/features/calendar/components/DayEntryRow'

type DayDetailSheetProps = {
  visible: boolean
  date: Date
  entries: MealPlanEntry[]
  recipeMap: Map<string, Recipe>
  onDelete: (id: string) => void
  onAdd: () => void
  onClose: () => void
}

const DayDetailSheet = ({
  visible,
  date,
  entries,
  recipeMap,
  onDelete,
  onAdd,
  onClose,
}: DayDetailSheetProps) => {
  return (
    <Sheet visible={visible} onClose={onClose}>
      <div style={{ padding: '12px 22px 0' }}>
        <div className="lb-eyebrow">{NL_DAYS_LONG[date.getDay()].toUpperCase()}</div>
        <h3 className="lb-display" style={{ margin: '4px 0 0', fontSize: 26 }}>
          {NL_MONTHS[date.getMonth()]} <b>{date.getDate()}</b>
        </h3>
      </div>
      <div style={{ padding: '16px 22px', overflow: 'auto', flex: 1, minHeight: 0 }}>
        <AnimatePresence initial={false}>
          {entries.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
              style={{
                padding: '20px 0',
                color: 'var(--stone)',
                fontStyle: 'italic',
                fontFamily: 'var(--serif)',
                textAlign: 'center',
              }}
            >
              Nog niets gepland.
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.07, delayChildren: 0.08 } },
          }}
        >
          <AnimatePresence initial={false}>
            {entries.map((e) => (
              <DayEntryRow
                key={e.id}
                entry={e}
                recipe={recipeMap.get(e.recipeId ?? '')}
                onDelete={onDelete}
              />
            ))}
          </AnimatePresence>
        </motion.div>
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.22, ease: [0.2, 0, 0, 1] }}
          onClick={onAdd}
          className="lb-btn lb-btn--ghost"
          style={{ width: '100%', marginTop: 14 }}
        >
          <Plus size={14} strokeWidth={2.2} />
          Maaltijd toevoegen
        </motion.button>
      </div>
    </Sheet>
  )
}

export default DayDetailSheet
