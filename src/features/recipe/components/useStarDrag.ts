import { useRef, useEffect, useCallback, useState } from 'react'
import { animate } from 'framer-motion'
import { EASE_OVERSHOOT } from '@/shared/constants/animations'

const STAR_COUNT = 5

const snapToHalf = (n: number) => Math.round(n * 2) / 2

interface UseStarDragOptions {
  value: number
  onChange?: (v: number) => void
}

interface UseStarDragReturn {
  rowRef: React.RefObject<HTMLDivElement | null>
  starRefs: React.MutableRefObject<(HTMLDivElement | null)[]>
  livePos: number
  dir: 'up' | 'down'
  onMouseDown: React.MouseEventHandler<HTMLDivElement> | undefined
  onTouchStart: React.TouchEventHandler<HTMLDivElement> | undefined
}

const useStarDrag = ({ value, onChange }: UseStarDragOptions): UseStarDragReturn => {
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
          { duration: 0.38, ease: EASE_OVERSHOOT, delay: i * 0.055 },
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

  const onMouseDown: React.MouseEventHandler<HTMLDivElement> | undefined = onChange
    ? (e) => {
        isDragging.current = true
        livePosRef.current = posFromX(e.clientX)
        setLivePos(livePosRef.current)
      }
    : undefined

  const onTouchStart: React.TouchEventHandler<HTMLDivElement> | undefined = onChange
    ? (e) => {
        e.preventDefault()
        isDragging.current = true
        livePosRef.current = posFromX(e.touches[0].clientX)
        setLivePos(livePosRef.current)
      }
    : undefined

  return { rowRef, starRefs, livePos, dir, onMouseDown, onTouchStart }
}

export default useStarDrag
