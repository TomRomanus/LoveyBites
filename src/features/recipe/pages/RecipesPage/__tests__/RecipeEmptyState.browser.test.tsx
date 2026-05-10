import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import RecipeEmptyState from '../RecipeEmptyState'

describe('RecipeEmptyState', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('without filters', () => {
    it('shows "Je boek is nog leeg" heading', () => {
      render(<RecipeEmptyState hasFilters={false} onClearFilters={vi.fn()} onAddFirst={vi.fn()} />)
      expect(screen.getByText('Je boek is nog leeg')).toBeInTheDocument()
    })

    it('shows descriptive empty-state copy', () => {
      render(<RecipeEmptyState hasFilters={false} onClearFilters={vi.fn()} onAddFirst={vi.fn()} />)
      expect(
        screen.getByText('Begin met het bewaren van je eerste favoriete recept.'),
      ).toBeInTheDocument()
    })

    it('shows "Eerste recept toevoegen" button', () => {
      render(<RecipeEmptyState hasFilters={false} onClearFilters={vi.fn()} onAddFirst={vi.fn()} />)
      expect(screen.getByRole('button', { name: /eerste recept toevoegen/i })).toBeInTheDocument()
    })

    it('calls onAddFirst when the button is clicked', async () => {
      const onAddFirst = vi.fn()
      render(
        <RecipeEmptyState hasFilters={false} onClearFilters={vi.fn()} onAddFirst={onAddFirst} />,
      )
      await userEvent.click(screen.getByRole('button', { name: /eerste recept toevoegen/i }))
      expect(onAddFirst).toHaveBeenCalledOnce()
    })

    it('does not show "Filters wissen" button', () => {
      render(<RecipeEmptyState hasFilters={false} onClearFilters={vi.fn()} onAddFirst={vi.fn()} />)
      expect(screen.queryByRole('button', { name: /filters wissen/i })).not.toBeInTheDocument()
    })
  })

  describe('with filters', () => {
    it('shows "Niets gevonden" heading', () => {
      render(<RecipeEmptyState hasFilters={true} onClearFilters={vi.fn()} onAddFirst={vi.fn()} />)
      expect(screen.getByText('Niets gevonden')).toBeInTheDocument()
    })

    it('shows filter-empty-state copy', () => {
      render(<RecipeEmptyState hasFilters={true} onClearFilters={vi.fn()} onAddFirst={vi.fn()} />)
      expect(screen.getByText('Probeer andere woorden of wis de filters.')).toBeInTheDocument()
    })

    it('shows "Filters wissen" button', () => {
      render(<RecipeEmptyState hasFilters={true} onClearFilters={vi.fn()} onAddFirst={vi.fn()} />)
      expect(screen.getByRole('button', { name: /filters wissen/i })).toBeInTheDocument()
    })

    it('calls onClearFilters when "Filters wissen" is clicked', async () => {
      const onClearFilters = vi.fn()
      render(
        <RecipeEmptyState hasFilters={true} onClearFilters={onClearFilters} onAddFirst={vi.fn()} />,
      )
      await userEvent.click(screen.getByRole('button', { name: /filters wissen/i }))
      expect(onClearFilters).toHaveBeenCalledOnce()
    })

    it('does not show "Eerste recept toevoegen" button', () => {
      render(<RecipeEmptyState hasFilters={true} onClearFilters={vi.fn()} onAddFirst={vi.fn()} />)
      expect(
        screen.queryByRole('button', { name: /eerste recept toevoegen/i }),
      ).not.toBeInTheDocument()
    })
  })
})
