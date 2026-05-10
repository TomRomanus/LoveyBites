import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import CustomMealTabContent from '../CustomMealTabContent'

function setup(props: Partial<React.ComponentProps<typeof CustomMealTabContent>> = {}) {
  const defaults = {
    custom: '',
    onCustomChange: vi.fn(),
    saving: false,
    onSave: vi.fn(),
  }
  const merged = { ...defaults, ...props }
  return { ...render(<CustomMealTabContent {...merged} />), merged }
}

describe('CustomMealTabContent', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the input with correct placeholder', () => {
    setup()
    expect(screen.getByPlaceholderText('bv. Afhalen, Restjes, Uit eten')).toBeInTheDocument()
  })

  it('renders "Aan planning toevoegen" button when not saving', () => {
    setup({ custom: 'Pizza' })
    expect(screen.getByRole('button', { name: 'Aan planning toevoegen' })).toBeInTheDocument()
  })

  it('button is disabled when custom is empty', () => {
    setup({ custom: '' })
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('button is enabled when custom has text', () => {
    setup({ custom: 'Pizza' })
    expect(screen.getByRole('button')).not.toBeDisabled()
  })

  it('button is disabled when saving=true', () => {
    setup({ custom: 'Pizza', saving: true })
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('button shows "Opslaan…" when saving=true', () => {
    setup({ custom: 'Pizza', saving: true })
    expect(screen.getByRole('button', { name: 'Opslaan…' })).toBeInTheDocument()
  })

  it('clicking button calls onSave', async () => {
    const onSave = vi.fn()
    setup({ custom: 'Pizza', onSave })
    await userEvent.click(screen.getByRole('button'))
    expect(onSave).toHaveBeenCalledOnce()
  })

  it('onChange called when typing', async () => {
    const onCustomChange = vi.fn()
    setup({ custom: '', onCustomChange })
    const input = screen.getByPlaceholderText('bv. Afhalen, Restjes, Uit eten')
    await userEvent.type(input, 'P')
    expect(onCustomChange).toHaveBeenCalledWith('P')
  })
})
