import { motion, AnimatePresence } from 'framer-motion'
import { SPRING_UI } from '@/shared/constants/animations'

type StepProgressIndicatorProps = {
  currentIndex: number
  total: number
  stepDir: 'next' | 'prev' | null
}

const stepCounterVariants = {
  enter: (dir: 'next' | 'prev' | null) => ({
    x: dir === 'next' ? 8 : dir === 'prev' ? -8 : 0,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (dir: 'next' | 'prev' | null) => ({
    x: dir === 'next' ? -8 : dir === 'prev' ? 8 : 0,
    opacity: 0,
  }),
}

const StepProgressIndicator = ({
  currentIndex,
  total,
  stepDir,
}: StepProgressIndicatorProps) => (
  <>
    <div className="flex justify-center mb-[6px]">
      <div className="font-mono text-[10px] tracking-[0.14em] uppercase overflow-hidden flex items-center gap-[5px] text-paper/30">
        STAP
        <AnimatePresence mode="popLayout" custom={stepDir}>
          <motion.span
            key={currentIndex}
            custom={stepDir}
            variants={stepCounterVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={SPRING_UI}
            className="inline-block"
          >
            {currentIndex + 1}
          </motion.span>
        </AnimatePresence>
        VAN {total}
      </div>
    </div>

    <div className="flex justify-center gap-1 mb-5 items-center">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          animate={{
            width: i === currentIndex ? 18 : 5,
            background:
              i < currentIndex
                ? 'rgba(248,244,237,0.34)'
                : i === currentIndex
                  ? '#f3dee0'
                  : 'rgba(248,244,237,0.13)',
          }}
          transition={{ type: 'spring', stiffness: 420, damping: 30 }}
          className="h-[5px] rounded-[3px] shrink-0"
        />
      ))}
    </div>
  </>
)

export default StepProgressIndicator
