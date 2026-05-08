import { useState, useEffect } from 'react'

const useDelayedReset = <T>(value: T, resetTo: T, delay: number): T => {
  const [displayed, setDisplayed] = useState<T>(value)
  const [prevValue, setPrevValue] = useState<T>(value)

  // Sync displayed immediately when value changes (setState during render — valid React pattern)
  if (prevValue !== value) {
    setPrevValue(value)
    setDisplayed(value)
  }

  useEffect(() => {
    if (value === resetTo) return
    const timer = setTimeout(() => setDisplayed(resetTo), delay)
    return () => clearTimeout(timer)
  }, [value, resetTo, delay])

  return displayed
}

export default useDelayedReset
