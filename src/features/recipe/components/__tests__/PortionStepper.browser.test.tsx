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
    setup({ label: 'stuks', value: 2 })
    expect(screen.getByText('stuks')).toBeInTheDocument()
  })

  it('shows "stuk" (singular) when label is "stuks" and value is 1', () => {
    setup({ label: 'stuks', value: 1 })
    expect(screen.getByText('stuk')).toBeInTheDocument()
    expect(screen.queryByText('stuks')).not.toBeInTheDocument()
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

  it('minus button is disabled when value is 1', () => {
    const { container } = setup({ value: 1 })
    const [minusBtn] = container.querySelectorAll('button')
    expect(minusBtn).toBeDisabled()
  })

  it('minus button is enabled when value is above 1', () => {
    const { container } = setup({ value: 2 })
    const [minusBtn] = container.querySelectorAll('button')
    expect(minusBtn).not.toBeDisabled()
  })
})
