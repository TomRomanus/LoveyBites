import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import SheetHeader from '../SheetHeader'

describe('SheetHeader', () => {
  it('renders the eyebrow text', () => {
    render(<SheetHeader eyebrow="MAANDAG">Maaltijd toevoegen</SheetHeader>)
    expect(screen.getByText('MAANDAG')).toBeInTheDocument()
  })

  it('renders the title content as an h3', () => {
    render(<SheetHeader eyebrow="MAANDAG">Maaltijd toevoegen</SheetHeader>)
    expect(screen.getByRole('heading', { level: 3, name: 'Maaltijd toevoegen' })).toBeInTheDocument()
  })

  it('applies lb-eyebrow class to the eyebrow element', () => {
    const { container } = render(<SheetHeader eyebrow="BOODSCHAPPENLIJST">Wat we nodig hebben</SheetHeader>)
    expect(container.querySelector('.lb-eyebrow')).toHaveTextContent('BOODSCHAPPENLIJST')
  })

  it('applies lb-display class to the h3', () => {
    const { container } = render(<SheetHeader eyebrow="X">Title</SheetHeader>)
    expect(container.querySelector('h3.lb-display')).toBeInTheDocument()
  })

  it('renders JSX children in the title', () => {
    render(
      <SheetHeader eyebrow="X">
        Wat we <b>nodig hebben</b>
      </SheetHeader>,
    )
    expect(screen.getByText('nodig hebben')).toBeInTheDocument()
  })

  it('applies a custom titleClassName when provided', () => {
    const { container } = render(
      <SheetHeader eyebrow="X" titleClassName="text-[24px] mb-[14px]">
        Title
      </SheetHeader>,
    )
    expect(container.querySelector('.text-\\[24px\\]')).toBeInTheDocument()
    expect(container.querySelector('.mb-\\[14px\\]')).toBeInTheDocument()
  })
})
