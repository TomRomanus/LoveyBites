import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import RecipeUrlImport from '../RecipeUrlImport'
import { importRecipeFromUrl } from '@/features/recipe/api/importRecipe'

vi.mock('@/features/recipe/api/importRecipe')

const mockRecipeData = { title: 'Test recept', description: '', ingredients: [], steps: [], tags: [] }

describe('RecipeUrlImport', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the "Link" label and URL input', () => {
    render(<RecipeUrlImport onExtracted={vi.fn()} />)
    expect(screen.getByText('Link')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('https://…')).toBeInTheDocument()
  })

  it('shows helper text mentioning recipe sites and TikTok', () => {
    render(<RecipeUrlImport onExtracted={vi.fn()} />)
    expect(screen.getByText(/TikTok/)).toBeInTheDocument()
  })

  it('disables the submit button when the URL field is empty', () => {
    render(<RecipeUrlImport onExtracted={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Importeren' })).toBeDisabled()
  })

  it('enables the submit button once a URL is typed', async () => {
    render(<RecipeUrlImport onExtracted={vi.fn()} />)
    await userEvent.type(screen.getByPlaceholderText('https://…'), 'https://example.com/recept')
    expect(screen.getByRole('button', { name: 'Importeren' })).toBeEnabled()
  })

  it('shows "Ophalen…" while the import is in progress', async () => {
    vi.mocked(importRecipeFromUrl).mockReturnValue(new Promise(() => {}))
    render(<RecipeUrlImport onExtracted={vi.fn()} />)
    await userEvent.type(screen.getByPlaceholderText('https://…'), 'https://example.com/recept')
    await userEvent.click(screen.getByRole('button', { name: 'Importeren' }))
    expect(screen.getByText('Ophalen…')).toBeInTheDocument()
  })

  it('calls onExtracted with the recipe data on success', async () => {
    vi.mocked(importRecipeFromUrl).mockResolvedValue(mockRecipeData)
    const onExtracted = vi.fn()
    render(<RecipeUrlImport onExtracted={onExtracted} />)
    await userEvent.type(screen.getByPlaceholderText('https://…'), 'https://example.com/recept')
    await userEvent.click(screen.getByRole('button', { name: 'Importeren' }))
    await waitFor(() => expect(onExtracted).toHaveBeenCalledWith(mockRecipeData))
  })

  it('shows the error message when the import fails', async () => {
    vi.mocked(importRecipeFromUrl).mockRejectedValue(new Error('Kon de pagina niet ophalen'))
    render(<RecipeUrlImport onExtracted={vi.fn()} />)
    await userEvent.type(screen.getByPlaceholderText('https://…'), 'https://example.com/recept')
    await userEvent.click(screen.getByRole('button', { name: 'Importeren' }))
    await waitFor(() =>
      expect(screen.getByText('Kon de pagina niet ophalen')).toBeInTheDocument(),
    )
  })

  it('shows the fallback error message when a non-Error is thrown', async () => {
    vi.mocked(importRecipeFromUrl).mockRejectedValue('unknown')
    render(<RecipeUrlImport onExtracted={vi.fn()} />)
    await userEvent.type(screen.getByPlaceholderText('https://…'), 'https://example.com/recept')
    await userEvent.click(screen.getByRole('button', { name: 'Importeren' }))
    await waitFor(() =>
      expect(screen.getByText('Importeren mislukt. Probeer opnieuw.')).toBeInTheDocument(),
    )
  })
})
