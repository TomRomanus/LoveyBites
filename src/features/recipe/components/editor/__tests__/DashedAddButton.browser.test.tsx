import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import DashedAddButton from '../DashedAddButton'

type Props = React.ComponentProps<typeof DashedAddButton>

function setup(overrides: Partial<Props> = {}) {
  const defaults: Props = {
    onClick: vi.fn(),
    label: 'Toevoegen',
  }
  const props = { ...defaults, ...overrides }
  return { ...render(<DashedAddButton {...props} />), onClick: props.onClick }
}

describe('DashedAddButton', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the label text', () => {
    setup({ label: 'Nieuwe stap' })
    expect(screen.getByText('Nieuwe stap')).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    setup({ onClick })
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
