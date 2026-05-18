import { useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { FlatStep } from '@/features/cooking/types/cooking'
import GroupLabel from '@/shared/components/GroupLabel'
import StepComment from '@/shared/components/StepComment'
import { detectTimers } from '@/features/cooking/utils/detectTimers'
import { useCookTimers } from '@/features/cooking/context/TimerContext'

// Animates comment slot height using CSS grid-template-rows (real layout change,
// not a transform) so justify-center repositions the block smoothly each frame.
function CommentSlot({ comment }: { comment: string | undefined }) {
  const lastComment = useRef(comment)
  if (comment !== undefined) lastComment.current = comment

  const visible = comment !== undefined

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateRows: visible ? '1fr' : '0fr',
        marginTop: visible ? 12 : 0,
        transition: [
          'grid-template-rows 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
          'margin-top 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        ].join(', '),
      }}
    >
      <div
        style={{
          overflow: 'hidden',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.18s ease',
        }}
      >
        {lastComment.current && <StepComment comment={lastComment.current} theme="dark" />}
      </div>
    </div>
  )
}

type AdjacentStepProps = {
  step: FlatStep
  label: string
  position: 'prev' | 'next'
  onClick: () => void
}

function AdjacentStep({ step, label, position, onClick }: AdjacentStepProps) {
  const separator = (
    <div
      className={`h-[0.5px] mx-[22px] bg-paper/10 ${position === 'prev' ? 'mb-6' : 'my-6'}`}
    />
  )
  const button = (
    <button
      onClick={onClick}
      className={`block w-full px-[22px] bg-transparent border-0 cursor-pointer text-left opacity-30 ${position === 'prev' ? 'mb-6' : ''}`}
    >
      <div className="font-mono text-[9px] tracking-[0.12em] uppercase text-paper mb-[6px]">
        {label}
      </div>
      <div
        className="font-serif italic text-[18px] leading-[1.35] text-paper"
        style={
          {
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          } as React.CSSProperties
        }
      >
        {step.text}
      </div>
    </button>
  )
  return position === 'prev' ? (
    <>
      {button}
      {separator}
    </>
  ) : (
    <>
      {separator}
      {button}
    </>
  )
}

const STEP_VARIANTS = {
  enter: (dir: 'next' | 'prev' | null) => ({
    x: dir === 'next' ? 40 : dir === 'prev' ? -40 : 0,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (dir: 'next' | 'prev' | null) => ({
    x: dir === 'next' ? -40 : dir === 'prev' ? 40 : 0,
    opacity: 0,
  }),
}

type CookingStepsPanelProps = {
  steps: FlatStep[]
  currentIndex: number
  stepDir: 'next' | 'prev' | null
  currentIngredients: string[]
  onGoTo: (index: number) => void
}

const CookingStepsPanel = ({
  steps,
  currentIndex,
  stepDir,
  currentIngredients,
  onGoTo,
}: CookingStepsPanelProps) => {
  const current = steps[currentIndex]
  const { startTimer, timers } = useCookTimers()
  const detectedTimers = useMemo(() => detectTimers(current.text), [current.text])
  const activeTimerLabels = useMemo(
    () => new Set(timers.filter(t => t.status !== 'finished').map(t => t.label)),
    [timers],
  )

  return (
    <motion.div
      key="step-panel"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="flex-1 overflow-hidden min-h-0 relative flex flex-col justify-center"
    >
      <AnimatePresence mode="popLayout" custom={stepDir}>
        <motion.div
          key={currentIndex}
          custom={stepDir}
          variants={STEP_VARIANTS}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'spring', stiffness: 400, damping: 38, mass: 0.8 }}
        >
          {steps[currentIndex - 1] && (
            <AdjacentStep
              step={steps[currentIndex - 1]}
              label="← Vorige"
              position="prev"
              onClick={() => onGoTo(currentIndex - 1)}
            />
          )}

          <div className="px-[22px]">
            {current.sectionTitle && (
              <div className="mb-[10px]">
                <GroupLabel theme="dark">{current.sectionTitle}</GroupLabel>
              </div>
            )}
            {currentIngredients.length > 0 && (
              <div className="font-mono text-[15px] tracking-[0.09em] uppercase mb-[10px] text-[rgba(243,222,224,0.9)]">
                {currentIngredients.join(' · ')}
              </div>
            )}
            <div className="font-serif font-medium text-[28px] tracking-[-0.02em] leading-[1.25] text-paper">
              {current.text}
            </div>
            <CommentSlot comment={current.comment} />
            {detectedTimers.length > 0 && (
              <div className="mt-4 flex flex-col gap-2">
                {detectedTimers.map((dt, i) => {
                  const label = `Stap ${currentIndex + 1} · ${dt.displayTime}`
                  const active = activeTimerLabels.has(label)
                  return (
                    <button
                      key={i}
                      onClick={() => !active && startTimer(label, dt.durationSecs)}
                      disabled={active}
                      className={`flex items-center gap-2 self-start rounded-xl px-4 h-10 text-[13px] font-semibold font-sans transition-opacity ${
                        active
                          ? 'bg-honey-400/5 border border-honey-400/10 text-honey-400/40 cursor-not-allowed'
                          : 'bg-honey-400/10 border border-honey-400/25 text-honey-400'
                      }`}
                    >
                      <span>{active ? '✓' : '▶'}</span>
                      <span>{active ? `${dt.displayTime} timer actief` : `Start ${dt.displayTime} timer`}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {steps[currentIndex + 1] && (
            <AdjacentStep
              step={steps[currentIndex + 1]}
              label="Volgende →"
              position="next"
              onClick={() => onGoTo(currentIndex + 1)}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <div className="absolute top-0 left-0 right-0 h-12 pointer-events-none bg-gradient-to-b from-ink to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none bg-gradient-to-t from-ink to-transparent" />
    </motion.div>
  )
}

export default CookingStepsPanel
