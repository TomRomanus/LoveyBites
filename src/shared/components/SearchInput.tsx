import { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X } from 'lucide-react'

type SearchInputProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoFocus?: boolean
  inputRef?: React.RefObject<HTMLInputElement>
}

const SearchInput = ({
  value,
  onChange,
  placeholder = 'Zoeken...',
  autoFocus,
  inputRef,
}: SearchInputProps) => {
  const localRef = useRef<HTMLInputElement>(null)
  const ref = inputRef ?? localRef

  return (
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
        <Search size={18} strokeWidth={1.6} />
      </div>
      <input
        ref={ref}
        className="lb-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
        style={{ paddingLeft: 42, paddingRight: value ? 42 : 14 }}
      />
      <AnimatePresence>
        {value && (
          <motion.button
            key="clear"
            onClick={() => onChange('')}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            style={{
              position: 'absolute',
              right: 8,
              top: '50%',
              translateY: '-50%',
              background: 'none',
              border: 0,
              width: 26,
              height: 26,
              borderRadius: 13,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--stone)',
              cursor: 'pointer',
            }}
          >
            <X size={14} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SearchInput
