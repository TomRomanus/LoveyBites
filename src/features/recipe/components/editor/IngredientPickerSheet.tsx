import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'
import Sheet from '@/shared/components/Sheet'

type IngredientPickerSheetProps = {
  visible: boolean
  selectedIds: Set<string>
  options: Array<{ id: string; text: string }>
  onToggle: (id: string) => void
  onClose: () => void
}

const IngredientPickerSheet = ({
  visible,
  selectedIds,
  options,
  onToggle,
  onClose,
}: IngredientPickerSheetProps) => {
  return (
    <Sheet visible={visible} onClose={onClose}>
      <div className="px-5 pt-3 flex items-center justify-between">
        <h3 className="lb-display m-0 text-[22px]">Ingrediënten</h3>
        {selectedIds.size > 0 && (
          <button
            type="button"
            onClick={() =>
              options.filter((o) => selectedIds.has(o.id)).forEach((o) => onToggle(o.id))
            }
            className="bg-none border-0 text-bordeaux text-[13px] font-medium cursor-pointer"
          >
            Alles wissen
          </button>
        )}
      </div>
      <div className="px-5 pt-4 pb-5 flex flex-wrap gap-2 overflow-hidden">
        {options.length > 0 ? (
          options.map((opt) => (
            <motion.button
              key={opt.id}
              type="button"
              className="lb-tag cursor-pointer gap-1"
              data-active={selectedIds.has(opt.id) ? 'true' : 'false'}
              onClick={() => onToggle(opt.id)}
              layout
              transition={{ layout: { type: 'spring', stiffness: 400, damping: 32 } }}
            >
              <AnimatePresence mode="popLayout">
                {selectedIds.has(opt.id) && (
                  <motion.span
                    key="check"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 25 }}
                    className="inline-flex"
                  >
                    <Check size={14} strokeWidth={2.5} />
                  </motion.span>
                )}
              </AnimatePresence>
              {opt.text}
            </motion.button>
          ))
        ) : (
          <span className="text-[13px] text-stone">Voeg eerst ingrediënten toe</span>
        )}
      </div>
      <div className="px-5 pb-[14px] shrink-0">
        <button type="button" onClick={onClose} className="lb-btn lb-btn--primary w-full">
          Klaar
        </button>
      </div>
    </Sheet>
  )
}

export default IngredientPickerSheet
