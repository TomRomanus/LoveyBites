import { AnimatePresence, motion } from 'framer-motion'
import { Minus, Plus } from 'lucide-react'

type PortionStepperProps = {
  value: number
  onChange: (v: number) => void
  label: string
  dir: 'up' | 'down' | null
}

const PortionStepper = ({ value, onChange, label, dir }: PortionStepperProps) => {
  const displayLabel = label === 'stuks' && value === 1 ? 'stuk' : label
  return (
    <div className="flex items-center bg-paper-2 rounded-[16px] p-[3px]">
      <button
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value === 1}
        className="w-[30px] h-[30px] rounded-[13px] bg-cream border-0 flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.06)] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Minus size={14} strokeWidth={2.4} />
      </button>
      <div className="min-w-[72px] flex items-center justify-center gap-1 font-mono text-[12px] text-ink tracking-[0.08em] uppercase">
        <div className="overflow-hidden relative">
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
              className="block"
            >
              {value}
            </motion.span>
          </AnimatePresence>
        </div>
        <div className="overflow-hidden relative">
          <AnimatePresence mode="popLayout" custom={dir}>
            <motion.span
              key={displayLabel}
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
              className="block"
            >
              {displayLabel}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
      <button
        onClick={() => onChange(value + 1)}
        className="w-[30px] h-[30px] rounded-[13px] bg-cream border-0 flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.06)] cursor-pointer"
      >
        <Plus size={14} strokeWidth={2.4} />
      </button>
    </div>
  )
}

export default PortionStepper
