import { motion, AnimatePresence } from 'framer-motion'
import { Pause, Play, Plus, RotateCcw, X } from 'lucide-react'
import { useCookTimers } from '@/features/cooking/context/TimerContext'
import { formatCookTime } from '@/features/cooking/utils/formatCookTime'
import { AddTimerForm } from './AddTimerForm'

export function TimerSheet() {
  const {
    timers, pauseTimer, resumeTimer, dismissTimer, addTime,
    sheetOpen, closeSheet, cookModeReturn, cookModeActive,
  } = useCookTimers()

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

            <AnimatePresence initial={false}>
              {timers.length === 0 && (
                <motion.div
                  key="empty"
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="px-5 py-3 text-[15px] text-paper/50 font-sans"
                >
                  Geen actieve timers
                </motion.div>
              )}

              {timers.map((t, i) => {
                const isFinished = t.status === 'finished'
                const isPaused = t.status === 'paused'
                return (
                  <motion.div
                    key={t.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0, overflow: 'hidden' }}
                    transition={{ duration: 0.22, ease: 'easeInOut' }}
                    className={`flex items-center justify-between px-5 py-3 ${i > 0 ? 'border-t-[0.5px] border-paper/[0.10]' : ''}`}
                  >
                    <div>
                      <div className="font-mono text-[11px] tracking-[0.08em] uppercase text-bordeaux-soft/90 mb-[5px]">
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
                      <button
                        onClick={() => addTime(t.id, 60)}
                        aria-label="Een minuut toevoegen"
                        className="h-10 px-3 rounded-xl border-[0.5px] border-honey-500/30 text-honey-500 font-mono font-semibold text-[11px] tracking-[0.08em] uppercase flex items-center gap-1"
                      >
                        <Plus size={11} strokeWidth={2.5} />
                        1 min
                      </button>
                      {t.status === 'running' && (
                        <button
                          onClick={() => pauseTimer(t.id)}
                          aria-label="Timer pauzeren"
                          className="w-10 h-10 rounded-full border-[0.5px] border-paper/20 flex items-center justify-center text-paper/70"
                        >
                          <Pause size={14} fill="currentColor" stroke="none" />
                        </button>
                      )}
                      {t.status === 'paused' && (
                        <button
                          onClick={() => resumeTimer(t.id)}
                          aria-label="Timer hervatten"
                          className="w-10 h-10 rounded-full border border-honey-500/20 flex items-center justify-center text-honey-500"
                        >
                          <Play size={14} fill="currentColor" stroke="none" />
                        </button>
                      )}
                      {t.status === 'finished' && (
                        <button
                          onClick={() => addTime(t.id, t.durationSecs)}
                          aria-label="Timer opnieuw starten"
                          className="w-10 h-10 rounded-full border border-honey-500/20 flex items-center justify-center text-honey-500"
                        >
                          <RotateCcw size={14} strokeWidth={2.5} />
                        </button>
                      )}
                      <button
                        onClick={() => dismissTimer(t.id)}
                        aria-label="Timer verwijderen"
                        className="w-10 h-10 rounded-full border border-terracotta/20 flex items-center justify-center text-terracotta"
                      >
                        <X size={14} strokeWidth={2.5} />
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            <div className={`px-5 py-4 ${timers.length > 0 ? 'border-t-[0.5px] border-paper/[0.10]' : ''}`}>
              <AddTimerForm />
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
