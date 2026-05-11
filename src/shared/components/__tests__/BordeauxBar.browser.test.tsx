import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import BordeauxBar from '../BordeauxBar'

describe('BordeauxBar', () => {
  it('renders a div element', () => {
    const { container } = render(<BordeauxBar />)
    expect(container.querySelector('div')).toBeInTheDocument()
  })

  it('applies default className containing opacity-55', () => {
    const { container } = render(<BordeauxBar />)
    expect(container.querySelector('.opacity-55')).toBeInTheDocument()
  })

  it('applies a custom className when provided', () => {
    const { container } = render(<BordeauxBar className="opacity-60 mb-2" />)
    expect(container.querySelector('.opacity-60')).toBeInTheDocument()
    expect(container.querySelector('.mb-2')).toBeInTheDocument()
  })

  it('always sets background to var(--bordeaux) via inline style', () => {
    const { container } = render(<BordeauxBar />)
    const el = container.querySelector('div') as HTMLElement
    expect(el.style.background).toBe('var(--bordeaux)')
  })

  it('always sets height to 1.5 via inline style', () => {
    const { container } = render(<BordeauxBar />)
    const el = container.querySelector('div') as HTMLElement
    expect(el.style.height).toBe('1.5px')
  })
})
