import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import RecipeFormSkeleton from '../RecipeFormSkeleton'

describe('RecipeFormSkeleton', () => {
  describe('display', () => {
    it('renders without crashing', () => {
      const { container } = render(<RecipeFormSkeleton />)
      expect(container.firstChild).toBeInTheDocument()
    })

    it('renders multiple skeleton placeholder elements', () => {
      const { container } = render(<RecipeFormSkeleton />)
      const skeletons = container.querySelectorAll('.lb-skeleton')
      expect(skeletons.length).toBeGreaterThan(1)
    })

    it('does not render any buttons', () => {
      render(<RecipeFormSkeleton />)
      expect(screen.queryAllByRole('button')).toHaveLength(0)
    })

    it('does not render any visible text content', () => {
      const { container } = render(<RecipeFormSkeleton />)
      const text = container.textContent?.trim()
      expect(text).toBe('')
    })
  })
})
