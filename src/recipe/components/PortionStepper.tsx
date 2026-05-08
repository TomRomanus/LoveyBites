import { AnimatePresence, motion } from 'framer-motion'
import { Minus, Plus } from 'lucide-react'

type PortionStepperProps = {
  value: number
  onChange: (v: number) => void
  label: string
  dir: 'up' | 'down' | null
}

const PortionStepper = ({ value, onChange, label, dir }: PortionStepperProps) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      background: 'var(--paper-2)',
      borderRadius: 16,
      padding: 3,
    }}
  >
    <button
      onClick={() => onChange(Math.max(1, value - 1))}
      style={{
        width: 30,
        height: 30,
        borderRadius: 13,
        background: 'var(--cream-card)',
        border: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
        cursor: 'pointer',
      }}
    >
      <Minus size={14} strokeWidth={2.4} />
    </button>
    <div
      style={{
        minWidth: 72,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        fontFamily: 'var(--mono)',
        fontSize: 12,
        color: 'var(--ink)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}
    >
      <div style={{ overflow: 'hidden', position: 'relative' }}>
        <AnimatePresence mode="popLayout" custom={dir}>
          <motion.span
            key={value}
            custom={dir}
            variants={{
              enter: (d: 'up' | 'down' | null) => ({
                y: d === 'up' ? 10 : d === 'down' ? -10 : 0,
                opacity: 0,
              }),
              center: { y: 0, opacity: 1 },
              exit: (d: 'up' | 'down' | null) => ({
                y: d === 'up' ? -10 : d === 'down' ? 10 : 0,
                opacity: 0,
              }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            style={{ display: 'block' }}
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </div>
      <span>{label}</span>
    </div>
    <button
      onClick={() => onChange(value + 1)}
      style={{
        width: 30,
        height: 30,
        borderRadius: 13,
        background: 'var(--cream-card)',
        border: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
        cursor: 'pointer',
      }}
    >
      <Plus size={14} strokeWidth={2.4} />
    </button>
  </div>
)

export default PortionStepper
