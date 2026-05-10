import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import RecipeSourceEditor from '../RecipeSourceEditor'
import { uploadSourceImage } from '@/features/recipe/api/imageStorage'

vi.mock('@/features/recipe/api/imageStorage', () => ({
  uploadSourceImage: vi.fn(),
}))

const sources = [
  { label: 'Allerhande', url: 'https://allerhande.nl/recept/1' },
  { label: 'Eigen recept', url: '' },
]

function setup(overrides = {}) {
  const onChange = vi.fn()
  const props = { sources, onChange, ...overrides }
  return { ...render(<RecipeSourceEditor {...props} />), onChange }
}

describe('RecipeSourceEditor', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders source cards with label and url inputs', () => {
    setup()
    expect(screen.getByDisplayValue('Allerhande')).toBeInTheDocument()
    expect(screen.getByDisplayValue('https://allerhande.nl/recept/1')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Eigen recept')).toBeInTheDocument()
  })

  it('label input change calls onChange with updated label', () => {
    const { onChange } = setup()
    const labelInputs = screen.getAllByPlaceholderText('Naam (optioneel)')
    fireEvent.change(labelInputs[0], { target: { value: 'Nieuw label' } })
    expect(onChange).toHaveBeenCalledWith([
      { label: 'Nieuw label', url: 'https://allerhande.nl/recept/1' },
      sources[1],
    ])
  })

  it('url input change calls onChange with updated url', () => {
    const { onChange } = setup()
    const urlInputs = screen.getAllByPlaceholderText('https://...')
    fireEvent.change(urlInputs[1], { target: { value: 'https://example.com' } })
    expect(onChange).toHaveBeenCalledWith([
      sources[0],
      { label: 'Eigen recept', url: 'https://example.com' },
    ])
  })

  it('X button removes that source from onChange call', async () => {
    const { onChange } = setup()
    const removeBtns = screen.getAllByRole('button', { name: 'Verwijder bron' })
    await userEvent.click(removeBtns[0])
    expect(onChange).toHaveBeenCalledWith([sources[1]])
  })

  it('"bron toevoegen" button calls onChange with empty source appended', async () => {
    const { onChange } = setup()
    await userEvent.click(screen.getByRole('button', { name: /bron toevoegen/i }))
    expect(onChange).toHaveBeenCalledWith([...sources, { label: '', url: '' }])
  })

  it('file upload calls uploadSourceImage and then onChange with the new source', async () => {
    vi.mocked(uploadSourceImage).mockResolvedValue('https://cdn.example.com/img.jpg')
    const { onChange } = setup()
    const file = new File(['img'], 'foto.jpg', { type: 'image/jpeg' })
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(fileInput, file)
    await waitFor(() => expect(onChange).toHaveBeenCalled())
    const lastCall = onChange.mock.calls.at(-1)![0]
    expect(lastCall.at(-1)).toEqual({ label: 'foto.jpg', url: 'https://cdn.example.com/img.jpg' })
  })

  it('shows "uploaden…" while uploading', async () => {
    let resolve: (url: string) => void
    vi.mocked(uploadSourceImage).mockReturnValue(new Promise((r) => { resolve = r }))
    setup()
    const file = new File(['img'], 'foto.jpg', { type: 'image/jpeg' })
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(fileInput, file)
    expect(await screen.findByRole('button', { name: /uploaden…/i })).toBeDisabled()
    resolve!('https://cdn.example.com/img.jpg')
  })
})
