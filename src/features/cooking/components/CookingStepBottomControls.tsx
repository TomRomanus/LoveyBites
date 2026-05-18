import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ArrowRight, MessageCircleHeart } from 'lucide-react'
import { SPRING_UI } from '@/shared/constants/animations'
import StepProgressIndicator from './StepProgressIndicator'

type CookingStepBottomControlsProps = {
  currentIndex: number
  total: number
  stepDir: 'next' | 'prev' | null
  onGoTo: (index: number) => void
  hasComment: boolean
  onCommentOpen: () => void
}

const navLabelVariants = {
  enter: (dir: 'next' | 'prev' | null) => ({
    opacity: 0,
    x: dir === 'prev' ? -16 : 16,
  }),
  center: { opacity: 1, x: 0 },
  exit: (dir: 'next' | 'prev' | null) => ({
    opacity: 0,
    x: dir === 'prev' ? 16 : -16,
  }),
}

const CookingStepBottomControls = ({
  currentIndex,
  total,
  stepDir,
  onGoTo,
  hasComment,
  onCommentOpen,
}: CookingStepBottomControlsProps) => (
  <motion.div
    key="bottom-controls"
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 12 }}
    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
    className="py-5 px-5 pb-9 shrink-0"
  >
    <StepProgressIndicator currentIndex={currentIndex} total={total} stepDir={stepDir} />

    <div className="flex gap-[10px]">
      <button
        onClick={() => onGoTo(currentIndex - 1)}
        disabled={currentIndex === 0}
        className="w-[52px] h-[52px] rounded-[26px] bg-transparent flex items-center justify-center"
        style={{
          border: `0.5px solid ${currentIndex === 0 ? 'rgba(248,244,237,0.15)' : 'rgba(248,244,237,0.38)'}`,
          color: currentIndex === 0 ? 'rgba(248,244,237,0.25)' : '#f8f4ed',
          cursor: currentIndex === 0 ? 'default' : 'pointer',
        }}
      >
        <ChevronLeft size={22} />
      </button>
      <button
        onClick={() => (currentIndex < total - 1 ? onGoTo(currentIndex + 1) : undefined)}
        disabled={currentIndex === total - 1}
        className="flex-1 h-[52px] rounded-[26px] border-0 text-paper text-[16px] font-medium font-sans inline-flex items-center justify-center overflow-hidden bg-bordeaux"
        style={{
          cursor: currentIndex < total - 1 ? 'pointer' : 'default',
          opacity: currentIndex === total - 1 ? 0.5 : 1,
        }}
      >
        <AnimatePresence mode="popLayout" custom={stepDir}>
          {currentIndex < total - 1 ? (
            <motion.span
              key="next-label"
              custom={stepDir}
              variants={navLabelVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={SPRING_UI}
              className="flex items-center gap-2"
            >
              Volgende stap <ArrowRight size={16} />
            </motion.span>
          ) : (
            <motion.span
              key="done-label"
              custom={stepDir}
              variants={navLabelVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={SPRING_UI}
            >
              Klaar
            </motion.span>
          )}
        </AnimatePresence>
      </button>
      <button
        onClick={onCommentOpen}
        aria-label="Opmerking"
        data-has-comment={hasComment}
        className="w-[52px] h-[52px] rounded-[26px] bg-transparent flex items-center justify-center cursor-pointer"
        style={{
          border: '0.5px solid rgba(232,160,37,0.30)',
          color: 'rgba(232,160,37,0.85)',
        }}
      >
        <MessageCircleHeart size={20} strokeWidth={1.5} />
      </button>
    </div>
  </motion.div>
)

export default CookingStepBottomControls
