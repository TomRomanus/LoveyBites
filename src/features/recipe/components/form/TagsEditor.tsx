import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

type TagsEditorProps = {
  tags: string[]
  onChange: (tags: string[]) => void
  existingTags?: string[]
}

const TagsEditor = ({ tags, onChange, existingTags = [] }: TagsEditorProps) => {
  const [input, setInput] = useState('')
  const [focused, setFocused] = useState(false)

  const add = () => {
    const v = input.trim().toLowerCase()
    if (v && !tags.includes(v)) onChange([...tags, v])
    setInput('')
  }

  const addSuggestion = (t: string) => {
    if (!tags.includes(t)) onChange([...tags, t])
    setInput('')
  }

  const suggestions = input.trim()
    ? existingTags
        .filter((t) => !tags.includes(t) && t.toLowerCase().includes(input.toLowerCase()))
        .slice(0, 8)
    : []

  const chipStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    background: 'transparent',
    border: '0.5px solid rgba(31,29,26,0.20)',
    borderRadius: 20,
    padding: '4px 8px 4px 10px',
    fontFamily: 'var(--mono)',
    fontSize: 10,
    fontWeight: 500,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--ink-2)',
  }

  return (
    <div>
      <div
        style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', minHeight: 32 }}
      >
        <AnimatePresence mode="popLayout">
          {tags.map((t) => (
            <motion.span
              key={t}
              layout
              initial={{ scale: 0.75, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.75, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              style={chipStyle}
            >
              {t}
              <button
                type="button"
                onClick={() => onChange(tags.filter((x) => x !== t))}
                style={{
                  background: 'none',
                  border: 0,
                  color: 'var(--stone)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                <X size={9} strokeWidth={2.5} />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false)
            add()
          }}
          placeholder="+ TAG"
          size={Math.max(input.length + 1, 5)}
          style={{
            flex: '0 0 auto',
            background: 'transparent',
            border: '1px dashed var(--stone-2)',
            borderRadius: 20,
            outline: 'none',
            fontFamily: 'var(--mono)',
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--ink-2)',
            padding: '5px 11px',
          }}
        />
      </div>
      <AnimatePresence>
        {focused && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 3 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{
              marginTop: 8,
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '0 2px',
              lineHeight: 2,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 9.5,
                letterSpacing: '0.1em',
                color: 'var(--stone-2)',
                paddingRight: 2,
              }}
            >
              +
            </span>
            <AnimatePresence mode="popLayout">
              {suggestions.map((t, i) => (
                <motion.span
                  key={t}
                  layout
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.85, opacity: 0, transition: { duration: 0.1 } }}
                  transition={{ type: 'spring', stiffness: 380, damping: 28, delay: i * 0.035 }}
                  style={{ display: 'inline-flex', alignItems: 'center' }}
                >
                  <span
                    onMouseDown={(e) => {
                      e.preventDefault()
                      addSuggestion(t)
                    }}
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: 10,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--stone)',
                      cursor: 'pointer',
                      padding: '0 4px',
                      borderRadius: 4,
                    }}
                  >
                    {t}
                  </span>
                  {i < suggestions.length - 1 && (
                    <span
                      style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--stone-2)' }}
                    >
                      {' '}
                      ·{' '}
                    </span>
                  )}
                </motion.span>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default TagsEditor
