import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import RecipeSearchBar from '../RecipeSearchBar'

type Props = React.ComponentProps<typeof RecipeSearchBar>

function setup(overrides: Partial<Props> = {}) {
  const props: Props = {
    searchQuery: '',
    onSearchChange: vi.fn(),
    activeTags: [],
    onFiltersOpen: vi.fn(),
    onSortOpen: vi.fn(),
    sortLabel: 'A-Z',
    count: 5,
    loading: false,
    ...overrides,
  }
  const result = render(<RecipeSearchBar {...props} />)
  return { props, ...result }
}

describe('RecipeSearchBar', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('search input', () => {
    it('renders the search input', () => {
      setup()
      expect(screen.getByPlaceholderText('Zoek recept of ingrediënt')).toBeInTheDocument()
    })

    it('calls onSearchChange when typing in the search input', async () => {
      const { props } = setup()
      await userEvent.type(screen.getByPlaceholderText('Zoek recept of ingrediënt'), 'pasta')
      expect(props.onSearchChange).toHaveBeenCalled()
    })
  })

  describe('recipe count label', () => {
    it('shows the recipe count', () => {
      const { container } = setup({ count: 7 })
      const eyebrow = container.querySelector('.lb-eyebrow')
      expect(eyebrow).toHaveTextContent('7')
    })

    it('shows "RECEPTEN" for count greater than 1', () => {
      const { container } = setup({ count: 7 })
      const eyebrow = container.querySelector('.lb-eyebrow')
      expect(eyebrow).toHaveTextContent('RECEPTEN')
    })

    it('shows "RECEPT" singular for count === 1', () => {
      const { container } = setup({ count: 1 })
      const eyebrow = container.querySelector('.lb-eyebrow')
      expect(eyebrow).toHaveTextContent('RECEPT')
      expect(eyebrow).not.toHaveTextContent('RECEPTEN')
    })

    it('shows "RECEPTEN" for count === 0', () => {
      const { container } = setup({ count: 0 })
      const eyebrow = container.querySelector('.lb-eyebrow')
      expect(eyebrow).toHaveTextContent('RECEPTEN')
    })
  })

  describe('filter button', () => {
    it('renders the Tags filter button', () => {
      setup()
      expect(screen.getByRole('button', { name: /tags/i })).toBeInTheDocument()
    })

    it('calls onFiltersOpen when Tags button is clicked', async () => {
      const { props } = setup()
      await userEvent.click(screen.getByRole('button', { name: /tags/i }))
      expect(props.onFiltersOpen).toHaveBeenCalledOnce()
    })

    it('shows active tag count badge when tags are active', () => {
      const { container } = setup({ activeTags: ['vegetarisch', 'snel'] })
      const badge = container.querySelector('.bg-bordeaux')
      expect(badge).toHaveTextContent('2')
    })

    it('does not show tag badge when no tags are active', () => {
      const { container } = setup({ activeTags: [] })
      const tagsButton = screen.getByRole('button', { name: /tags/i })
      expect(tagsButton.querySelector('.bg-bordeaux')).toBeNull()
    })
  })

  describe('sort button', () => {
    it('renders the sort button with the sort label', () => {
      setup({ sortLabel: 'Nieuwste eerst' })
      expect(screen.getByRole('button', { name: /nieuwste eerst/i })).toBeInTheDocument()
    })

    it('calls onSortOpen when sort button is clicked', async () => {
      const { props } = setup()
      await userEvent.click(screen.getByRole('button', { name: /a-z/i }))
      expect(props.onSortOpen).toHaveBeenCalledOnce()
    })
  })

  describe('loading state', () => {
    it('does not render the count label while loading', () => {
      const { container } = setup({ loading: true })
      expect(container.querySelector('.lb-eyebrow')).toBeNull()
    })

    it('does not render filter and sort buttons while loading', () => {
      setup({ loading: true })
      expect(screen.queryByRole('button', { name: /tags/i })).not.toBeInTheDocument()
    })
  })
})
