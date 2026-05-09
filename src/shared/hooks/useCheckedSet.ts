import { useCallback, useState } from 'react'

const useCheckedSet = () => {
  const [checked, setChecked] = useState<Set<string>>(new Set())

  const toggle = useCallback((key: string) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const reset = useCallback(() => setChecked(new Set()), [])

  return { checked, toggle, reset }
}

export default useCheckedSet
