import { forwardRef, useEffect, useLayoutEffect, useRef } from 'react'

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  resizeKey?: unknown
}

const resize = (el: HTMLTextAreaElement) => {
  if (!el.value) {
    // scrollHeight for empty textareas is unreliable in Safari (returns 0 with no padding,
    // then useEffect inflates it using the UA rows-based minimum). Use getComputedStyle instead.
    const cs = getComputedStyle(el)
    const lh = parseFloat(cs.lineHeight)
    el.style.height = `${(isNaN(lh) ? 0 : lh) + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)}px`
  } else {
    el.style.height = '1px'
    el.style.height = `${el.scrollHeight}px`
  }
}

const AutoGrowTextarea = forwardRef<HTMLTextAreaElement, Props>(({ value, style, resizeKey, ...props }, forwardedRef) => {
  const ref = useRef<HTMLTextAreaElement>(null)

  const mergedRef = (el: HTMLTextAreaElement | null) => {
    (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = el
    if (typeof forwardedRef === 'function') forwardedRef(el)
    else if (forwardedRef) forwardedRef.current = el
  }

  useLayoutEffect(() => {
    if (ref.current) resize(ref.current)
  }, [value])

  // Re-run after paint on mount — handles elements added inside animated containers
  // where scrollHeight may return 0 during the initial synchronous layout phase.
  // Also re-runs after fonts load: web fonts (e.g. Inter Tight) may not be available
  // on first paint, causing scrollHeight to be calculated with a wider system fallback;
  // once the real font loads the text fits in fewer lines but height was already fixed.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    resize(el)
    document.fonts.ready.then(() => {
      if (el.isConnected) resize(el)
    })
  }, [])

  // When resizeKey changes (e.g. reordering toggle), poll resize on every animation frame
  // for 400ms so height stays correct as the container animates to its new width.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let frame: number
    const start = performance.now()
    const poll = () => {
      if (!el.isConnected) return
      resize(el)
      if (performance.now() - start < 400) frame = requestAnimationFrame(poll)
    }
    frame = requestAnimationFrame(poll)
    return () => cancelAnimationFrame(frame)
  }, [resizeKey])

  return <textarea ref={mergedRef} value={value} style={{ overflow: 'hidden', ...style }} {...props} />
})

AutoGrowTextarea.displayName = 'AutoGrowTextarea'

export default AutoGrowTextarea
