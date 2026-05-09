import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { toISO, startOfMonth, isSameDay, calendarGrid } from '@/features/calendar/utils/dateUtils'
import { NL_DAYS_GRID, NL_MONTHS } from '@/shared/constants/locale'
import { titleVariants, pageVariants } from '@/features/calendar/utils/calendarAnimations'

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
    <div ref={ref} className="relative flex-1">
      <div className="lb-eyebrow mb-[5px]">{label}</div>
      <button
        data-testid="date-picker-trigger"
        onClick={handleOpen}
        className="w-full h-[46px] border-0 rounded-[14px] flex items-center gap-[9px] px-3 cursor-pointer transition-[background,box-shadow] duration-150 ease-[ease]"
        style={{
          background: open ? 'var(--cream-card)' : 'var(--paper-2)',
          boxShadow: open
            ? '0 0 0 1.5px var(--bordeaux), 0 2px 8px rgba(107,31,42,0.08)'
            : '0 0 0 0.5px var(--line)',
        }}
      >
        <Calendar size={14} strokeWidth={1.8} color="var(--bordeaux)" className="shrink-0" />
        <span
          className={`flex-1 text-left font-mono text-[13px] whitespace-nowrap ${selected ? 'font-medium text-ink' : 'font-normal text-stone'}`}
        >
          {displayDate}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
          className="flex shrink-0"
        >
          <ChevronDown size={11} strokeWidth={2.2} color="var(--stone)" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            data-testid="date-picker-dropdown"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="absolute top-[calc(100%+8px)] z-[400] bg-[var(--cream-card)] rounded-[18px] shadow-[0_10px_40px_rgba(31,29,26,0.16),0_0_0_0.5px_rgba(31,29,26,0.08)] p-[14px_12px_12px] w-[248px]"
            style={openLeft ? { right: 0 } : { left: 0 }}
          >
            {/* Month navigation */}
            <div className="flex items-center mb-[10px] gap-1">
              <button
                data-testid="date-picker-prev-month"
                onClick={() => moveMonth(-1)}
                className="bg-transparent border-0 p-[5px] text-stone cursor-pointer rounded-[8px] flex items-center"
              >
                <ChevronLeft size={13} strokeWidth={2.2} />
              </button>
              <div className="flex-1 overflow-hidden text-center">
                <AnimatePresence mode="popLayout" custom={monthDir} initial={false}>
                  <motion.div
                    key={`label-${viewMonth.getFullYear()}-${viewMonth.getMonth()}`}
                    custom={monthDir}
                    variants={titleVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="font-serif italic text-[14.5px] font-medium tracking-[-0.01em]"
                  >
                    <span className="text-bordeaux">{NL_MONTHS[viewMonth.getMonth()]}</span>{' '}
                    <span className="text-ink">{viewMonth.getFullYear()}</span>
                  </motion.div>
                </AnimatePresence>
              </div>
              <button
                data-testid="date-picker-next-month"
                onClick={() => moveMonth(1)}
                className="bg-transparent border-0 p-[5px] text-stone cursor-pointer rounded-[8px] flex items-center"
              >
                <ChevronRight size={13} strokeWidth={2.2} />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-[2px] mb-1">
              {NL_DAYS_GRID.map((d) => (
                <div
                  key={d}
                  className="text-center font-mono text-[8px] tracking-[0.1em] text-stone-2 font-semibold uppercase pb-[3px]"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="relative overflow-hidden">
              <AnimatePresence mode="popLayout" custom={monthDir} initial={false}>
                <motion.div
                  key={`grid-${viewMonth.getFullYear()}-${viewMonth.getMonth()}`}
                  custom={monthDir}
                  variants={pageVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="grid grid-cols-7 gap-[2px]"
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
                        className={`h-[30px] border-0 font-sans text-[12.5px] cursor-pointer relative ${isSelected ? 'bg-bordeaux rounded-full' : 'bg-transparent rounded-[8px]'} ${isSelected ? 'text-cream' : isToday ? 'text-bordeaux' : inMonth ? 'text-ink' : 'text-stone-2'} ${isSelected || isToday ? 'font-semibold' : 'font-normal'}`}
                        style={{ opacity: inMonth ? 1 : 0.28 }}
                      >
                        {day.getDate()}
                        {isToday && !isSelected && (
                          <span className="absolute bottom-[3px] left-1/2 -translate-x-1/2 w-[3px] h-[3px] rounded-full bg-bordeaux block" />
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
