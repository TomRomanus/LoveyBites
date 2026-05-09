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

  const chipCls =
    'inline-flex items-center gap-[5px] bg-transparent border-[0.5px] border-ink/20 rounded-[20px] py-1 pl-[10px] pr-2 font-mono text-[10px] font-medium tracking-[0.1em] uppercase text-ink-2'

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 items-center min-h-8">
        <AnimatePresence mode="popLayout">
          {tags.map((t) => (
            <motion.span
              key={t}
              layout
              initial={{ scale: 0.75, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.75, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className={chipCls}
            >
              {t}
              <button
                type="button"
                onClick={() => onChange(tags.filter((x) => x !== t))}
                className="bg-none border-0 text-stone cursor-pointer inline-flex items-center p-0 leading-none"
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
          className="flex-[0_0_auto] bg-transparent border border-dashed border-stone-2 rounded-[20px] outline-none font-mono text-[10px] tracking-[0.1em] uppercase text-ink-2 py-[5px] px-[11px]"
        />
      </div>
      <AnimatePresence>
        {focused && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 3 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="mt-2 flex flex-wrap items-center gap-x-0.5 leading-[2]"
          >
            <span className="font-mono text-[9.5px] tracking-[0.1em] text-stone-2 pr-0.5">+</span>
            <AnimatePresence mode="popLayout">
              {suggestions.map((t, i) => (
                <motion.span
                  key={t}
                  layout
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.85, opacity: 0, transition: { duration: 0.1 } }}
                  transition={{ type: 'spring', stiffness: 380, damping: 28, delay: i * 0.035 }}
                  className="inline-flex items-center"
                >
                  <span
                    onMouseDown={(e) => {
                      e.preventDefault()
                      addSuggestion(t)
                    }}
                    className="font-mono text-[10px] tracking-[0.08em] uppercase text-stone cursor-pointer px-1 rounded-[4px]"
                  >
                    {t}
                  </span>
                  {i < suggestions.length - 1 && (
                    <span className="font-mono text-[10px] text-stone-2"> · </span>
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
