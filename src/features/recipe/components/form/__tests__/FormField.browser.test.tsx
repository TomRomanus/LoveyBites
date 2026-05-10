import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import FormField from '../FormField'

type Props = React.ComponentProps<typeof FormField>

function setup(overrides: Partial<Props> = {}) {
  const defaults: Props = {
    label: 'Titel',
    children: <input />,
  }
  const props = { ...defaults, ...overrides }
  return render(<FormField {...props} />)
}

describe('FormField', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the label text', () => {
    setup({ label: 'Ingrediënten' })
    expect(screen.getByText('Ingrediënten')).toBeInTheDocument()
  })

  it('renders children', () => {
    setup({ children: <input data-testid="child-input" /> })
    expect(screen.getByTestId('child-input')).toBeInTheDocument()
  })

  it('shows "*" when required is true', () => {
    setup({ required: true })
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('does not show "*" when required is omitted', () => {
    setup()
    expect(screen.queryByText('*')).not.toBeInTheDocument()
  })

  it('does not show "*" when required is false', () => {
    setup({ required: false })
    expect(screen.queryByText('*')).not.toBeInTheDocument()
  })
})
