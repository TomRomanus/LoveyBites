import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'
import Sheet from '../../shared/components/Sheet'

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
      <div
        style={{
          padding: '12px 20px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h3 className="lb-display" style={{ margin: 0, fontSize: 22 }}>
          Ingrediënten
        </h3>
        {selectedIds.size > 0 && (
          <button
            type="button"
            onClick={() =>
              options.filter((o) => selectedIds.has(o.id)).forEach((o) => onToggle(o.id))
            }
            style={{
              background: 'none',
              border: 0,
              color: 'var(--bordeaux)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Alles wissen
          </button>
        )}
      </div>
      <div
        style={{
          padding: '16px 20px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          overflow: 'hidden',
        }}
      >
        {options.length > 0 ? (
          options.map((opt) => (
            <motion.button
              key={opt.id}
              type="button"
              className="lb-tag"
              data-active={selectedIds.has(opt.id) ? 'true' : 'false'}
              onClick={() => onToggle(opt.id)}
              layout
              transition={{ layout: { type: 'spring', stiffness: 400, damping: 32 } }}
              style={{ cursor: 'pointer', gap: 4 }}
            >
              <AnimatePresence mode="popLayout">
                {selectedIds.has(opt.id) && (
                  <motion.span
                    key="check"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 25 }}
                    style={{ display: 'inline-flex' }}
                  >
                    <Check size={14} strokeWidth={2.5} />
                  </motion.span>
                )}
              </AnimatePresence>
              {opt.text}
            </motion.button>
          ))
        ) : (
          <span style={{ fontSize: 13, color: 'var(--stone)' }}>
            Voeg eerst ingrediënten toe
          </span>
        )}
      </div>
      <div style={{ padding: '0 20px 14px', flexShrink: 0 }}>
        <button
          type="button"
          onClick={onClose}
          className="lb-btn lb-btn--primary"
          style={{ width: '100%' }}
        >
          Klaar
        </button>
      </div>
    </Sheet>
  )
}

export default IngredientPickerSheet
