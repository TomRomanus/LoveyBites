import { useRef, useEffect, useCallback, useState } from 'react'
import { animate, AnimatePresence, motion } from 'framer-motion'

const STAR_COUNT = 5
const STAR_PATH = 'M12 3l3 6 6.5 1-4.7 4.6 1.1 6.4L12 18l-5.9 3 1.1-6.4L2.5 10 9 9l3-6z'

const snapToHalf = (n: number) => Math.round(n * 2) / 2

const Stars = ({ value, onChange }: { value: number; onChange?: (v: number) => void }) => {
  const rowRef = useRef<HTMLDivElement>(null)
  const starRefs = useRef<(HTMLDivElement | null)[]>([])
  const isDragging = useRef(false)
  const committedRef = useRef(value)
  const livePosRef = useRef(value)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  })
  useEffect(() => {
    committedRef.current = value
    livePosRef.current = value
  }, [value])

  const [livePos, setLivePos] = useState(value)
  const [dir, setDir] = useState<'up' | 'down'>('up')
  const [prevValue, setPrevValue] = useState(value)

  if (value !== prevValue) {
    setPrevValue(value)
    setLivePos(value)
  }

  const posFromX = useCallback((clientX: number) => {
    const rect = rowRef.current?.getBoundingClientRect()
    if (!rect) return 0
    return Math.max(0, Math.min(STAR_COUNT, ((clientX - rect.left) / rect.width) * STAR_COUNT))
  }, [])

  const finishDrag = useCallback(() => {
    if (!isDragging.current) return
    isDragging.current = false
    const snapped = snapToHalf(livePosRef.current)
    const prev = committedRef.current

    for (let i = 0; i < STAR_COUNT; i++) {
      const el = starRefs.current[i]
      if (!el) continue
      const prevF = Math.max(0, Math.min(1, prev - i))
      const newF = Math.max(0, Math.min(1, snapped - i))
      if (prevF === 0 && newF > 0) {
        animate(
          el,
          { scale: [0.35, 1.32, 1], rotate: [-18, 6, 0], opacity: [0.2, 1, 1] },
          { duration: 0.38, ease: [0.34, 1.56, 0.64, 1], delay: i * 0.055 },
        )
      } else if (prevF > 0 && newF === 0) {
        animate(
          el,
          { scale: [1, 0.65, 1] },
          { duration: 0.22, ease: 'easeIn', delay: Math.max(0, (Math.ceil(prev) - i - 1) * 0.035) },
        )
      }
    }

    committedRef.current = snapped
    setDir(snapped >= prev ? 'up' : 'down')
    setLivePos(snapped)
    onChangeRef.current?.(snapped)
  }, [])

  const moveHandler = useCallback(
    (clientX: number) => {
      if (!isDragging.current) return
      const prevSnapped = snapToHalf(livePosRef.current)
      livePosRef.current = posFromX(clientX)
      const nextSnapped = snapToHalf(livePosRef.current)
      if (nextSnapped !== prevSnapped) setDir(nextSnapped > prevSnapped ? 'up' : 'down')
      setLivePos(livePosRef.current)
    },
    [posFromX],
  )

  useEffect(() => {
    const onMM = (e: MouseEvent) => moveHandler(e.clientX)
    const onTM = (e: TouchEvent) => moveHandler(e.touches[0].clientX)
    window.addEventListener('mousemove', onMM)
    window.addEventListener('touchmove', onTM)
    window.addEventListener('mouseup', finishDrag)
    window.addEventListener('touchend', finishDrag)
    return () => {
      window.removeEventListener('mousemove', onMM)
      window.removeEventListener('touchmove', onTM)
      window.removeEventListener('mouseup', finishDrag)
      window.removeEventListener('touchend', finishDrag)
    }
  }, [finishDrag, moveHandler])

  const snappedLive = snapToHalf(livePos)
  const intPart = snappedLive > 0 ? String(Math.floor(snappedLive)) : ''
  const decPart = snappedLive > 0 ? (snappedLive % 1 === 0 ? '0' : '5') : ''

  return (
    <div className="flex items-start gap-[5px]">
      <div
        ref={rowRef}
        className={`flex gap-[3px] touch-none select-none ${onChange ? 'cursor-grab' : 'cursor-default'}`}
        onMouseDown={
          onChange
            ? (e) => {
                isDragging.current = true
                livePosRef.current = posFromX(e.clientX)
                setLivePos(livePosRef.current)
              }
            : undefined
        }
        onTouchStart={
          onChange
            ? (e) => {
                e.preventDefault()
                isDragging.current = true
                livePosRef.current = posFromX(e.touches[0].clientX)
                setLivePos(livePosRef.current)
              }
            : undefined
        }
      >
        {Array.from({ length: STAR_COUNT }, (_, i) => {
          const frac = Math.max(0, Math.min(1, livePos - i))
          return (
            <div
              key={i}
              ref={(el) => {
                starRefs.current[i] = el
              }}
              className="w-7 h-7 relative shrink-0"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" className="absolute">
                <path
                  d={STAR_PATH}
                  fill="none"
                  stroke="var(--stone-2)"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
              </svg>
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                className="absolute [transition:clip-path_0.06s_ease]"
                style={{
                  clipPath: `inset(0 ${((1 - frac) * 100).toFixed(1)}% 0 0)`,
                }}
              >
                <path
                  d={STAR_PATH}
                  fill="var(--bordeaux)"
                  stroke="var(--bordeaux)"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
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

export default Stars
