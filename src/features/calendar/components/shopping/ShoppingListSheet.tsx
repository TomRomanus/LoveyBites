import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy } from 'lucide-react'
import DatePickerInput from '@/features/calendar/components/DatePickerInput'
import Sheet from '@/shared/components/Sheet'
import useShoppingList from '@/features/calendar/hooks/useShoppingList'
import ShoppingSection from '@/features/calendar/components/shopping/ShoppingSection'
import ShoppingListSkeleton from '@/features/calendar/components/shopping/ShoppingListSkeleton'

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
  const [copied, setCopied] = useState(false)
  const [checked, setChecked] = useState<Set<string>>(new Set())

  const { loading, fetched, sections, buildCopyText } = useShoppingList(from, to, visible)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChecked(new Set())
  }, [from, to])

  const toggleChecked = (key: string) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(buildCopyText())
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Sheet visible={visible} onClose={onClose} height="88%">
      <div style={{ padding: '12px 22px 0' }}>
        <div className="lb-eyebrow">BOODSCHAPPENLIJST</div>
        <h3 className="lb-display" style={{ margin: '4px 0 0', fontSize: 26 }}>
          Wat we <b>nodig hebben</b>
        </h3>
      </div>
      <div style={{ padding: '14px 22px 16px', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        <DatePickerInput label="VAN" value={from} onChange={setFrom} />
        <div style={{ color: 'var(--stone-2)', fontSize: 14, marginBottom: 14, flexShrink: 0 }}>
          →
        </div>
        <DatePickerInput label="TOT" value={to} onChange={setTo} openLeft />
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '6px 22px' }}>
        <AnimatePresence mode="wait">
          {loading && <ShoppingListSkeleton />}
          {fetched && !loading && sections.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
              style={{
                textAlign: 'center',
                color: 'var(--stone)',
                fontFamily: 'var(--serif)',
                fontStyle: 'italic',
                padding: 30,
              }}
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
                  onToggle={toggleChecked}
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
            style={{ padding: '20px 22px 14px' }}
          >
            <motion.button
              onClick={handleCopy}
              className="lb-btn lb-btn--primary"
              style={{ width: '100%' }}
              whileTap={{ scale: 0.97 }}
            >
              <AnimatePresence mode="wait" initial={false}>
                {copied ? (
                  <motion.span
                    key="success"
                    initial={{ opacity: 0, y: 10, scale: 0.88 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      transition: { type: 'spring', stiffness: 420, damping: 26 },
                    }}
                    exit={{
                      opacity: 0,
                      y: -10,
                      scale: 0.88,
                      transition: { duration: 0.1, ease: [0.4, 0, 1, 1] },
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <motion.path
                        d="M5 13l4 4L19 7"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.32, ease: [0.2, 0, 0, 1], delay: 0.06 }}
                      />
                    </svg>
                    Gekopieerd!
                  </motion.span>
                ) : (
                  <motion.span
                    key="idle"
                    initial={{ opacity: 0, y: -10, scale: 0.88 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      transition: { type: 'spring', stiffness: 420, damping: 26 },
                    }}
                    exit={{
                      opacity: 0,
                      y: 10,
                      scale: 0.88,
                      transition: { duration: 0.1, ease: [0.4, 0, 1, 1] },
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <Copy size={14} />
                    Kopieer
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </Sheet>
  )
}

export default ShoppingListSheet
