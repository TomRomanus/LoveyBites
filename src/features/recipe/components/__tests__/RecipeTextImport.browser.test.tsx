import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import RecipeTextImport from '../RecipeTextImport'
import { importRecipeFromText } from '@/features/recipe/api/importRecipe'

vi.mock('@/features/recipe/api/importRecipe')

const mockRecipeData = { title: 'Test recept', description: '', ingredients: [], steps: [], tags: [] }

describe('RecipeTextImport', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the "Tekst" label and a textarea', () => {
    render(<RecipeTextImport onExtracted={vi.fn()} />)
    expect(screen.getByText('Tekst')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('shows helper text about AI structuring', () => {
    render(<RecipeTextImport onExtracted={vi.fn()} />)
    expect(screen.getByText(/AI structureert/)).toBeInTheDocument()
  })

  it('disables the submit button when the textarea is empty', () => {
    render(<RecipeTextImport onExtracted={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Importeren' })).toBeDisabled()
  })

  it('enables the submit button once text is entered', async () => {
    render(<RecipeTextImport onExtracted={vi.fn()} />)
    await userEvent.type(screen.getByRole('textbox'), '200g bloem')
    expect(screen.getByRole('button', { name: 'Importeren' })).toBeEnabled()
  })

  it('shows "Omzetten…" while the conversion is in progress', async () => {
    vi.mocked(importRecipeFromText).mockReturnValue(new Promise(() => {}))
    render(<RecipeTextImport onExtracted={vi.fn()} />)
    await userEvent.type(screen.getByRole('textbox'), '200g bloem')
    await userEvent.click(screen.getByRole('button', { name: 'Importeren' }))
    expect(screen.getByText('Omzetten…')).toBeInTheDocument()
  })

  it('calls onExtracted with the recipe data on success', async () => {
    vi.mocked(importRecipeFromText).mockResolvedValue(mockRecipeData)
    const onExtracted = vi.fn()
    render(<RecipeTextImport onExtracted={onExtracted} />)
    await userEvent.type(screen.getByRole('textbox'), '200g bloem, 2 eieren')
    await userEvent.click(screen.getByRole('button', { name: 'Importeren' }))
    await waitFor(() => expect(onExtracted).toHaveBeenCalledWith(mockRecipeData))
  })

  it('shows the error message when the conversion fails', async () => {
    vi.mocked(importRecipeFromText).mockRejectedValue(new Error('Omzetten mislukt'))
    render(<RecipeTextImport onExtracted={vi.fn()} />)
    await userEvent.type(screen.getByRole('textbox'), '200g bloem')
    await userEvent.click(screen.getByRole('button', { name: 'Importeren' }))
    await waitFor(() => expect(screen.getByText('Omzetten mislukt')).toBeInTheDocument())
  })

  it('shows the fallback error message when a non-Error is thrown', async () => {
    vi.mocked(importRecipeFromText).mockRejectedValue('unknown')
    render(<RecipeTextImport onExtracted={vi.fn()} />)
    await userEvent.type(screen.getByRole('textbox'), '200g bloem')
    await userEvent.click(screen.getByRole('button', { name: 'Importeren' }))
    await waitFor(() =>
      expect(screen.getByText('Omzetten mislukt. Probeer opnieuw.')).toBeInTheDocument(),
    )
  })
})
