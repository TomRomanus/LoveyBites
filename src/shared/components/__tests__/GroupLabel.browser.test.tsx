import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import GroupLabel from '../GroupLabel'

describe('GroupLabel', () => {
  it('renders children text', () => {
    render(<GroupLabel>Voorbereiding</GroupLabel>)
    expect(screen.getByText('Voorbereiding')).toBeInTheDocument()
  })

  it('applies text-bordeaux in light theme (default)', () => {
    const { container } = render(<GroupLabel>Bereiding</GroupLabel>)
    expect(container.querySelector('.text-bordeaux')).toBeInTheDocument()
  })

  it('applies text-bordeaux-mid in dark theme', () => {
    const { container } = render(<GroupLabel theme="dark">Bereiding</GroupLabel>)
    expect(container.querySelector('.text-bordeaux-mid')).toBeInTheDocument()
  })

  it('renders the bar with var(--bordeaux) in light theme', () => {
    const { container } = render(<GroupLabel>Bereiding</GroupLabel>)
    const bar = container.querySelector('[style*="background"]') as HTMLElement
    expect(bar.style.background).toBe('var(--bordeaux)')
  })

  it('renders the bar with var(--bordeaux-mid) in dark theme', () => {
    const { container } = render(<GroupLabel theme="dark">Bereiding</GroupLabel>)
    const bar = container.querySelector('[style*="background"]') as HTMLElement
    expect(bar.style.background).toBe('var(--bordeaux-mid)')
  })

  it('bar has no bottom margin class', () => {
    const { container } = render(<GroupLabel>Bereiding</GroupLabel>)
    const bar = container.querySelector('[style*="background"]') as HTMLElement
    expect(bar.className).not.toMatch(/mb-/)
  })
})
