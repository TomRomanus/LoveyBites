import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import PortionsField from '../PortionsField'


type Props = React.ComponentProps<typeof PortionsField>

function setup(overrides: Partial<Props> = {}) {
  const defaults: Props = {
    value: 4,
    onChange: vi.fn(),
    label: undefined,
    onLabelChange: vi.fn(),
  }
  const props = { ...defaults, ...overrides }
  return {
    ...render(<PortionsField {...props} />),
    onChange: props.onChange,
    onLabelChange: props.onLabelChange,
  }
}

describe('PortionsField', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('display', () => {
    it('shows the current value', () => {
      setup({ value: 4 })
      expect(screen.getByText('4')).toBeInTheDocument()
    })

    it('shows "pers" as the default label', () => {
      setup()
      expect(screen.getAllByText('pers').length).toBeGreaterThan(0)
    })

    it('shows "stuks" when label is "stuks"', () => {
      setup({ label: 'stuks' })
      expect(screen.getAllByText('stuks').length).toBeGreaterThan(0)
    })

    it('shows "PORTIES" text', () => {
      setup()
      expect(screen.getByText('PORTIES')).toBeInTheDocument()
    })
  })

  describe('plus button', () => {
    it('calls onChange with value + 1', async () => {
      const onChange = vi.fn()
      const { container } = setup({ value: 4, onChange })
      const buttons = container.querySelectorAll('button')
      const plusBtn = buttons[buttons.length - 1]
      await userEvent.click(plusBtn)
      expect(onChange).toHaveBeenCalledWith(5)
    })
  })

  describe('minus button', () => {
    it('calls onChange with value - 1', async () => {
      const onChange = vi.fn()
      const { container } = setup({ value: 4, onChange })
      const buttons = container.querySelectorAll('button')
      const minusBtn = buttons[buttons.length - 2]
      await userEvent.click(minusBtn)
      expect(onChange).toHaveBeenCalledWith(3)
    })

    it('does not go below 1', async () => {
      const onChange = vi.fn()
      const { container } = setup({ value: 1, onChange })
      const buttons = container.querySelectorAll('button')
      const minusBtn = buttons[buttons.length - 2]
      await userEvent.click(minusBtn)
      expect(onChange).toHaveBeenCalledWith(1)
    })
  })

  describe('label toggle', () => {
    it('clicking the "pers" button calls onLabelChange with "pers"', async () => {
      const onLabelChange = vi.fn()
      setup({ onLabelChange })
      await userEvent.click(screen.getByRole('button', { name: /^pers$/i }))
      expect(onLabelChange).toHaveBeenCalledWith('pers')
    })

    it('clicking the "stuks" button calls onLabelChange with "stuks"', async () => {
      const onLabelChange = vi.fn()
      setup({ onLabelChange })
      await userEvent.click(screen.getByRole('button', { name: /^stuks$/i }))
      expect(onLabelChange).toHaveBeenCalledWith('stuks')
    })
  })
})
