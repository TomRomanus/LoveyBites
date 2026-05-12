import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import BottomNav from '../BottomNav'

function setup(initialPath = '/') {
  return render(
    <MemoryRouter
      initialEntries={[initialPath]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <BottomNav />
    </MemoryRouter>,
  )
}

describe('BottomNav', () => {
  describe('links', () => {
    it('renders a Boek link to /', () => {
      setup()
      expect(screen.getByRole('link', { name: /boek/i })).toHaveAttribute('href', '/')
    })

    it('renders a Menu link to /calendar', () => {
      setup()
      expect(screen.getByRole('link', { name: /menu/i })).toHaveAttribute('href', '/calendar')
    })

    it('renders both navigation tabs', () => {
      setup()
      expect(screen.getByRole('link', { name: /boek/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /menu/i })).toBeInTheDocument()
    })
  })

  describe('active tab styling', () => {
    it('gives Boek the active cream color on /', () => {
      setup('/')
      const boekLink = screen.getByRole('link', { name: /boek/i })
      expect(boekLink.style.color).toBe('var(--cream-card)')
    })

    it('gives Menu the inactive ink color on /', () => {
      setup('/')
      const menuLink = screen.getByRole('link', { name: /menu/i })
      expect(menuLink.style.color).toBe('var(--ink-2)')
    })

    it('gives Menu the active cream color on /calendar', () => {
      setup('/calendar')
      const menuLink = screen.getByRole('link', { name: /menu/i })
      expect(menuLink.style.color).toBe('var(--cream-card)')
    })

    it('gives Boek the inactive ink color on /calendar', () => {
      setup('/calendar')
      const boekLink = screen.getByRole('link', { name: /boek/i })
      expect(boekLink.style.color).toBe('var(--ink-2)')
    })
  })
})
