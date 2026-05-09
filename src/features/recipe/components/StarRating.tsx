const STAR_PATH = 'M12 3l3 6 6.5 1-4.7 4.6 1.1 6.4L12 18l-5.9 3 1.1-6.4L2.5 10 9 9l3-6z'

type StarRatingProps = {
  value: number
  size?: number
}

export const StarRating = ({ value, size = 13 }: StarRatingProps) => (
  <div className="inline-flex items-end gap-0.5">
    {Array.from({ length: 5 }, (_, i) => {
      const frac = Math.max(0, Math.min(1, value - i))
      return (
        <div key={i} className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox="0 0 24 24" className="absolute">
            <path
              d={STAR_PATH}
              fill="none"
              stroke="var(--stone-2)"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </svg>
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            className="absolute"
            style={{
              clipPath: `inset(0 ${((1 - frac) * 100).toFixed(1)}% 0 0)`,
            }}
          >
            <path
              d={STAR_PATH}
              fill="var(--bordeaux)"
              stroke="var(--bordeaux)"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )
    })}
  </div>
)
