import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ArrowRight, MessageCircleHeart } from 'lucide-react'

type CookingStepBottomControlsProps = {
  currentIndex: number
  total: number
  stepDir: 'next' | 'prev' | null
  onGoTo: (index: number) => void
  hasComment: boolean
  onCommentOpen: () => void
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
    <div className="flex justify-center mb-[6px]">
      <div className="font-mono text-[10px] tracking-[0.14em] uppercase overflow-hidden flex items-center gap-[5px] text-paper/30">
        STAP
        <AnimatePresence mode="popLayout" custom={stepDir}>
          <motion.span
            key={currentIndex}
            custom={stepDir}
            variants={{
              enter: (dir: 'next' | 'prev' | null) => ({
                x: dir === 'next' ? 8 : dir === 'prev' ? -8 : 0,
                opacity: 0,
              }),
              center: { x: 0, opacity: 1 },
              exit: (dir: 'next' | 'prev' | null) => ({
                x: dir === 'next' ? -8 : dir === 'prev' ? 8 : 0,
                opacity: 0,
              }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
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
              variants={{
                enter: (dir: 'next' | 'prev' | null) => ({
                  opacity: 0,
                  x: dir === 'prev' ? -16 : 16,
                }),
                center: { opacity: 1, x: 0 },
                exit: (dir: 'next' | 'prev' | null) => ({
                  opacity: 0,
                  x: dir === 'prev' ? 16 : -16,
                }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="flex items-center gap-2"
            >
              Volgende stap <ArrowRight size={16} />
            </motion.span>
          ) : (
            <motion.span
              key="done-label"
              custom={stepDir}
              variants={{
                enter: (dir: 'next' | 'prev' | null) => ({
                  opacity: 0,
                  x: dir === 'prev' ? -16 : 16,
                }),
                center: { opacity: 1, x: 0 },
                exit: (dir: 'next' | 'prev' | null) => ({
                  opacity: 0,
                  x: dir === 'prev' ? 16 : -16,
                }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
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
          border: `0.5px solid ${hasComment ? 'rgba(154,108,42,0.65)' : 'rgba(154,108,42,0.30)'}`,
          color: hasComment ? 'rgba(154,108,42,0.90)' : 'rgba(154,108,42,0.40)',
          background: hasComment ? 'rgba(154,108,42,0.18)' : 'rgba(154,108,42,0.07)',
        }}
      >
        <MessageCircleHeart size={20} strokeWidth={1.5} />
      </button>
    </div>
  </motion.div>
)

export default CookingStepBottomControls
