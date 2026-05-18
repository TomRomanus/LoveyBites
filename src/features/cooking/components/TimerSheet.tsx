import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Pause, Play, X } from 'lucide-react'
import { useCookTimers } from '@/features/cooking/context/TimerContext'
import { formatCookTime } from '@/features/cooking/utils/formatCookTime'

export function TimerSheet() {
  const {
    timers, pauseTimer, resumeTimer, dismissTimer, startTimer,
    sheetOpen, closeSheet, cookModeReturn, cookModeActive,
  } = useCookTimers()

  const [addingTimer, setAddingTimer] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newMinutes, setNewMinutes] = useState('')

  const handleAdd = () => {
    const mins = parseInt(newMinutes)
    if (!newLabel.trim() || isNaN(mins) || mins < 1) return
    startTimer(newLabel.trim(), mins * 60)
    handleCancel()
  }

  const handleCancel = () => {
    setAddingTimer(false)
    setNewLabel('')
    setNewMinutes('')
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
                <div className="flex flex-col gap-2">
                  <input
                    className="lb-input text-[14px]"
                    placeholder="Naam (bijv. deeg rijzen)"
                    value={newLabel}
                    onChange={e => setNewLabel(e.target.value)}
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  />
                  <div className="flex gap-2">
                    <input
                      className="lb-input text-[14px] w-28"
                      placeholder="Minuten"
                      type="number"
                      min="1"
                      value={newMinutes}
                      onChange={e => setNewMinutes(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    />
                    <button onClick={handleAdd} className="lb-btn lb-btn--primary flex-1">
                      Start
                    </button>
                    <button onClick={handleCancel} className="h-10 px-4 rounded-full border-[0.5px] border-paper/20 text-paper text-[13px] font-sans">
                      Annuleer
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
