import { useAnimate } from 'framer-motion'
import { useEffect } from 'react'

const LoadingLogo = ({ size = 80 }: { size?: number }) => {
  const [scope, animate] = useAnimate()

  useEffect(() => {
    animate('.lb-heart', {
      opacity: [0, 1, 1, 1, 1],
      rotate: [0, 0, 0, 52, 45],
      scale: [0.45, 1.1, 1, 1, 1],
    }, {
      duration: 1,
      times: [0, 0.3, 0.44, 0.8, 1],
      ease: [0.4, 0, 0.2, 1],
    })

    animate('.lb-bite', { opacity: [0, 1], scale: [0, 1] }, {
      delay: 1.2,
      duration: 0.22,
      ease: [0.34, 1.56, 0.64, 1],
    })
  }, [])

  return (
    <svg ref={scope} viewBox="0 0 64 64" width={size} height={size}>
      <rect width="64" height="64" rx="12" fill="#f8f4ed" />

      <g
        className="lb-heart"
        style={{ transformOrigin: '32px 32px', opacity: 0 }}
      >
        <g transform="translate(33, 37) scale(0.82) translate(-32, -28.5)">
          <path
            d="M32 52 C20 40 6 32 6 20 C6 11 13 5 20 5 C25 5 29 8 32 12 C35 8 39 5 44 5 C51 5 58 11 58 20 C58 32 44 40 32 52Z"
            fill="#6b1f2a"
          />
          <g
            className="lb-bite"
            style={{ transformBox: 'fill-box', transformOrigin: 'center', opacity: 0 }}
          >
            <circle cx="56" cy="12" r="6" fill="#f8f4ed" />
            <circle cx="55" cy="18" r="6" fill="#f8f4ed" />
            <circle cx="57" cy="24" r="6" fill="#f8f4ed" />
          </g>
        </g>
      </g>
    </svg>
  )
}

export default LoadingLogo
