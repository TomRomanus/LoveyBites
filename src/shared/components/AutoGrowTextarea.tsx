import { forwardRef, useEffect, useLayoutEffect, useRef } from 'react'

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement>

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

const AutoGrowTextarea = forwardRef<HTMLTextAreaElement, Props>(({ value, style, ...props }, forwardedRef) => {
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
  // where scrollHeight may return 0 during the initial synchronous layout phase
  useEffect(() => {
    if (ref.current) resize(ref.current)
  }, [])

  return <textarea ref={mergedRef} value={value} style={{ overflow: 'hidden', ...style }} {...props} />
})

AutoGrowTextarea.displayName = 'AutoGrowTextarea'

export default AutoGrowTextarea
