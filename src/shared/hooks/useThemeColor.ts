import { useEffect } from 'react'

const useThemeColor = (color: string) => {
  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color)
  }, [color])
}

export default useThemeColor
