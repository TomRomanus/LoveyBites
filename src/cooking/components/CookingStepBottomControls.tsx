import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ArrowRight } from 'lucide-react'

type CookingStepBottomControlsProps = {
  currentIndex: number
  total: number
  stepDir: 'next' | 'prev' | null
  onGoTo: (index: number) => void
}

const CookingStepBottomControls = ({ currentIndex, total, stepDir, onGoTo }: CookingStepBottomControlsProps) => (
  <motion.div
    key="bottom-controls"
    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
    style={{ padding: '20px 20px 36px', flexShrink: 0 }}
  >
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(248,244,237,0.3)', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 5 }}>
        STAP
        <AnimatePresence mode="popLayout" custom={stepDir}>
          <motion.span
            key={currentIndex}
            custom={stepDir}
            variants={{
              enter: (dir: 'next' | 'prev' | null) => ({ x: dir === 'next' ? 8 : dir === 'prev' ? -8 : 0, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (dir: 'next' | 'prev' | null) => ({ x: dir === 'next' ? -8 : dir === 'prev' ? 8 : 0, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            style={{ display: 'inline-block' }}
          >
            {currentIndex + 1}
          </motion.span>
        </AnimatePresence>
        VAN {total}
      </div>
    </div>

    <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 20, alignItems: 'center' }}>
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          animate={{
            width: i === currentIndex ? 18 : 5,
            background: i < currentIndex
              ? 'rgba(248,244,237,0.34)'
              : i === currentIndex
                ? '#f3dee0'
                : 'rgba(248,244,237,0.13)',
          }}
          transition={{ type: 'spring', stiffness: 420, damping: 30 }}
          style={{ height: 5, borderRadius: 3, flexShrink: 0 }}
        />
      ))}
    </div>

    <div style={{ display: 'flex', gap: 10 }}>
      <button onClick={() => onGoTo(currentIndex - 1)} disabled={currentIndex === 0} style={{
        width: 52, height: 52, borderRadius: 26,
        background: 'transparent',
        border: `0.5px solid ${currentIndex === 0 ? 'rgba(248,244,237,0.15)' : 'rgba(248,244,237,0.38)'}`,
        color: currentIndex === 0 ? 'rgba(248,244,237,0.25)' : '#f8f4ed',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: currentIndex === 0 ? 'default' : 'pointer',
      }}>
        <ChevronLeft size={22} />
      </button>
      <button
        onClick={() => currentIndex < total - 1 ? onGoTo(currentIndex + 1) : undefined}
        disabled={currentIndex === total - 1}
        style={{
          flex: 1, height: 52, borderRadius: 26, background: 'var(--bordeaux)', border: 0,
          color: '#f8f4ed', fontSize: 16, fontWeight: 500, fontFamily: 'var(--sans)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          cursor: currentIndex < total - 1 ? 'pointer' : 'default',
          opacity: currentIndex === total - 1 ? 0.5 : 1,
          overflow: 'hidden',
        }}>
        <AnimatePresence mode="popLayout" custom={stepDir}>
          {currentIndex < total - 1 ? (
            <motion.span key="next-label" custom={stepDir}
              variants={{
                enter: (dir: 'next' | 'prev' | null) => ({ opacity: 0, x: dir === 'prev' ? -16 : 16 }),
                center: { opacity: 1, x: 0 },
                exit: (dir: 'next' | 'prev' | null) => ({ opacity: 0, x: dir === 'prev' ? 16 : -16 }),
              }}
              initial="enter" animate="center" exit="exit"
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              Volgende stap <ArrowRight size={16} />
            </motion.span>
          ) : (
            <motion.span key="done-label" custom={stepDir}
              variants={{
                enter: (dir: 'next' | 'prev' | null) => ({ opacity: 0, x: dir === 'prev' ? -16 : 16 }),
                center: { opacity: 1, x: 0 },
                exit: (dir: 'next' | 'prev' | null) => ({ opacity: 0, x: dir === 'prev' ? 16 : -16 }),
              }}
              initial="enter" animate="center" exit="exit"
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            >
              Klaar
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </div>
  </motion.div>
)

export default CookingStepBottomControls
