import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import RecipeNotesEditor from '../RecipeNotesEditor'

function setup(overrides: Partial<React.ComponentProps<typeof RecipeNotesEditor>> = {}) {
  const onChange = vi.fn()
  const props = { notes: [], onChange, ...overrides }
  return { ...render(<RecipeNotesEditor {...props} />), onChange }
}

describe('RecipeNotesEditor', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('empty state', () => {
    it('renders the add button', () => {
      setup()
      expect(screen.getByRole('button', { name: /notitie toevoegen/i })).toBeInTheDocument()
    })

    it('renders the suggestions label', () => {
      setup()
      expect(screen.getByText('Suggesties')).toBeInTheDocument()
    })

    it('renders the Bewaren suggestion chip', () => {
      setup()
      expect(screen.getByRole('button', { name: /bewaren/i })).toBeInTheDocument()
    })

    it('renders the Opwarmen suggestion chip', () => {
      setup()
      expect(screen.getByRole('button', { name: /opwarmen/i })).toBeInTheDocument()
    })
  })

  describe('adding notes', () => {
    it('add button calls onChange with an empty note appended', async () => {
      const { onChange } = setup()
      await userEvent.click(screen.getByRole('button', { name: /notitie toevoegen/i }))
      expect(onChange).toHaveBeenCalledWith([{ label: '', text: '' }])
    })

    it('clicking Bewaren chip calls onChange with pre-filled label', async () => {
      const { onChange } = setup()
      await userEvent.click(screen.getByRole('button', { name: /bewaren/i }))
      expect(onChange).toHaveBeenCalledWith([{ label: 'Bewaren', text: '' }])
    })

    it('clicking Opwarmen chip calls onChange with pre-filled label', async () => {
      const { onChange } = setup()
      await userEvent.click(screen.getByRole('button', { name: /opwarmen/i }))
      expect(onChange).toHaveBeenCalledWith([{ label: 'Opwarmen', text: '' }])
    })
  })

  describe('existing notes', () => {
    const notes = [
      { label: 'Bewaren', text: 'Tot 3 dagen in de koelkast.' },
      { label: 'Mijn notitie', text: '' },
    ]

    it('renders label inputs for each note', () => {
      setup({ notes })
      expect(screen.getByDisplayValue('Bewaren')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Mijn notitie')).toBeInTheDocument()
    })

    it('renders text inputs for each note', () => {
      setup({ notes })
      expect(screen.getByDisplayValue('Tot 3 dagen in de koelkast.')).toBeInTheDocument()
    })

    it('label change calls onChange with updated label', () => {
      const { onChange } = setup({ notes })
      fireEvent.change(screen.getAllByPlaceholderText('Onderwerp')[0], {
        target: { value: 'Invriezen' },
      })
      expect(onChange).toHaveBeenCalledWith([
        { label: 'Invriezen', text: 'Tot 3 dagen in de koelkast.' },
        notes[1],
      ])
    })

    it('text change calls onChange with updated text', () => {
      const { onChange } = setup({ notes })
      fireEvent.change(screen.getAllByPlaceholderText('Notitie')[0], {
        target: { value: 'Een week in de vriezer.' },
      })
      expect(onChange).toHaveBeenCalledWith([
        { label: 'Bewaren', text: 'Een week in de vriezer.' },
        notes[1],
      ])
    })

    it('X button removes that note', async () => {
      const { onChange } = setup({ notes })
      const removeBtns = screen.getAllByRole('button', { name: /verwijder notitie/i })
      await userEvent.click(removeBtns[0])
      expect(onChange).toHaveBeenCalledWith([notes[1]])
    })
  })

  describe('suggestion chip visibility', () => {
    it('hides Bewaren chip when a note with that label already exists', () => {
      setup({ notes: [{ label: 'Bewaren', text: '' }] })
      expect(screen.queryByRole('button', { name: /^bewaren$/i })).not.toBeInTheDocument()
    })

    it('hides Opwarmen chip when a note with that label already exists', () => {
      setup({ notes: [{ label: 'Opwarmen', text: '' }] })
      expect(screen.queryByRole('button', { name: /^opwarmen$/i })).not.toBeInTheDocument()
    })

    it('hides the suggestions section entirely when all suggestions are used', () => {
      setup({
        notes: [
          { label: 'Bewaren', text: '' },
          { label: 'Opwarmen', text: '' },
        ],
      })
      expect(screen.queryByText('Suggesties')).not.toBeInTheDocument()
    })
  })
})
