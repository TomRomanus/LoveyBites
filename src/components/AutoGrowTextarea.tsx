import { useEffect, useRef } from 'react'

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement>

export default function AutoGrowTextarea({ value, style, ...props }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = '1px'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  return (
    <textarea
      ref={ref}
      value={value}
      style={{ overflow: 'hidden', ...style }}
      {...props}
    />
  )
}
