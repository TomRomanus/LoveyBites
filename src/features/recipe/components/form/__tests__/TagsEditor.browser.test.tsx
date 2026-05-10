import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import TagsEditor from '../TagsEditor'

vi.mock('framer-motion', () => import('@/test/mocks/framer-motion'))

type Props = React.ComponentProps<typeof TagsEditor>

function setup(overrides: Partial<Props> = {}) {
  const defaults: Props = {
    tags: [],
    onChange: vi.fn(),
    existingTags: [],
  }
  const props = { ...defaults, ...overrides }
  return { ...render(<TagsEditor {...props} />), onChange: props.onChange }
}

describe('TagsEditor', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('rendering chips', () => {
    it('renders existing tags as chips', () => {
      setup({ tags: ['pasta', 'soep'] })
      expect(screen.getByText('pasta')).toBeInTheDocument()
      expect(screen.getByText('soep')).toBeInTheDocument()
    })

    it('renders a remove button for each tag', () => {
      setup({ tags: ['pasta', 'soep'] })
      expect(screen.getAllByRole('button')).toHaveLength(2)
    })
  })

  describe('removing tags', () => {
    it('clicking the remove button calls onChange without that tag', async () => {
      const onChange = vi.fn()
      setup({ tags: ['pasta', 'soep'], onChange })
      const buttons = screen.getAllByRole('button')
      await userEvent.click(buttons[0])
      expect(onChange).toHaveBeenCalledWith(['soep'])
    })
  })

  describe('adding tags via input', () => {
    it('pressing Enter adds a new tag (trimmed and lowercased)', async () => {
      const onChange = vi.fn()
      setup({ tags: [], onChange })
      const input = screen.getByPlaceholderText('+ TAG')
      await userEvent.type(input, '  Pasta  {Enter}')
      expect(onChange).toHaveBeenCalledWith(['pasta'])
    })

    it('blurring the input adds the tag', async () => {
      const onChange = vi.fn()
      setup({ tags: [], onChange })
      const input = screen.getByPlaceholderText('+ TAG')
      await userEvent.type(input, 'soep')
      await userEvent.tab()
      expect(onChange).toHaveBeenCalledWith(['soep'])
    })

    it('does not add empty or whitespace-only tags', async () => {
      const onChange = vi.fn()
      setup({ tags: [], onChange })
      const input = screen.getByPlaceholderText('+ TAG')
      await userEvent.type(input, '   {Enter}')
      expect(onChange).not.toHaveBeenCalled()
    })

    it('does not add duplicate tags', async () => {
      const onChange = vi.fn()
      setup({ tags: ['pasta'], onChange })
      const input = screen.getByPlaceholderText('+ TAG')
      await userEvent.type(input, 'pasta{Enter}')
      expect(onChange).not.toHaveBeenCalled()
    })
  })

  describe('suggestions', () => {
    it('shows suggestions when input matches existingTags', async () => {
      setup({ tags: [], existingTags: ['pasta', 'pizza', 'soep'] })
      const input = screen.getByPlaceholderText('+ TAG')
      await userEvent.click(input)
      await userEvent.type(input, 'pa')
      expect(screen.getByText('pasta')).toBeInTheDocument()
      expect(screen.getByText('pizza')).toBeInTheDocument()
    })

    it('clicking a suggestion adds it', async () => {
      const onChange = vi.fn()
      setup({ tags: [], onChange, existingTags: ['pasta', 'soep'] })
      const input = screen.getByPlaceholderText('+ TAG')
      await userEvent.click(input)
      await userEvent.type(input, 'pa')
      const suggestion = screen.getByText('pasta')
      fireEvent.mouseDown(suggestion)
      expect(onChange).toHaveBeenCalledWith(['pasta'])
    })

    it('already-added tags do not appear in suggestions', async () => {
      setup({ tags: ['pasta'], existingTags: ['pasta', 'soep'] })
      const input = screen.getByPlaceholderText('+ TAG')
      await userEvent.click(input)
      await userEvent.type(input, 'pa')
      const allPasta = screen.getAllByText('pasta')
      expect(allPasta).toHaveLength(1)
    })
  })
})
