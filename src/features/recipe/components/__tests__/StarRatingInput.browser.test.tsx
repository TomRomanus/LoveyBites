import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import StarRatingInput from '../StarRatingInput'

function setup(props: Partial<React.ComponentProps<typeof StarRatingInput>> = {}) {
  const defaults = { value: 0 }
  const merged = { ...defaults, ...props }
  return render(<StarRatingInput {...merged} />)
}

describe('StarRatingInput', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('structure', () => {
    it('renders 5 star cells', () => {
      const { container } = setup({ value: 0 })
      // Each star is a w-7 h-7 div containing 2 SVGs
      const starDivs = container.querySelectorAll('div.w-7.h-7.relative.shrink-0')
      expect(starDivs).toHaveLength(5)
    })
  })

  describe('rating label', () => {
    it('shows no label when value is 0', () => {
      setup({ value: 0 })
      // The label container only renders when snappedLive > 0
      expect(screen.queryByText('.')).not.toBeInTheDocument()
    })

    it('shows the integer and decimal parts for a whole-number rating', () => {
      setup({ value: 3 })
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('shows decimal "5" for a half-star rating', () => {
      setup({ value: 2.5 })
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('renders the dot separator between int and decimal parts', () => {
      setup({ value: 4 })
      expect(screen.getByText('.')).toBeInTheDocument()
    })
  })

  describe('cursor style', () => {
    it('uses cursor-grab when onChange is provided', () => {
      const { container } = setup({ onChange: vi.fn() })
      expect(container.querySelector('.cursor-grab')).toBeInTheDocument()
    })

    it('uses cursor-default when onChange is not provided', () => {
      const { container } = setup()
      expect(container.querySelector('.cursor-default')).toBeInTheDocument()
    })
  })

  describe('onChange interaction', () => {
    it('calls onChange when the star row is mousedown-ed and released', () => {
      const onChange = vi.fn()
      const { container } = setup({ value: 0, onChange })
      const row = container.querySelector('.cursor-grab') as HTMLElement
      const rect = row.getBoundingClientRect()
      fireEvent.mouseDown(row, { clientX: rect.left + rect.width / 2 })
      fireEvent(window, new MouseEvent('mouseup'))
      expect(onChange).toHaveBeenCalledOnce()
    })

    it('does not attach mousedown when onChange is absent', () => {
      const { container } = setup({ value: 3 })
      const row = container.querySelector('.cursor-default') as HTMLElement
      // onMouseDown should be undefined — interacting with the row fires no change
      expect(row.onmousedown).toBeNull()
    })
  })
})
