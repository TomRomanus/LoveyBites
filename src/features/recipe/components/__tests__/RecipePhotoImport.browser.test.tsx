import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import RecipePhotoImport from '../RecipePhotoImport'
import { importRecipeFromImage } from '@/features/recipe/api/importRecipe'

vi.mock('@/features/recipe/api/importRecipe')

const mockRecipeData = {
  title: 'Test recept',
  description: '',
  ingredients: [],
  steps: [],
  tags: [],
}
const mockFile = new File(['(image)'], 'recept.jpg', { type: 'image/jpeg' })

describe('RecipePhotoImport', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the "Foto" label and upload button', () => {
    render(<RecipePhotoImport onExtracted={vi.fn()} />)
    expect(screen.getByText('Foto')).toBeInTheDocument()
    expect(screen.getByText('Foto kiezen of maken')).toBeInTheDocument()
  })

  it('shows helper text about cookbook photos', () => {
    render(<RecipePhotoImport onExtracted={vi.fn()} />)
    expect(screen.getByText(/receptenboek/)).toBeInTheDocument()
  })

  it('disables the submit button when no file is selected', () => {
    render(<RecipePhotoImport onExtracted={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Importeren' })).toBeDisabled()
  })

  it('shows a preview image and hides the upload button after selecting a file', async () => {
    const { container } = render(<RecipePhotoImport onExtracted={vi.fn()} />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(input, mockFile)
    expect(screen.getByAltText('Geselecteerde foto')).toBeInTheDocument()
    expect(screen.queryByText('Foto kiezen of maken')).not.toBeInTheDocument()
  })

  it('enables the submit button after selecting a file', async () => {
    const { container } = render(<RecipePhotoImport onExtracted={vi.fn()} />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(input, mockFile)
    expect(screen.getByRole('button', { name: 'Importeren' })).toBeEnabled()
  })

  it('clears the preview and restores the upload button when the clear button is clicked', async () => {
    const { container } = render(<RecipePhotoImport onExtracted={vi.fn()} />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(input, mockFile)
    const preview = screen.getByAltText('Geselecteerde foto')
    const clearButton = within(preview.parentElement!).getByRole('button')
    await userEvent.click(clearButton)
    expect(screen.queryByAltText('Geselecteerde foto')).not.toBeInTheDocument()
    expect(screen.getByText('Foto kiezen of maken')).toBeInTheDocument()
  })

  it('shows "Omzetten…" while the conversion is in progress', async () => {
    vi.mocked(importRecipeFromImage).mockReturnValue(new Promise(() => {}))
    const { container } = render(<RecipePhotoImport onExtracted={vi.fn()} />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(input, mockFile)
    await userEvent.click(screen.getByRole('button', { name: 'Importeren' }))
    expect(screen.getByText('Omzetten…')).toBeInTheDocument()
  })

  it('calls onExtracted with recipe data on success', async () => {
    vi.mocked(importRecipeFromImage).mockResolvedValue(mockRecipeData)
    const onExtracted = vi.fn()
    const { container } = render(<RecipePhotoImport onExtracted={onExtracted} />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(input, mockFile)
    await userEvent.click(screen.getByRole('button', { name: 'Importeren' }))
    await waitFor(() => expect(onExtracted).toHaveBeenCalledWith(mockRecipeData))
  })

  it('shows the error message when the conversion fails', async () => {
    vi.mocked(importRecipeFromImage).mockRejectedValue(new Error('Omzetten mislukt'))
    const { container } = render(<RecipePhotoImport onExtracted={vi.fn()} />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(input, mockFile)
    await userEvent.click(screen.getByRole('button', { name: 'Importeren' }))
    await waitFor(() => expect(screen.getByText('Omzetten mislukt')).toBeInTheDocument())
  })

  it('shows the fallback error message when a non-Error is thrown', async () => {
    vi.mocked(importRecipeFromImage).mockRejectedValue('unknown')
    const { container } = render(<RecipePhotoImport onExtracted={vi.fn()} />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(input, mockFile)
    await userEvent.click(screen.getByRole('button', { name: 'Importeren' }))
    await waitFor(() =>
      expect(screen.getByText('Omzetten mislukt. Probeer opnieuw.')).toBeInTheDocument(),
    )
  })
})
