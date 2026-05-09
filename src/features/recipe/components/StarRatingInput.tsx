import { AnimatePresence, motion } from 'framer-motion'
import useStarDrag from './useStarDrag'

const STAR_COUNT = 5
const STAR_PATH = 'M12 3l3 6 6.5 1-4.7 4.6 1.1 6.4L12 18l-5.9 3 1.1-6.4L2.5 10 9 9l3-6z'

const StarRatingInput = ({ value, onChange }: { value: number; onChange?: (v: number) => void }) => {
  const { rowRef, starRefs, livePos, dir, onMouseDown, onTouchStart } = useStarDrag({ value, onChange })

  const snappedLive = Math.round(livePos * 2) / 2
  const intPart = snappedLive > 0 ? String(Math.floor(snappedLive)) : ''
  const decPart = snappedLive > 0 ? (snappedLive % 1 === 0 ? '0' : '5') : ''

  return (
    <div className="flex items-start gap-[5px]">
      <div
        ref={rowRef}
        className={`flex gap-[3px] touch-none select-none ${onChange ? 'cursor-grab' : 'cursor-default'}`}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        {Array.from({ length: STAR_COUNT }, (_, i) => {
          const frac = Math.max(0, Math.min(1, livePos - i))
          return (
            <div
              key={i}
              ref={(el) => { starRefs.current[i] = el }}
              className="w-7 h-7 relative shrink-0"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" className="absolute">
                <path d={STAR_PATH} fill="none" stroke="var(--stone-2)" strokeWidth="1.4" strokeLinejoin="round" />
              </svg>
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                className="absolute [transition:clip-path_0.06s_ease]"
                style={{ clipPath: `inset(0 ${((1 - frac) * 100).toFixed(1)}% 0 0)` }}
              >
                <path d={STAR_PATH} fill="var(--bordeaux)" stroke="var(--bordeaux)" strokeWidth="1.4" strokeLinejoin="round" />
              </svg>
            </div>
          )
        })}
      </div>

      {snappedLive > 0 && (
        <div className="flex items-center -mt-[3px] font-mono text-[12px] font-medium tracking-[0] text-bordeaux/45">
          <div className="overflow-hidden h-[14px] flex items-center">
            <AnimatePresence mode="popLayout" custom={dir}>
              <motion.span
                key={`i${intPart}`}
                custom={dir}
                variants={{
                  enter: (d: string) => ({ y: d === 'up' ? 10 : -10, opacity: 0 }),
                  center: { y: 0, opacity: 1 },
                  exit: (d: string) => ({ y: d === 'up' ? -10 : 10, opacity: 0 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className="block"
              >
                {intPart}
              </motion.span>
            </AnimatePresence>
          </div>
          <span>.</span>
          <div className="overflow-hidden h-[14px] flex items-center">
            <AnimatePresence mode="popLayout" custom={dir}>
              <motion.span
                key={`d${decPart}`}
                custom={dir}
                variants={{
                  enter: (d: string) => ({ y: d === 'up' ? 10 : -10, opacity: 0 }),
                  center: { y: 0, opacity: 1 },
                  exit: (d: string) => ({ y: d === 'up' ? -10 : 10, opacity: 0 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className="block"
              >
                {decPart}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  )
}

export default StarRatingInput
