import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import PortionStepper from '../PortionStepper'


type Props = React.ComponentProps<typeof PortionStepper>

function setup(overrides: Partial<Props> = {}) {
  const defaults: Props = {
    value: 2,
    onChange: vi.fn(),
    label: 'pers',
    dir: null,
  }
  const props = { ...defaults, ...overrides }
  return { ...render(<PortionStepper {...props} />), onChange: props.onChange }
}

describe('PortionStepper', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows the current value', () => {
    setup({ value: 4 })
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('shows the label', () => {
    setup({ label: 'stuks' })
    expect(screen.getByText('stuks')).toBeInTheDocument()
  })

  it('calls onChange with value + 1 when the plus button is clicked', async () => {
    const onChange = vi.fn()
    const { container } = setup({ value: 3, onChange })
    const [, plusBtn] = container.querySelectorAll('button')
    await userEvent.click(plusBtn)
    expect(onChange).toHaveBeenCalledWith(4)
  })

  it('calls onChange with value - 1 when the minus button is clicked', async () => {
    const onChange = vi.fn()
    const { container } = setup({ value: 3, onChange })
    const [minusBtn] = container.querySelectorAll('button')
    await userEvent.click(minusBtn)
    expect(onChange).toHaveBeenCalledWith(2)
  })

  it('does not go below 1 when minus is clicked at the minimum', async () => {
    const onChange = vi.fn()
    const { container } = setup({ value: 1, onChange })
    const [minusBtn] = container.querySelectorAll('button')
    await userEvent.click(minusBtn)
    expect(onChange).toHaveBeenCalledWith(1)
  })
})
