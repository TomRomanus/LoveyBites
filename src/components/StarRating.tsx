import { useState } from 'react'

interface StarRatingProps {
  value: number
  onChange?: (rating: number) => void
  size?: 'sm' | 'md'
}

export default function StarRating({ value, onChange, size = 'md' }: StarRatingProps) {
  const [hovered, setHovered] = useState(0)
  const readonly = !onChange

  const starSize = size === 'sm' ? 'text-base' : 'text-2xl'
  const active = hovered || value

  return (
    <div className="flex gap-0.5" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star === value ? 0 : star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          className={`${starSize} leading-none transition-colors ${
            readonly ? 'cursor-default' : 'cursor-pointer'
          } ${star <= active ? 'text-amber-400' : 'text-gray-300'}`}
          aria-label={`${star} ster`}
        >
          ★
        </button>
      ))}
    </div>
  )
}
