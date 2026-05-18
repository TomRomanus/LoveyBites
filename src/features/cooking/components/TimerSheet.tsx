import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Pause, Play, Plus, X } from 'lucide-react'
import { useCookTimers } from '@/features/cooking/context/TimerContext'
import { formatCookTime } from '@/features/cooking/utils/formatCookTime'

export function TimerSheet() {
  const {
    timers, pauseTimer, resumeTimer, dismissTimer, startTimer,
    sheetOpen, closeSheet, cookModeReturn, cookModeActive,
  } = useCookTimers()

  const [addingTimer, setAddingTimer] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newHours, setNewHours] = useState('')
  const [newMinutes, setNewMinutes] = useState('')
  const [newSeconds, setNewSeconds] = useState('')

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

  const addHours = (n: number) => {
    setNewHours(String((parseInt(newHours) || 0) + n))
  }

  const addMinutes = (n: number) => {
    const total = (parseInt(newMinutes) || 0) + n
    if (total >= 60) {
      setNewHours(String((parseInt(newHours) || 0) + Math.floor(total / 60)))
      setNewMinutes(String(total % 60))
    } else {
      setNewMinutes(String(total))
    }
  }

  const handleCancel = () => {
    setAddingTimer(false)
    setNewLabel('')
    setNewHours('')
    setNewMinutes('')
    setNewSeconds('')
  }

  return (
    <AnimatePresence>
      {sheetOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[190] bg-ink/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSheet}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-[200] bg-ink rounded-t-[20px] border-t border-paper/10 shadow-[0_-8px_32px_rgba(0,0,0,0.5)] max-h-[80dvh] overflow-y-auto"
            style={{ paddingBottom: 'calc(30px + env(safe-area-inset-bottom, 0px))' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 38 }}
          >
            <div className="w-8 h-[3px] bg-paper/20 rounded-full mx-auto mt-3" />

            <div className="px-5 pt-3">
              <span className="font-serif italic text-[22px] text-paper">
                Timers
              </span>
            </div>

            {timers.length === 0 && (
              <div className="px-5 pb-4 text-[13px] text-paper/30 font-sans">
                Geen actieve timers
              </div>
            )}

            {timers.map((t, i) => {
              const isFinished = t.status === 'finished'
              const isPaused = t.status === 'paused'
              return (
                <div
                  key={t.id}
                  className={`flex items-center justify-between px-5 py-3 ${i > 0 ? 'border-t-[0.5px] border-paper/[0.10]' : ''}`}
                >
                  <div>
                    <div className="text-[13px] font-sans mb-[3px] text-paper">
                      {t.label}
                    </div>
                    <motion.div
                      className={`font-mono text-[22px] font-bold leading-none ${
                        isFinished ? 'text-terracotta'
                        : isPaused  ? 'text-paper/40'
                        :             'text-honey-500'
                      }`}
                      animate={isFinished ? { opacity: [1, 0.4, 1] } : { opacity: 1 }}
                      transition={isFinished ? {
                        duration: 1.2,
                        repeat: Infinity,
                        repeatDelay: 0.4,
                        ease: 'easeInOut',
                      } : undefined}
                    >
                      {formatCookTime(t.remainingSecs)}
                    </motion.div>
                  </div>

                  <div className="flex items-center gap-3">
                    {t.status === 'running' && (
                      <button
                        onClick={() => pauseTimer(t.id)}
                        className="w-10 h-10 rounded-full bg-paper/[0.07] border border-paper/[0.08] flex items-center justify-center text-paper/60"
                      >
                        <Pause size={14} fill="currentColor" stroke="none" />
                      </button>
                    )}
                    {t.status === 'paused' && (
                      <button
                        onClick={() => resumeTimer(t.id)}
                        className="w-10 h-10 rounded-full bg-honey-500/10 border border-honey-500/20 flex items-center justify-center text-honey-500"
                      >
                        <Play size={14} fill="currentColor" stroke="none" />
                      </button>
                    )}
                    <button
                      onClick={() => dismissTimer(t.id)}
                      className="w-10 h-10 rounded-full bg-terracotta/10 border border-terracotta/20 flex items-center justify-center text-terracotta"
                    >
                      <X size={14} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              )
            })}

            <div className={`px-5 py-4 ${timers.length > 0 ? 'border-t-[0.5px] border-paper/[0.10]' : ''}`}>
              {addingTimer ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-center gap-1 bg-paper/5 rounded-[14px] py-2 px-2">
                    <div className="flex flex-col items-center gap-1">
                      <input
                        type="number" min="0" max="23"
                        className="w-14 bg-transparent border-none outline-none text-center font-mono text-[32px] font-bold text-paper placeholder:text-paper/25"
                        placeholder="00"
                        value={newHours}
                        onChange={e => setNewHours(e.target.value)}
                      />
                      <span className="font-mono text-[9px] tracking-[0.12em] uppercase text-paper/35">uur</span>
                    </div>
                    <span className="font-mono text-[28px] font-bold text-paper/25 pb-4">:</span>
                    <div className="flex flex-col items-center gap-1">
                      <input
                        type="number" min="0" max="59"
                        className="w-14 bg-transparent border-none outline-none text-center font-mono text-[32px] font-bold text-paper placeholder:text-paper/25"
                        placeholder="00"
                        value={newMinutes}
                        onChange={e => setNewMinutes(e.target.value)}
                      />
                      <span className="font-mono text-[9px] tracking-[0.12em] uppercase text-paper/35">min</span>
                    </div>
                    <span className="font-mono text-[28px] font-bold text-paper/25 pb-4">:</span>
                    <div className="flex flex-col items-center gap-1">
                      <input
                        type="number" min="0" max="59"
                        className="w-14 bg-transparent border-none outline-none text-center font-mono text-[32px] font-bold text-paper placeholder:text-paper/25"
                        placeholder="00"
                        value={newSeconds}
                        onChange={e => setNewSeconds(e.target.value)}
                      />
                      <span className="font-mono text-[9px] tracking-[0.12em] uppercase text-paper/35">sec</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {[
                      { label: '1 uur', action: () => addHours(1) },
                      { label: '5 min', action: () => addMinutes(5) },
                      { label: '1 min', action: () => addMinutes(1) },
                    ].map(({ label, action }) => (
                      <button
                        key={label}
                        onClick={action}
                        className="flex-1 h-10 rounded-full border-[0.5px] border-paper/20 text-paper text-[15px] font-sans flex items-center justify-center gap-[5px]"
                      >
                        <Plus size={10} strokeWidth={2.5} className="block" />
                        {label}
                      </button>
                    ))}
                  </div>
                  <input
                    className="bg-paper/[0.07] border-[0.5px] border-paper/20 rounded-[10px] px-3 py-[10px] text-paper text-[15px] font-sans placeholder:text-paper/30 outline-none"
                    placeholder="Naam (optioneel)"
                    value={newLabel}
                    onChange={e => setNewLabel(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  />
                  <div className="flex gap-2">
                    <button onClick={handleCancel} className="flex-1 h-10 rounded-full border-[0.5px] border-paper/20 text-paper text-[15px] font-sans">
                      Annuleer
                    </button>
                    <button onClick={handleAdd} className="flex-1 h-10 rounded-full bg-bordeaux text-paper text-[15px] font-semibold font-sans">
                      Start
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingTimer(true)}
                  className="w-full h-10 rounded-full border-[0.5px] border-paper/20 text-paper text-[15px] font-sans"
                >
                  Timer toevoegen
                </button>
              )}
            </div>

            {cookModeReturn && !cookModeActive && timers.length > 0 && (
              <div className="px-5 pb-5">
                <button
                  onClick={() => {
                    cookModeReturn()
                    closeSheet()
                  }}
                  className="lb-btn lb-btn--primary w-full"
                >
                  Terug naar kookmodus
                </button>
              </div>
            )}

          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
