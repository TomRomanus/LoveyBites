import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import SectionHeader from '../SectionHeader'

describe('SectionHeader', () => {
  it('renders the eyebrow text', () => {
    render(<SectionHeader eyebrow="DEEL I" title="Ingrediënten" />)
    expect(screen.getByText('DEEL I')).toBeInTheDocument()
  })

  it('renders the title as an h2', () => {
    render(<SectionHeader eyebrow="DEEL I" title="Ingrediënten" />)
    expect(screen.getByRole('heading', { level: 2, name: 'Ingrediënten' })).toBeInTheDocument()
  })

  it('applies the lb-eyebrow class to the eyebrow element', () => {
    const { container } = render(<SectionHeader eyebrow="DEEL I" title="Test" />)
    const eyebrow = container.querySelector('.lb-eyebrow')
    expect(eyebrow).toHaveTextContent('DEEL I')
  })

  it('renders different eyebrow values', () => {
    render(<SectionHeader eyebrow="DEEL IV" title="Bronnen" />)
    expect(screen.getByText('DEEL IV')).toBeInTheDocument()
  })

  it('renders different title values', () => {
    render(<SectionHeader eyebrow="DEEL II" title="Instructies" />)
    expect(screen.getByRole('heading', { name: 'Instructies' })).toBeInTheDocument()
  })
})
