import { useState, useEffect } from 'react'

const useDelayedReset = <T>(value: T, resetTo: T, delay: number): T => {
  const [displayed, setDisplayed] = useState<T>(value)

  useEffect(() => {
    setDisplayed(value)
    if (value === resetTo) return
    const timer = setTimeout(() => setDisplayed(resetTo), delay)
    return () => clearTimeout(timer)
  }, [value, resetTo, delay])

  return displayed
}

export default useDelayedReset
