import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import RecipeFormPage from '../index'
import { getRecipes } from '@/features/recipe/api/recipes'

vi.mock('@/features/recipe/api/recipes')

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

function setup() {
  return render(
    <QueryClientProvider client={makeQueryClient()}>
      <MemoryRouter initialEntries={['/new']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/new" element={<RecipeFormPage />} />
          <Route path="/" element={<div>home</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('RecipeFormPage (/new)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getRecipes).mockResolvedValue([])
  })

  describe('mode chooser (initial state)', () => {
    it('shows "Nieuw recept" title', () => {
      setup()
      expect(screen.getByText('Nieuw recept')).toBeInTheDocument()
    })

    it('shows all four import options', () => {
      setup()
      expect(screen.getByText('Vanuit URL')).toBeInTheDocument()
      expect(screen.getByText('Vanuit tekst')).toBeInTheDocument()
      expect(screen.getByText('Vanuit foto')).toBeInTheDocument()
      expect(screen.getByText('Zelf invullen')).toBeInTheDocument()
    })
  })

  describe('URL import screen', () => {
    it('shows the URL input after selecting "Vanuit URL"', async () => {
      setup()
      fireEvent.click(screen.getByText('Vanuit URL'))
      await waitFor(() => expect(screen.getByPlaceholderText('https://…')).toBeInTheDocument())
    })

    it('shows a back button on the URL import screen', async () => {
      setup()
      fireEvent.click(screen.getByText('Vanuit URL'))
      await waitFor(() => expect(screen.getByPlaceholderText('https://…')).toBeInTheDocument())
      expect(screen.getByTestId('form-close-btn')).toBeInTheDocument()
    })

    it('returns to the chooser when the back button is clicked', async () => {
      setup()
      fireEvent.click(screen.getByText('Vanuit URL'))
      await waitFor(() => expect(screen.getByPlaceholderText('https://…')).toBeInTheDocument())
      fireEvent.click(screen.getByTestId('form-close-btn'))
      await waitFor(() => expect(screen.getByText('Zelf invullen')).toBeInTheDocument())
    })
  })

  describe('text import screen', () => {
    it('shows the textarea after selecting "Vanuit tekst"', async () => {
      setup()
      fireEvent.click(screen.getByText('Vanuit tekst'))
      await waitFor(() => expect(screen.getByRole('textbox')).toBeInTheDocument())
    })

    it('shows a back button on the text import screen', async () => {
      setup()
      fireEvent.click(screen.getByText('Vanuit tekst'))
      await waitFor(() => expect(screen.getByRole('textbox')).toBeInTheDocument())
      expect(screen.getByTestId('form-close-btn')).toBeInTheDocument()
    })

    it('returns to the chooser when the back button is clicked', async () => {
      setup()
      fireEvent.click(screen.getByText('Vanuit tekst'))
      await waitFor(() => expect(screen.getByRole('textbox')).toBeInTheDocument())
      fireEvent.click(screen.getByTestId('form-close-btn'))
      await waitFor(() => expect(screen.getByText('Zelf invullen')).toBeInTheDocument())
    })
  })

  describe('photo import screen', () => {
    it('shows the photo upload button after selecting "Vanuit foto"', async () => {
      setup()
      fireEvent.click(screen.getByText('Vanuit foto'))
      await waitFor(() => expect(screen.getByText('Foto kiezen of maken')).toBeInTheDocument())
    })

    it('shows a back button on the photo import screen', async () => {
      setup()
      fireEvent.click(screen.getByText('Vanuit foto'))
      await waitFor(() => expect(screen.getByText('Foto kiezen of maken')).toBeInTheDocument())
      expect(screen.getByTestId('form-close-btn')).toBeInTheDocument()
    })

    it('returns to the chooser when the back button is clicked', async () => {
      setup()
      fireEvent.click(screen.getByText('Vanuit foto'))
      await waitFor(() => expect(screen.getByText('Foto kiezen of maken')).toBeInTheDocument())
      fireEvent.click(screen.getByTestId('form-close-btn'))
      await waitFor(() => expect(screen.getByText('Zelf invullen')).toBeInTheDocument())
    })
  })
})
