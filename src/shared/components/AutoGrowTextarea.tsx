import { useEffect, useLayoutEffect, useRef } from 'react'

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

const AutoGrowTextarea = ({ value, style, ...props }: Props) => {
  const ref = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    if (ref.current) resize(ref.current)
  }, [value])

  // Re-run after paint on mount — handles elements added inside animated containers
  // where scrollHeight may return 0 during the initial synchronous layout phase
  useEffect(() => {
    if (ref.current) resize(ref.current)
  }, [])

  return <textarea ref={ref} value={value} style={{ overflow: 'hidden', ...style }} {...props} />
}

export default AutoGrowTextarea
