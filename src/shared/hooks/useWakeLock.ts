import { useEffect } from 'react'

const useWakeLock = (active: boolean) => {
  useEffect(() => {
    if (!active) return
    let wakeLock: WakeLockSentinel | null = null
    const acquire = async () => {
      try {
        if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen')
      } catch {
        /* non-critical */
      }
    }
    const onVisChange = () => {
      if (document.visibilityState === 'visible') acquire()
    }
    acquire()
    document.addEventListener('visibilitychange', onVisChange)
    return () => {
      document.removeEventListener('visibilitychange', onVisChange)
      wakeLock?.release()
    }
  }, [active])
}

export default useWakeLock
