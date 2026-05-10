import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import RecipeSources from '../RecipeSources'
import React from 'react'

function setup(sources: React.ComponentProps<typeof RecipeSources>['sources'] = []) {
  return render(<RecipeSources sources={sources} />)
}

describe('RecipeSources', () => {
  describe('headings', () => {
    it('renders the "Bronnen" heading', () => {
      setup([{ url: 'https://example.com' }])
      expect(screen.getByRole('heading', { name: 'Bronnen' })).toBeInTheDocument()
    })

    it('renders the DEEL III eyebrow label by default', () => {
      setup([{ url: 'https://example.com' }])
      expect(screen.getByText('DEEL III')).toBeInTheDocument()
    })

    it('renders DEEL IV when deel prop is "IV"', () => {
      render(<RecipeSources sources={[{ url: 'https://example.com' }]} deel="IV" />)
      expect(screen.getByText('DEEL IV')).toBeInTheDocument()
    })
  })

  describe('source links', () => {
    it('renders each source as a link with the correct href', () => {
      setup([{ url: 'https://example.com/recept' }])
      expect(screen.getByRole('link')).toHaveAttribute('href', 'https://example.com/recept')
    })

    it('uses the label as the link text when provided', () => {
      setup([{ url: 'https://example.com', label: 'Origineel recept' }])
      expect(screen.getByText('Origineel recept')).toBeInTheDocument()
    })

    it('falls back to the URL as link text when no label is provided', () => {
      setup([{ url: 'https://example.com/no-label' }])
      expect(screen.getByText('https://example.com/no-label')).toBeInTheDocument()
    })

    it('renders one link per source', () => {
      setup([
        { url: 'https://a.com', label: 'A' },
        { url: 'https://b.com', label: 'B' },
      ])
      expect(screen.getAllByRole('link')).toHaveLength(2)
    })

    it('opens links in a new tab', () => {
      setup([{ url: 'https://example.com' }])
      expect(screen.getByRole('link')).toHaveAttribute('target', '_blank')
    })

    it('sets rel="noopener noreferrer" on each link', () => {
      setup([{ url: 'https://example.com' }])
      expect(screen.getByRole('link')).toHaveAttribute('rel', 'noopener noreferrer')
    })
  })
})
