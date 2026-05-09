import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Minus, Plus } from 'lucide-react'

type PortionsFieldProps = {
  value: number
  onChange: (v: number) => void
  label?: string
  onLabelChange: (label: string | undefined) => void
}

const PortionsField = ({ value, onChange, label, onLabelChange }: PortionsFieldProps) => {
  const [portionDir, setPortionDir] = useState<'up' | 'down' | null>(null)
  const [labelDir, setLabelDir] = useState<'up' | 'down' | null>(null)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <span className="lb-eyebrow">PORTIES</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Pers/stuks toggle with sliding pill */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            background: 'var(--paper-2)',
            borderRadius: 18,
            padding: 3,
            height: 36,
          }}
        >
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
                style={{
                  position: 'relative',
                  zIndex: 1,
                  height: 30,
                  padding: '0 12px',
                  borderRadius: 14,
                  border: 0,
                  display: 'flex',
                  alignItems: 'center',
                  background: 'transparent',
                  color: active ? 'var(--ink)' : 'var(--stone)',
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  cursor: 'pointer',
                  transition: 'color 0.15s',
                }}
              >
                {active && (
                  <motion.div
                    layoutId="portions-label-pill"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 14,
                      background: 'var(--cream-card)',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                      zIndex: -1,
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                {opt}
              </button>
            )
          })}
        </div>
        {/* Portion stepper with animated number */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--paper-2)',
            borderRadius: 18,
            padding: 3,
            height: 36,
          }}
        >
          <button
            type="button"
            onClick={() => {
              setPortionDir('down')
              onChange(Math.max(1, value - 1))
            }}
            style={{
              width: 30,
              height: 30,
              borderRadius: 14,
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
                  style={{ display: 'block' }}
                >
                  {value}
                </motion.span>
              </AnimatePresence>
            </div>
            <div style={{ overflow: 'hidden', position: 'relative' }}>
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
                  style={{ display: 'block' }}
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
            style={{
              width: 30,
              height: 30,
              borderRadius: 14,
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
      </div>
    </div>
  )
}

export default PortionsField
