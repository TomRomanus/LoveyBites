import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import IngredientPickerSheet from '../IngredientPickerSheet'

vi.mock('@/shared/components/Sheet', () => ({
  default: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
    visible ? <div>{children}</div> : null,
}))

const OPTIONS = [
  { id: 'o1', text: 'Tomaat' },
  { id: 'o2', text: 'Ui' },
  { id: 'o3', text: 'Knoflook' },
]

type Props = React.ComponentProps<typeof IngredientPickerSheet>

function setup(overrides: Partial<Props> = {}) {
  const defaults: Props = {
    visible: true,
    selectedIds: new Set<string>(),
    options: OPTIONS,
    onToggle: vi.fn(),
    onClose: vi.fn(),
  }
  const props = { ...defaults, ...overrides }
  return { ...render(<IngredientPickerSheet {...props} />), onToggle: props.onToggle, onClose: props.onClose }
}

describe('IngredientPickerSheet', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders nothing when visible is false', () => {
    const { container } = setup({ visible: false })
    expect(container.firstChild).toBeNull()
  })

  it('shows "Ingrediënten" heading when visible', () => {
    setup()
    expect(screen.getByText('Ingrediënten')).toBeInTheDocument()
  })

  it('shows all option labels as buttons', () => {
    setup()
    expect(screen.getByRole('button', { name: /Tomaat/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ui/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Knoflook/ })).toBeInTheDocument()
  })

  it('shows "Voeg eerst ingrediënten toe" when options is empty', () => {
    setup({ options: [] })
    expect(screen.getByText('Voeg eerst ingrediënten toe')).toBeInTheDocument()
  })

  it('calls onToggle with the option id when an option is clicked', async () => {
    const onToggle = vi.fn()
    setup({ onToggle })
    await userEvent.click(screen.getByRole('button', { name: /Tomaat/ }))
    expect(onToggle).toHaveBeenCalledWith('o1')
  })

  it('shows a check icon for selected options', () => {
    setup({ selectedIds: new Set(['o2']) })
    const uiButton = screen.getByRole('button', { name: /Ui/ })
    expect(uiButton.querySelector('svg')).toBeInTheDocument()
  })

  it('shows "Alles wissen" button when selectedIds is non-empty', () => {
    setup({ selectedIds: new Set(['o1']) })
    expect(screen.getByRole('button', { name: 'Alles wissen' })).toBeInTheDocument()
  })

  it('does not show "Alles wissen" button when selectedIds is empty', () => {
    setup({ selectedIds: new Set() })
    expect(screen.queryByRole('button', { name: 'Alles wissen' })).not.toBeInTheDocument()
  })

  it('calls onToggle for each selected id when "Alles wissen" is clicked', async () => {
    const onToggle = vi.fn()
    setup({ selectedIds: new Set(['o1', 'o2']), onToggle })
    await userEvent.click(screen.getByRole('button', { name: 'Alles wissen' }))
    expect(onToggle).toHaveBeenCalledWith('o1')
    expect(onToggle).toHaveBeenCalledWith('o2')
    expect(onToggle).toHaveBeenCalledTimes(2)
  })

  it('calls onClose when "Klaar" button is clicked', async () => {
    const onClose = vi.fn()
    setup({ onClose })
    await userEvent.click(screen.getByRole('button', { name: 'Klaar' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
