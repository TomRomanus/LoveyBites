import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { StarRating } from '../StarRating'

const STAR_PATH = 'M12 3l3 6 6.5 1-4.7 4.6 1.1 6.4L12 18l-5.9 3 1.1-6.4L2.5 10 9 9l3-6z'

// The fill overlay SVG is the only SVG with an inline style (clipPath).
function getFillSvgs(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll('svg[style]')) as HTMLElement[]
}

// Parses the right-inset percentage from a browser-serialized clip-path such as
// "inset(0px 50% 0px 0px)" — the second whitespace-separated token inside inset().
function parseRightInsetPercent(clipPath: string): number {
  const m = clipPath.match(/inset\(([^)]+)\)/)
  if (!m) return NaN
  const tokens = m[1].trim().split(/\s+/)
  const rightToken = tokens.length >= 2 ? tokens[1] : tokens[0]
  return parseFloat(rightToken)
}

describe('StarRating', () => {
  describe('structure', () => {
    it('renders 5 star cells', () => {
      const { container } = render(<StarRating value={3} />)
      expect(container.querySelectorAll('div.relative.shrink-0')).toHaveLength(5)
    })

    it('renders the star path in every SVG (outline + fill per star)', () => {
      const { container } = render(<StarRating value={3} />)
      expect(container.querySelectorAll(`path[d="${STAR_PATH}"]`)).toHaveLength(10)
    })
  })

  describe('size prop', () => {
    it('defaults to 13px', () => {
      const { container } = render(<StarRating value={3} />)
      const first = container.querySelector('svg')!
      expect(first.getAttribute('width')).toBe('13')
      expect(first.getAttribute('height')).toBe('13')
    })

    it('applies a custom size to all SVGs', () => {
      const { container } = render(<StarRating value={3} size={24} />)
      Array.from(container.querySelectorAll('svg')).forEach((svg) => {
        expect(svg.getAttribute('width')).toBe('24')
        expect(svg.getAttribute('height')).toBe('24')
      })
    })
  })

  describe('fill fraction via clipPath', () => {
    it('fully fills all stars when value is 5', () => {
      const { container } = render(<StarRating value={5} />)
      getFillSvgs(container).forEach((svg) => {
        expect(parseRightInsetPercent(svg.style.clipPath)).toBeCloseTo(0)
      })
    })

    it('leaves all stars empty when value is 0', () => {
      const { container } = render(<StarRating value={0} />)
      getFillSvgs(container).forEach((svg) => {
        expect(parseRightInsetPercent(svg.style.clipPath)).toBeCloseTo(100)
      })
    })

    it('correctly distributes fill for value 2.5', () => {
      const { container } = render(<StarRating value={2.5} />)
      const fills = getFillSvgs(container)
      expect(parseRightInsetPercent(fills[0].style.clipPath)).toBeCloseTo(0)   // fully filled
      expect(parseRightInsetPercent(fills[1].style.clipPath)).toBeCloseTo(0)   // fully filled
      expect(parseRightInsetPercent(fills[2].style.clipPath)).toBeCloseTo(50)  // half filled
      expect(parseRightInsetPercent(fills[3].style.clipPath)).toBeCloseTo(100) // empty
      expect(parseRightInsetPercent(fills[4].style.clipPath)).toBeCloseTo(100) // empty
    })

    it('clamps fill to 0 for values below 0', () => {
      const { container } = render(<StarRating value={-1} />)
      getFillSvgs(container).forEach((svg) => {
        expect(parseRightInsetPercent(svg.style.clipPath)).toBeCloseTo(100)
      })
    })

    it('clamps fill to 1 for values above 5', () => {
      const { container } = render(<StarRating value={10} />)
      getFillSvgs(container).forEach((svg) => {
        expect(parseRightInsetPercent(svg.style.clipPath)).toBeCloseTo(0)
      })
    })
  })
})
