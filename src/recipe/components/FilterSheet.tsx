import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Search } from 'lucide-react'
import Sheet from '../../shared/components/Sheet'

type FilterSheetProps = {
  visible: boolean
  activeTags: string[]
  allTags: string[]
  onChange: (tags: string[]) => void
  onClose: () => void
}

const FilterSheet = ({ visible, activeTags, allTags, onChange, onClose }: FilterSheetProps) => {
  const [q, setQ] = useState('')
  const filtered = allTags.filter((t) => t.toLowerCase().includes(q.toLowerCase()))
  const toggle = (t: string) =>
    onChange(activeTags.includes(t) ? activeTags.filter((x) => x !== t) : [...activeTags, t])

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
          Filter op tag
        </h3>
        {activeTags.length > 0 && (
          <button
            onClick={() => onChange([])}
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
      <div style={{ padding: '14px 20px 0' }}>
        <div style={{ position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--stone)',
              pointerEvents: 'none',
            }}
          >
            <Search size={16} strokeWidth={1.6} />
          </div>
          <input
            className="lb-input"
            placeholder="Zoek tags"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ paddingLeft: 40, height: 40 }}
            autoFocus
          />
        </div>
      </div>
      <div
        style={{
          padding: '16px 20px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          overflowY: 'auto',
          overflowX: 'hidden',
          flex: 1,
        }}
      >
        {filtered.map((t) => {
          const isActive = activeTags.includes(t)
          return (
            <motion.button
              key={t}
              type="button"
              className="lb-tag"
              data-active={isActive ? 'true' : 'false'}
              onClick={() => toggle(t)}
              layout
              transition={{ layout: { type: 'spring', stiffness: 400, damping: 32 } }}
              style={{ cursor: 'pointer', gap: 4 }}
            >
              <AnimatePresence mode="popLayout">
                {isActive && (
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
              {t}
            </motion.button>
          )
        })}
        {filtered.length === 0 && (
          <div style={{ fontSize: 13, color: 'var(--stone)' }}>
            Geen tags voor &ldquo;{q}&rdquo;.
          </div>
        )}
      </div>
      <div style={{ padding: '0 20px 14px', flexShrink: 0 }}>
        <button onClick={onClose} className="lb-btn lb-btn--primary" style={{ width: '100%' }}>
          Toepassen
        </button>
      </div>
    </Sheet>
  )
}

export default FilterSheet
