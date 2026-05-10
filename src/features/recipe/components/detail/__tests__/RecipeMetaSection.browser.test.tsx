import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import RecipeMetaSection from '../RecipeMetaSection'

function setup(props: Partial<React.ComponentProps<typeof RecipeMetaSection>> = {}) {
  const defaults = {
    tags: [],
    showRatingSaved: false,
    onRating: vi.fn(),
  }
  return render(<RecipeMetaSection {...defaults} {...props} />)
}

describe('RecipeMetaSection', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('tags', () => {
    it('renders each tag', () => {
      setup({ tags: ['pasta', 'italiaans'] })
      expect(screen.getByText('pasta')).toBeInTheDocument()
      expect(screen.getByText('italiaans')).toBeInTheDocument()
    })

    it('renders dot separators between tags', () => {
      const { container } = setup({ tags: ['pasta', 'italiaans'] })
      // separator spans contain ' · '
      const separators = Array.from(container.querySelectorAll('span')).filter(
        (s) => s.textContent === ' · ',
      )
      expect(separators).toHaveLength(1)
    })

    it('does not render the tag row when tags is empty', () => {
      const { container } = setup({ tags: [] })
      expect(container.querySelector('.font-mono')).toBeNull()
    })
  })

  describe('description', () => {
    it('renders description when provided', () => {
      setup({ description: 'Een klassiek Italiaans gerecht.' })
      expect(screen.getByText('Een klassiek Italiaans gerecht.')).toBeInTheDocument()
    })

    it('does not render a paragraph when description is absent', () => {
      const { container } = setup()
      expect(container.querySelector('p')).toBeNull()
    })
  })

  describe('star rating input', () => {
    it('renders 5 interactive star cells', () => {
      const { container } = setup()
      const starDivs = container.querySelectorAll('div.w-7.h-7.relative.shrink-0')
      expect(starDivs).toHaveLength(5)
    })

    it('shows the rating label when rating is greater than 0', () => {
      setup({ rating: 4 })
      expect(screen.getByText('4')).toBeInTheDocument()
      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('hides the rating label when rating is 0', () => {
      setup({ rating: 0 })
      expect(screen.queryByText('.')).not.toBeInTheDocument()
    })

    it('calls onRating when the star row is mousedown-ed and released', () => {
      const onRating = vi.fn()
      const { container } = setup({ onRating, rating: 0 })
      const row = container.querySelector('.cursor-grab') as HTMLElement
      const rect = row.getBoundingClientRect()
      fireEvent.mouseDown(row, { clientX: rect.left + rect.width / 2 })
      fireEvent(window, new MouseEvent('mouseup'))
      expect(onRating).toHaveBeenCalledOnce()
    })
  })

  describe('rating saved indicator', () => {
    it('shows the checkmark when showRatingSaved is true', () => {
      const { container } = setup({ showRatingSaved: true })
      // unique path only present in the rating saved SVG
      expect(container.querySelector('path[d="M5 13l4 4L19 7"]')).toBeInTheDocument()
    })

    it('hides the checkmark when showRatingSaved is false', () => {
      const { container } = setup({ showRatingSaved: false })
      expect(container.querySelector('path[d="M5 13l4 4L19 7"]')).toBeNull()
    })
  })
})
