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
    <div className="relative">
      <div className="absolute left-[14px] top-1/2 -translate-y-1/2 text-stone pointer-events-none">
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
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-0 w-[26px] h-[26px] rounded-[13px] flex items-center justify-center text-stone cursor-pointer"
          >
            <X size={14} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SearchInput
