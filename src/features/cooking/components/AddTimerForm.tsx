import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useCookTimers } from '@/features/cooking/context/TimerContext'

export function AddTimerForm() {
  const { startTimer } = useCookTimers()

  const [addingTimer, setAddingTimer] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newHours, setNewHours] = useState('')
  const [newMinutes, setNewMinutes] = useState('')
  const [newSeconds, setNewSeconds] = useState('')
  const [hoursAnimKey, setHoursAnimKey] = useState(0)
  const [minutesAnimKey, setMinutesAnimKey] = useState(0)
  const [secondsAnimKey, setSecondsAnimKey] = useState(0)
  const [hoursDir, setHoursDir] = useState<'up' | 'down'>('up')
  const [minutesDir, setMinutesDir] = useState<'up' | 'down'>('up')
  const [secondsDir, setSecondsDir] = useState<'up' | 'down'>('up')

  const hoursInputRef = useRef<HTMLInputElement>(null)
  const minutesInputRef = useRef<HTMLInputElement>(null)
  const secondsInputRef = useRef<HTMLInputElement>(null)

  const handleAdd = () => {
    const h = parseInt(newHours) || 0
    const m = parseInt(newMinutes) || 0
    const s = parseInt(newSeconds) || 0
    const total = h * 3600 + m * 60 + s
    if (total < 1) return
    const label = newLabel.trim() || [
      h > 0 ? `${h}u` : '',
      m > 0 ? `${m}min` : '',
      s > 0 ? `${s}s` : '',
    ].filter(Boolean).join(' ')
    startTimer(label, total)
    handleCancel()
  }

  const changeHours = (delta: number) => {
    const next = Math.max(0, (parseInt(newHours) || 0) + delta)
    setHoursDir(delta > 0 ? 'up' : 'down')
    setHoursAnimKey(k => k + 1)
    setNewHours(String(next))
  }

  const changeMinutes = (delta: number) => {
    const h = parseInt(newHours) || 0
    const m = parseInt(newMinutes) || 0
    const total = m + delta
    if (total >= 60) {
      setHoursDir('up')
      setHoursAnimKey(k => k + 1)
      setNewHours(String(h + Math.floor(total / 60)))
      setMinutesDir('up')
      setMinutesAnimKey(k => k + 1)
      setNewMinutes(String(total % 60))
    } else if (total < 0 && h > 0) {
      setHoursDir('down')
      setHoursAnimKey(k => k + 1)
      setNewHours(String(h - 1))
      setMinutesDir('down')
      setMinutesAnimKey(k => k + 1)
      setNewMinutes(String(60 + total))
    } else {
      setMinutesDir(delta > 0 ? 'up' : 'down')
      setMinutesAnimKey(k => k + 1)
      setNewMinutes(String(Math.max(0, total)))
    }
  }

  const changeSeconds = (delta: number) => {
    const h = parseInt(newHours) || 0
    const m = parseInt(newMinutes) || 0
    const s = parseInt(newSeconds) || 0
    const total = s + delta
    if (total >= 60) {
      const mTotal = m + Math.floor(total / 60)
      if (mTotal >= 60) {
        setHoursDir('up')
        setHoursAnimKey(k => k + 1)
        setNewHours(String(h + Math.floor(mTotal / 60)))
        setMinutesDir('up')
        setMinutesAnimKey(k => k + 1)
        setNewMinutes(String(mTotal % 60))
      } else {
        setMinutesDir('up')
        setMinutesAnimKey(k => k + 1)
        setNewMinutes(String(mTotal))
      }
      setSecondsDir('up')
      setSecondsAnimKey(k => k + 1)
      setNewSeconds(String(total % 60))
    } else if (total < 0 && m > 0) {
      setMinutesDir('down')
      setMinutesAnimKey(k => k + 1)
      setNewMinutes(String(m - 1))
      setSecondsDir('down')
      setSecondsAnimKey(k => k + 1)
      setNewSeconds(String(60 + total))
    } else {
      setSecondsDir(delta > 0 ? 'up' : 'down')
      setSecondsAnimKey(k => k + 1)
      setNewSeconds(String(Math.max(0, total)))
    }
  }

  const handleCancel = () => {
    setAddingTimer(false)
    setNewLabel('')
    setNewHours('')
    setNewMinutes('')
    setNewSeconds('')
    setHoursAnimKey(0)
    setMinutesAnimKey(0)
    setSecondsAnimKey(0)
    setHoursDir('up')
    setMinutesDir('up')
    setSecondsDir('up')
  }

  const segments = [
    { label: 'uur', value: newHours, animKey: hoursAnimKey, dir: hoursDir, ref: hoursInputRef, max: 23, onChange: setNewHours, onUp: () => changeHours(1), onDown: () => changeHours(-1) },
    { label: 'min', value: newMinutes, animKey: minutesAnimKey, dir: minutesDir, ref: minutesInputRef, max: 59, onChange: setNewMinutes, onUp: () => changeMinutes(1), onDown: () => changeMinutes(-1) },
    { label: 'sec', value: newSeconds, animKey: secondsAnimKey, dir: secondsDir, ref: secondsInputRef, max: 59, onChange: setNewSeconds, onUp: () => changeSeconds(1), onDown: () => changeSeconds(-1) },
  ]

  return (
    <>
      <AnimatePresence initial={false}>
        {addingTimer && (
          <motion.div
            key="form-fields"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="flex flex-col gap-3 pb-3">
              <div className="flex items-center justify-center gap-1 bg-paper/5 rounded-[14px] py-2 px-2">
                {segments.map((seg, i) => (
                  <div key={seg.label} className="contents">
                    {i > 0 && (
                      <span className="font-mono text-[28px] font-bold text-paper/25 pb-5 select-none">:</span>
                    )}
                    <div className="flex flex-col items-center gap-0">
                      <button
                        type="button"
                        onClick={seg.onUp}
                        aria-label={`${seg.label} verhogen`}
                        className="w-10 h-7 flex items-center justify-center text-paper/35 bg-transparent border-0 rounded-lg"
                      >
                        <ChevronUp size={14} strokeWidth={2} />
                      </button>

                      <div
                        className="relative w-14 overflow-hidden flex items-center justify-center"
                        style={{ height: 40 }}
                        onClick={() => seg.ref.current?.focus()}
                      >
                        <AnimatePresence mode="popLayout">
                          <motion.div
                            key={`${seg.label}-${seg.animKey}`}
                            initial={seg.animKey > 0 ? { y: seg.dir === 'up' ? 14 : -14, opacity: 0 } : false}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: seg.dir === 'up' ? -14 : 14, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                            className="absolute inset-0 flex items-center justify-center font-mono text-[32px] font-bold pointer-events-none select-none"
                          >
                            {seg.value
                              ? <span className="text-paper">{seg.value}</span>
                              : <span className="text-paper/25">00</span>
                            }
                          </motion.div>
                        </AnimatePresence>
                        <input
                          ref={seg.ref}
                          type="number" min="0" max={seg.max}
                          value={seg.value}
                          onChange={e => seg.onChange(e.target.value)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={seg.onDown}
                        aria-label={`${seg.label} verlagen`}
                        className="w-10 h-7 flex items-center justify-center text-paper/35 bg-transparent border-0 rounded-lg"
                      >
                        <ChevronDown size={14} strokeWidth={2} />
                      </button>

                      <span className="font-mono text-[9px] tracking-[0.12em] uppercase text-paper/35">{seg.label}</span>
                    </div>
                  </div>
                ))}
              </div>
              <input
                className="bg-paper/[0.07] border-[0.5px] border-paper/20 rounded-[10px] px-3 py-[10px] text-paper text-[15px] font-sans placeholder:text-paper/30 outline-none"
                placeholder="Naam (optioneel)"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Always 40px — swaps content without layout shift when form toggles */}
      <AnimatePresence initial={false} mode="wait">
        {addingTimer ? (
          <motion.div
            key="actions-form"
            className="flex gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            <button onClick={handleCancel} className="flex-1 h-10 rounded-full border-[0.5px] border-paper/20 text-paper text-[15px] font-sans">
              Annuleer
            </button>
            <button onClick={handleAdd} className="flex-1 h-10 rounded-full bg-bordeaux/35 border-[0.5px] border-bordeaux-mid/50 text-paper text-[15px] font-semibold font-sans">
              Start
            </button>
          </motion.div>
        ) : (
          <motion.button
            key="actions-add"
            className="w-full h-10 rounded-full border-[0.5px] border-paper/20 text-paper text-[15px] font-sans"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            onClick={() => setAddingTimer(true)}
          >
            Timer toevoegen
          </motion.button>
        )}
      </AnimatePresence>
    </>
  )
}
