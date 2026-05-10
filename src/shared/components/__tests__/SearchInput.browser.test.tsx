import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import SearchInput from '../SearchInput'

type Props = React.ComponentProps<typeof SearchInput>

function setup(overrides: Partial<Props> = {}) {
  const defaults: Props = {
    value: '',
    onChange: vi.fn(),
  }
  const props = { ...defaults, ...overrides }
  return { ...render(<SearchInput {...props} />), onChange: props.onChange }
}

describe('SearchInput', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('rendering', () => {
    it('renders input with default placeholder', () => {
      setup()
      expect(screen.getByPlaceholderText('Zoeken...')).toBeInTheDocument()
    })

    it('renders input with custom placeholder', () => {
      setup({ placeholder: 'Zoek recept...' })
      expect(screen.getByPlaceholderText('Zoek recept...')).toBeInTheDocument()
    })
  })

  describe('onChange', () => {
    it('typing calls onChange with the new value', async () => {
      const onChange = vi.fn()
      setup({ onChange })
      await userEvent.type(screen.getByPlaceholderText('Zoeken...'), 'p')
      expect(onChange).toHaveBeenCalledWith('p')
    })
  })

  describe('clear button', () => {
    it('does not show clear button when value is empty', () => {
      setup({ value: '' })
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('shows clear button when value is non-empty', () => {
      setup({ value: 'pasta' })
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('clicking clear button calls onChange with empty string', async () => {
      const onChange = vi.fn()
      setup({ value: 'pasta', onChange })
      await userEvent.click(screen.getByRole('button'))
      expect(onChange).toHaveBeenCalledWith('')
    })
  })
})
