import { motion, AnimatePresence } from 'framer-motion'
import type { FlatStep } from '@/features/cooking/types/cooking'

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
          variants={{
            enter: (dir: 'next' | 'prev' | null) => ({
              x: dir === 'next' ? 40 : dir === 'prev' ? -40 : 0,
              opacity: 0,
            }),
            center: { x: 0, opacity: 1 },
            exit: (dir: 'next' | 'prev' | null) => ({
              x: dir === 'next' ? -40 : dir === 'prev' ? 40 : 0,
              opacity: 0,
            }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'spring', stiffness: 400, damping: 38, mass: 0.8 }}
        >
          {/* Prev step */}
          {steps[currentIndex - 1] && (
            <>
              <button
                onClick={() => onGoTo(currentIndex - 1)}
                className="block w-full px-[22px] bg-transparent border-0 cursor-pointer text-left opacity-30 mb-6"
              >
                <div className="font-mono text-[9px] tracking-[0.12em] uppercase text-paper mb-[6px]">
                  ← Vorige
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
                  {steps[currentIndex - 1].text}
                </div>
              </button>
              <div className="h-[0.5px] mx-[22px] mb-6 bg-paper/10" />
            </>
          )}

          {/* Current step */}
          <div className="px-[22px]">
            {current.sectionTitle && (
              <>
                <div className="font-serif italic text-[14px] font-medium mb-[3px] text-[#b8394e]">
                  {current.sectionTitle}
                </div>
                <div className="w-[22px] h-[1.5px] rounded-[1px] opacity-60 mb-[10px] bg-[#b8394e]" />
              </>
            )}
            {currentIngredients.length > 0 && (
              <div className="font-mono text-[15px] tracking-[0.09em] uppercase mb-[10px] text-[rgba(243,222,224,0.9)]">
                {currentIngredients.join(' · ')}
              </div>
            )}
            <div className="font-serif font-medium text-[28px] tracking-[-0.02em] leading-[1.25] text-paper">
              {current.text}
            </div>
          </div>

          {/* Next step */}
          {steps[currentIndex + 1] && (
            <>
              <div className="h-[0.5px] mx-[22px] my-6 bg-paper/10" />
              <button
                onClick={() => onGoTo(currentIndex + 1)}
                className="block w-full px-[22px] bg-transparent border-0 cursor-pointer text-left opacity-30"
              >
                <div className="font-mono text-[9px] tracking-[0.12em] uppercase text-paper mb-[6px]">
                  Volgende →
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
                  {steps[currentIndex + 1].text}
                </div>
              </button>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Gradient fades */}
      <div className="absolute top-0 left-0 right-0 h-12 pointer-events-none bg-gradient-to-b from-ink to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none bg-gradient-to-t from-ink to-transparent" />
    </motion.div>
  )
}

export default CookingStepsPanel
