import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCookTimers } from '@/features/cooking/context/TimerContext'
import { formatCookTime } from '@/features/cooking/utils/formatCookTime'

export function TimerSheet() {
  const {
    timers, pauseTimer, resumeTimer, dismissTimer, startTimer,
    sheetOpen, closeSheet, cookModeReturn,
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
            className="fixed bottom-0 left-0 right-0 z-[200] bg-ink-2 rounded-t-[20px] max-h-[80dvh] overflow-y-auto"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 38 }}
          >
            <div className="w-8 h-[3px] bg-paper/20 rounded-full mx-auto mt-3 mb-1" />

            <div className="px-5 py-3 flex items-center justify-between border-b border-paper/[0.06]">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-paper/40">
                Timers
              </span>
              {timers.length === 0 && (
                <span className="text-[13px] text-paper/40">Geen actieve timers</span>
              )}
            </div>

            {timers.map(t => (
              <div
                key={t.id}
                className="flex items-center justify-between px-5 py-3 border-b border-paper/[0.06]"
              >
                <div>
                  <div
                    className={`text-[13px] font-medium font-sans ${
                      t.status === 'finished' ? 'text-rust' : 'text-paper/80'
                    }`}
                  >
                    {t.label}
                  </div>
                  <div
                    className={`font-mono text-[18px] font-medium mt-[1px] ${
                      t.status === 'finished' ? 'text-rust' : 'text-honey-400'
                    }`}
                  >
                    {t.status === 'finished' ? 'Klaar!' : formatCookTime(t.remainingSecs)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {t.status === 'running' && (
                    <button
                      onClick={() => pauseTimer(t.id)}
                      className="text-[12px] text-paper/60 px-3 py-1.5 rounded-full bg-paper/[0.06] font-sans"
                    >
                      Pauze
                    </button>
                  )}
                  {t.status === 'paused' && (
                    <button
                      onClick={() => resumeTimer(t.id)}
                      className="text-[12px] text-paper/60 px-3 py-1.5 rounded-full bg-paper/[0.06] font-sans"
                    >
                      Verder
                    </button>
                  )}
                  <button
                    onClick={() => dismissTimer(t.id)}
                    className="text-[12px] text-paper/40 px-3 py-1.5 rounded-full bg-paper/[0.04] font-sans"
                  >
                    Wissen
                  </button>
                </div>
              </div>
            ))}

            <div className="px-5 py-4">
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
                    <button
                      onClick={handleCancel}
                      className="lb-btn lb-btn--ghost"
                    >
                      Annuleer
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingTimer(true)}
                  className="lb-btn lb-btn--ghost w-full"
                >
                  + Timer toevoegen
                </button>
              )}
            </div>

            {cookModeReturn && (
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

            <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
