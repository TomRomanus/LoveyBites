import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sheet from '@/shared/components/Sheet'
import AnimatedTabBar from '@/shared/components/AnimatedTabBar'
import TagChip from '@/shared/components/TagChip'
import { parseIngredientText, parseAmount } from '@/features/recipe/utils/ingredientUtils'

type Tab = 'ingredients' | 'amounts'

const TAB_ORDER: Tab[] = ['ingredients', 'amounts']

const TABS: { key: Tab; label: string }[] = [
  { key: 'ingredients', label: 'Ingrediënten' },
  { key: 'amounts', label: 'Hoeveelheden' },
]

type IngredientPickerSheetProps = {
  visible: boolean
  selectedIds: Set<string>
  disabledIds?: Set<string>
  options: Array<{ id: string; text: string }>
  amounts: Record<string, string>
  remainingAmounts?: Record<string, string>
  onToggle: (id: string) => void
  onAmountChange: (id: string, amount: string) => void
  onClose: () => void
}

const IngredientPickerSheet = ({
  visible,
  selectedIds,
  disabledIds,
  options,
  amounts,
  remainingAmounts,
  onToggle,
  onAmountChange,
  onClose,
}: IngredientPickerSheetProps) => {
  const [activeTab, setActiveTab] = useState<Tab>('ingredients')
  const [direction, setDirection] = useState(1)

  const selectedOptions = options.filter((o) => selectedIds.has(o.id))

  // IDs where the entered value is non-empty but not a valid number/fraction
  const invalidFormatIds = new Set(
    selectedOptions
      .filter((opt) => {
        const val = amounts[opt.id] ?? ''
        return val !== '' && isNaN(parseAmount(val))
      })
      .map((opt) => opt.id),
  )

  // IDs where the entered amount exceeds the available remaining amount
  const overLimitIds = new Set(
    selectedOptions
      .filter((opt) => {
        const entered = parseAmount(amounts[opt.id] ?? '')
        const available = parseAmount(
          remainingAmounts?.[opt.id] ?? parseIngredientText(opt.text).amount,
        )
        return !isNaN(entered) && !isNaN(available) && available > 0 && entered > available
      })
      .map((opt) => opt.id),
  )

  const switchTab = (next: Tab) => {
    setDirection(TAB_ORDER.indexOf(next) > TAB_ORDER.indexOf(activeTab) ? 1 : -1)
    setActiveTab(next)
  }

  const handleClose = () => {
    if (overLimitIds.size > 0 || invalidFormatIds.size > 0) {
      switchTab('amounts')
      return
    }
    onClose()
  }

  const variants = {
    enter: (dir: number) => ({ x: dir * 24, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir * -24, opacity: 0 }),
  }

  return (
    <Sheet visible={visible} onClose={onClose}>
      {/* Tab bar */}
      <div className="px-5 pt-5">
        <AnimatedTabBar
          layoutId="picker-tabs"
          tabs={TABS}
          active={activeTab}
          onChange={switchTab}
          variant="underline"
          weight="soft"
        />
      </div>

      {/* Tab content */}
      <div className="overflow-hidden">
        <AnimatePresence mode="popLayout" custom={direction}>
          {activeTab === 'ingredients' ? (
            <motion.div
              key="ingredients"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 380, damping: 32, mass: 0.8 }}
            >
              <div className="px-5 pt-4 pb-1 flex flex-wrap gap-2 overflow-hidden">
                {options.length > 0 ? (
                  options.map((opt) => {
                    const isDisabled = disabledIds?.has(opt.id) ?? false
                    return (
                      <TagChip
                        key={opt.id}
                        label={opt.text}
                        active={selectedIds.has(opt.id)}
                        disabled={isDisabled}
                        layout
                        onClick={() => onToggle(opt.id)}
                      />
                    )
                  })
                ) : (
                  <span className="text-[13px] text-stone">Voeg eerst ingrediënten toe</span>
                )}
              </div>
              <div
                className="px-5 pb-1 flex justify-end"
                style={{ visibility: selectedIds.size > 0 ? 'visible' : 'hidden' }}
              >
                <button
                  type="button"
                  onClick={() =>
                    options.filter((o) => selectedIds.has(o.id)).forEach((o) => onToggle(o.id))
                  }
                  className="bg-none border-0 text-bordeaux text-[13px] font-medium cursor-pointer"
                >
                  Alles wissen
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="amounts"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 380, damping: 32, mass: 0.8 }}
            >
              {selectedOptions.length === 0 ? (
                <div className="px-5 py-4">
                  <span className="text-[13px] text-stone">Selecteer eerst ingrediënten</span>
                </div>
              ) : (
                selectedOptions.map((opt) => {
                  const { amount, maxLabel, name } = parseIngredientText(opt.text)
                  const isOver = overLimitIds.has(opt.id)
                  const isInvalid = invalidFormatIds.has(opt.id)
                  const hasError = isOver || isInvalid
                  const maxAvailable = remainingAmounts?.[opt.id] ?? amount
                  return (
                    <div
                      key={opt.id}
                      className="flex items-center gap-3 px-5 py-[9px] border-b-[0.5px] border-ink/7 last:border-b-0"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] text-ink leading-snug">{name || opt.text}</div>
                        {maxLabel && (
                          <div className="text-[11px] text-stone font-mono mt-[1px]">
                            {maxLabel}
                          </div>
                        )}
                        <AnimatePresence initial={false}>
                          {(isInvalid || isOver) && (
                            <motion.div
                              key={isInvalid ? 'invalid' : 'over'}
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                              style={{ overflow: 'hidden' }}
                            >
                              <div className="text-[11px] text-bordeaux mt-[1px]">
                                {isInvalid ? 'Vul een getal in' : `Max ${maxAvailable} beschikbaar`}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <input
                        type="text"
                        value={amounts[opt.id] ?? maxAvailable}
                        placeholder={maxAvailable}
                        onChange={(e) => onAmountChange(opt.id, e.target.value)}
                        className={`h-8 w-[80px] shrink-0 rounded-[9px] border-0 text-[13px] text-ink font-sans outline-none px-2.5 transition-shadow focus:shadow-[0_0_0_1.5px_var(--bordeaux)] ${
                          hasError ? 'bg-bordeaux-soft' : 'bg-paper-2 focus:bg-cream-card'
                        }`}
                      />
                    </div>
                  )
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-5 pb-[14px] pt-4 shrink-0">
        <button type="button" onClick={handleClose} className="lb-btn lb-btn--primary w-full">
          Klaar
        </button>
      </div>
    </Sheet>
  )
}

export default IngredientPickerSheet
