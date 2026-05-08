import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { toISO, startOfMonth, isSameDay, calendarGrid } from '../utils/dateUtils'
import { NL_DAYS_GRID, NL_MONTHS } from '../../shared/constants/locale'
import { titleVariants, pageVariants } from './calendarAnimations'

type DatePickerInputProps = {
  label: string
  value: string
  onChange: (v: string) => void
  openLeft?: boolean
}

const DatePickerInput = ({ label, value, onChange, openLeft }: DatePickerInputProps) => {
  const [open, setOpen] = useState(false)
  const [monthDir, setMonthDir] = useState(1)
  const ref = useRef<HTMLDivElement>(null)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const selected = value ? new Date(value + 'T00:00:00') : null
  const [viewMonth, setViewMonth] = useState<Date>(() =>
    selected
      ? new Date(selected.getFullYear(), selected.getMonth(), 1)
      : new Date(today.getFullYear(), today.getMonth(), 1),
  )

  const handleOpen = () => {
    setViewMonth(
      selected
        ? new Date(selected.getFullYear(), selected.getMonth(), 1)
        : new Date(today.getFullYear(), today.getMonth(), 1),
    )
    setOpen((o) => !o)
  }

  useEffect(() => {
    if (!open) return
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  const monthStart = startOfMonth(viewMonth)
  const days = calendarGrid(monthStart)

  const moveMonth = (dir: -1 | 1) => {
    setMonthDir(dir)
    setViewMonth((prev) => {
      const d = new Date(prev)
      d.setMonth(d.getMonth() + dir)
      return d
    })
  }

  const displayDate = selected
    ? `${String(selected.getDate()).padStart(2, '0')}-${String(selected.getMonth() + 1).padStart(2, '0')}-${selected.getFullYear()}`
    : 'Kies datum'

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1 }}>
      <div className="lb-eyebrow" style={{ marginBottom: 5 }}>
        {label}
      </div>
      <button
        onClick={handleOpen}
        style={{
          width: '100%',
          height: 46,
          background: open ? 'var(--cream-card)' : 'var(--paper-2)',
          border: 0,
          borderRadius: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          padding: '0 12px',
          cursor: 'pointer',
          boxShadow: open
            ? '0 0 0 1.5px var(--bordeaux), 0 2px 8px rgba(107,31,42,0.08)'
            : '0 0 0 0.5px var(--line)',
          transition: 'background 0.15s ease, box-shadow 0.15s ease',
        }}
      >
        <Calendar size={14} strokeWidth={1.8} color="var(--bordeaux)" style={{ flexShrink: 0 }} />
        <span
          style={{
            flex: 1,
            textAlign: 'left',
            fontFamily: 'var(--mono)',
            fontSize: 13,
            fontWeight: selected ? 500 : 400,
            color: selected ? 'var(--ink)' : 'var(--stone)',
            whiteSpace: 'nowrap',
          }}
        >
          {displayDate}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
          style={{ display: 'flex', flexShrink: 0 }}
        >
          <ChevronDown size={11} strokeWidth={2.2} color="var(--stone)" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              ...(openLeft ? { right: 0 } : { left: 0 }),
              zIndex: 400,
              background: 'var(--cream-card)',
              borderRadius: 18,
              boxShadow: '0 10px 40px rgba(31,29,26,0.16), 0 0 0 0.5px rgba(31,29,26,0.08)',
              padding: '14px 12px 12px',
              width: 248,
            }}
          >
            {/* Month navigation */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10, gap: 4 }}>
              <button
                onClick={() => moveMonth(-1)}
                style={{
                  background: 'none',
                  border: 0,
                  padding: 5,
                  color: 'var(--stone)',
                  cursor: 'pointer',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ChevronLeft size={13} strokeWidth={2.2} />
              </button>
              <div style={{ flex: 1, overflow: 'hidden', textAlign: 'center' }}>
                <AnimatePresence mode="popLayout" custom={monthDir} initial={false}>
                  <motion.div
                    key={`label-${viewMonth.getFullYear()}-${viewMonth.getMonth()}`}
                    custom={monthDir}
                    variants={titleVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    style={{
                      fontFamily: 'var(--serif)',
                      fontStyle: 'italic',
                      fontSize: 14.5,
                      fontWeight: 500,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    <span style={{ color: 'var(--bordeaux)' }}>
                      {NL_MONTHS[viewMonth.getMonth()]}
                    </span>{' '}
                    <span style={{ color: 'var(--ink)' }}>{viewMonth.getFullYear()}</span>
                  </motion.div>
                </AnimatePresence>
              </div>
              <button
                onClick={() => moveMonth(1)}
                style={{
                  background: 'none',
                  border: 0,
                  padding: 5,
                  color: 'var(--stone)',
                  cursor: 'pointer',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ChevronRight size={13} strokeWidth={2.2} />
              </button>
            </div>

            {/* Day headers */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 2,
                marginBottom: 4,
              }}
            >
              {NL_DAYS_GRID.map((d) => (
                <div
                  key={d}
                  style={{
                    textAlign: 'center',
                    fontFamily: 'var(--mono)',
                    fontSize: 8,
                    letterSpacing: '0.1em',
                    color: 'var(--stone-2)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    padding: '0 0 3px',
                  }}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div style={{ position: 'relative', overflow: 'hidden' }}>
              <AnimatePresence mode="popLayout" custom={monthDir} initial={false}>
                <motion.div
                  key={`grid-${viewMonth.getFullYear()}-${viewMonth.getMonth()}`}
                  custom={monthDir}
                  variants={pageVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}
                >
                  {days.map((day) => {
                    const isSelected = selected ? isSameDay(day, selected) : false
                    const isToday = isSameDay(day, today)
                    const inMonth = day.getMonth() === monthStart.getMonth()
                    return (
                      <motion.button
                        key={toISO(day)}
                        onClick={() => {
                          onChange(toISO(day))
                          setOpen(false)
                        }}
                        whileTap={{ scale: 0.84 }}
                        style={{
                          height: 30,
                          borderRadius: isSelected ? '50%' : 8,
                          border: 0,
                          background: isSelected ? 'var(--bordeaux)' : 'transparent',
                          color: isSelected
                            ? 'var(--cream-card)'
                            : isToday
                              ? 'var(--bordeaux)'
                              : inMonth
                                ? 'var(--ink)'
                                : 'var(--stone-2)',
                          fontFamily: 'var(--sans)',
                          fontSize: 12.5,
                          fontWeight: isSelected || isToday ? 600 : 400,
                          cursor: 'pointer',
                          opacity: inMonth ? 1 : 0.28,
                          position: 'relative',
                        }}
                      >
                        {day.getDate()}
                        {isToday && !isSelected && (
                          <span
                            style={{
                              position: 'absolute',
                              bottom: 3,
                              left: '50%',
                              transform: 'translateX(-50%)',
                              width: 3,
                              height: 3,
                              borderRadius: '50%',
                              background: 'var(--bordeaux)',
                              display: 'block',
                            }}
                          />
                        )}
                      </motion.button>
                    )
                  })}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default DatePickerInput
