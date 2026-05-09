import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Minus, Plus } from 'lucide-react'

type PortionsFieldProps = {
  value: number
  onChange: (v: number) => void
  label?: string
  onLabelChange: (label: 'pers' | 'stuks' | undefined) => void
}

const PortionsField = ({ value, onChange, label, onLabelChange }: PortionsFieldProps) => {
  const [portionDir, setPortionDir] = useState<'up' | 'down' | null>(null)
  const [labelDir, setLabelDir] = useState<'up' | 'down' | null>(null)

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="lb-eyebrow">PORTIES</span>
      <div className="flex items-center gap-2">
        {/* Pers/stuks toggle with sliding pill */}
        <div className="relative flex bg-paper-2 rounded-[18px] p-[3px] h-9">
          {(['pers', 'stuks'] as const).map((opt) => {
            const active = (label || 'pers') === opt
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  setLabelDir(opt === 'stuks' ? 'up' : 'down')
                  onLabelChange(opt === 'pers' ? undefined : opt)
                }}
                className={`relative z-[1] h-[30px] px-3 rounded-[14px] border-0 flex items-center bg-transparent font-mono text-[11px] font-medium uppercase tracking-[0.06em] cursor-pointer transition-colors duration-150 ${active ? 'text-ink' : 'text-stone'}`}
              >
                {active && (
                  <motion.div
                    layoutId="portions-label-pill"
                    className="absolute inset-0 rounded-[14px] bg-cream shadow-[0_1px_2px_rgba(0,0,0,0.06)] -z-[1]"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                {opt}
              </button>
            )
          })}
        </div>
        {/* Portion stepper with animated number */}
        <div className="flex items-center bg-paper-2 rounded-[18px] p-[3px] h-9">
          <button
            type="button"
            onClick={() => {
              setPortionDir('down')
              onChange(Math.max(1, value - 1))
            }}
            className="w-[30px] h-[30px] rounded-[14px] bg-cream border-0 flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.06)] cursor-pointer"
          >
            <Minus size={14} strokeWidth={2.4} />
          </button>
          <div className="min-w-[72px] flex items-center justify-center gap-1 font-mono text-[12px] text-ink tracking-[0.08em] uppercase">
            <div className="overflow-hidden relative">
              <AnimatePresence mode="popLayout" custom={portionDir}>
                <motion.span
                  key={value}
                  custom={portionDir}
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
              <AnimatePresence mode="popLayout" custom={labelDir}>
                <motion.span
                  key={label || 'pers'}
                  custom={labelDir}
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
                  {label || 'pers'}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setPortionDir('up')
              onChange(value + 1)
            }}
            className="w-[30px] h-[30px] rounded-[14px] bg-cream border-0 flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.06)] cursor-pointer"
          >
            <Plus size={14} strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default PortionsField
