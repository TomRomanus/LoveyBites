import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy } from 'lucide-react'
import DatePickerInput from './DatePickerInput'
import Sheet from '../../shared/components/Sheet'
import useShoppingList from '../hooks/useShoppingList'

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
      <div
        style={{ padding: '14px 22px 16px', display: 'flex', gap: 10, alignItems: 'flex-end' }}
      >
        <DatePickerInput label="VAN" value={from} onChange={setFrom} />
        <div style={{ color: 'var(--stone-2)', fontSize: 14, marginBottom: 14, flexShrink: 0 }}>
          →
        </div>
        <DatePickerInput label="TOT" value={to} onChange={setTo} openLeft />
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '6px 22px' }}>
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {[
                { title: 60, items: [72, 55, 80] },
                { title: 45, items: [65, 48] },
                { title: 70, items: [58, 75, 42, 68] },
              ].map((sec, si) => (
                <div
                  key={si}
                  style={{
                    marginBottom: 16,
                    paddingBottom: 14,
                    borderBottom: '0.5px solid var(--line-soft)',
                  }}
                >
                  <div
                    className="lb-skeleton"
                    style={{ height: 9, width: '28%', borderRadius: 3, marginBottom: 6 }}
                  />
                  <div
                    className="lb-skeleton"
                    style={{
                      height: 16,
                      width: `${sec.title}%`,
                      borderRadius: 4,
                      marginBottom: 10,
                    }}
                  />
                  {sec.items.map((w, ii) => (
                    <div
                      key={ii}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0' }}
                    >
                      <div
                        className="lb-skeleton"
                        style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0 }}
                      />
                      <div
                        className="lb-skeleton"
                        style={{ height: 13, width: `${w}%`, borderRadius: 4 }}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </motion.div>
          )}
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
                <motion.div
                  key={i}
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.22, ease: [0.2, 0, 0, 1] },
                    },
                  }}
                  style={{
                    marginBottom: 16,
                    paddingBottom: 14,
                    borderBottom: '0.5px solid var(--line-soft)',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: 10,
                      color: 'var(--stone)',
                      letterSpacing: '0.1em',
                    }}
                  >
                    {s.days.join(' · ')}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--serif)',
                      fontStyle: 'italic',
                      fontSize: 16,
                      fontWeight: 500,
                      marginTop: 2,
                      marginBottom: 6,
                      color: 'var(--bordeaux)',
                    }}
                  >
                    {s.label}
                  </div>
                  <motion.div
                    variants={{
                      hidden: {},
                      visible: { transition: { staggerChildren: 0.035, delayChildren: 0.06 } },
                    }}
                  >
                    {s.ingredients.map((x, j) => {
                      const key = `${i}-${j}`
                      const isChecked = checked.has(key)
                      return (
                        <motion.div
                          key={j}
                          variants={{
                            hidden: { opacity: 0, x: -8 },
                            visible: {
                              opacity: 1,
                              x: 0,
                              transition: { duration: 0.18, ease: [0.2, 0, 0, 1] },
                            },
                          }}
                        >
                          <button
                            onClick={() => toggleChecked(key)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              padding: '6px 0',
                              background: 'transparent',
                              border: 0,
                              textAlign: 'left',
                              width: '100%',
                              cursor: 'pointer',
                            }}
                          >
                            <motion.span
                              initial={false}
                              animate={{
                                background: isChecked ? 'var(--bordeaux)' : 'transparent',
                                borderColor: isChecked ? 'var(--bordeaux)' : 'var(--stone-2)',
                                scale: isChecked ? [1, 0.82, 1] : 1,
                              }}
                              transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: 6,
                                border: '1.5px solid',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="white"
                                strokeWidth="3"
                              >
                                <motion.path
                                  d="M5 12l5 5L20 7"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  initial={false}
                                  animate={{
                                    pathLength: isChecked ? 1 : 0,
                                    opacity: isChecked ? 1 : 0,
                                  }}
                                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                                />
                              </svg>
                            </motion.span>
                            <span
                              style={{
                                flex: 1,
                                fontSize: 14,
                                color: isChecked ? 'var(--stone)' : 'var(--ink)',
                                opacity: isChecked ? 0.5 : 1,
                                transition: 'color 0.2s ease, opacity 0.2s ease',
                                overflow: 'hidden',
                                position: 'relative',
                              }}
                            >
                              <span
                                style={{
                                  display: 'block',
                                  position: 'relative',
                                  width: 'fit-content',
                                }}
                              >
                                {x}
                                <motion.span
                                  aria-hidden
                                  initial={false}
                                  animate={{ scaleX: isChecked ? 1 : 0 }}
                                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                                  style={{
                                    position: 'absolute',
                                    left: 0,
                                    right: 0,
                                    top: '50%',
                                    height: 1.5,
                                    background: 'currentColor',
                                    transformOrigin: 'left',
                                    pointerEvents: 'none',
                                  }}
                                />
                              </span>
                            </span>
                          </button>
                        </motion.div>
                      )
                    })}
                  </motion.div>
                </motion.div>
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
