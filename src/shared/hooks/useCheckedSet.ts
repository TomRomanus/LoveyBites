import { useState } from 'react'

const useCheckedSet = () => {
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const toggle = (key: string) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }
  const reset = () => setChecked(new Set())
  return { checked, toggle, reset }
}

export default useCheckedSet
