import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import IngredientPickerSheet from '../IngredientPickerSheet'

vi.mock('@/shared/components/Sheet', () => ({
  default: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
    visible ? <div>{children}</div> : null,
}))

const OPTIONS = [
  { id: 'o1', text: '200 g bloem' },
  { id: 'o2', text: '3 eieren' },
  { id: 'o3', text: '1 tsp zout' },
]

type Props = React.ComponentProps<typeof IngredientPickerSheet>

function setup(overrides: Partial<Props> = {}) {
  const defaults: Props = {
    visible: true,
    selectedIds: new Set<string>(),
    options: OPTIONS,
    amounts: {},
    onToggle: vi.fn(),
    onAmountChange: vi.fn(),
    onClose: vi.fn(),
  }
  const props = { ...defaults, ...overrides }
  return {
    ...render(<IngredientPickerSheet {...props} />),
    onToggle: props.onToggle,
    onAmountChange: props.onAmountChange,
    onClose: props.onClose,
  }
}

describe('IngredientPickerSheet', () => {
  beforeEach(() => vi.clearAllMocks())

  // ---------------------------------------------------------------------------
  // Visibility
  // ---------------------------------------------------------------------------

  it('renders nothing when visible is false', () => {
    const { container } = setup({ visible: false })
    expect(container.firstChild).toBeNull()
  })

  it('shows the Ingrediënten tab when visible', () => {
    setup()
    expect(screen.getByRole('button', { name: 'Ingrediënten' })).toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // Ingredients tab — chip list
  // ---------------------------------------------------------------------------

  it('shows all option labels as buttons', () => {
    setup()
    expect(screen.getByRole('button', { name: /200 g bloem/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /3 eieren/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /1 tsp zout/ })).toBeInTheDocument()
  })

  it('shows "Voeg eerst ingrediënten toe" when options list is empty', () => {
    setup({ options: [] })
    expect(screen.getByText('Voeg eerst ingrediënten toe')).toBeInTheDocument()
  })

  it('marks a selected option with data-active="true"', () => {
    setup({ selectedIds: new Set(['o2']) })
    expect(screen.getByRole('button', { name: /3 eieren/ })).toHaveAttribute('data-active', 'true')
  })

  it('marks an unselected option with data-active="false"', () => {
    setup({ selectedIds: new Set(['o2']) })
    expect(screen.getByRole('button', { name: /200 g bloem/ })).toHaveAttribute(
      'data-active',
      'false',
    )
  })

  it('calls onToggle with the option id when an option chip is clicked', async () => {
    const onToggle = vi.fn()
    setup({ onToggle })
    await userEvent.click(screen.getByRole('button', { name: /200 g bloem/ }))
    expect(onToggle).toHaveBeenCalledWith('o1')
  })

  it('does not call onToggle when a disabled option is clicked', async () => {
    const onToggle = vi.fn()
    setup({ disabledIds: new Set(['o1']), onToggle })
    await userEvent.click(screen.getByRole('button', { name: /200 g bloem/ }))
    expect(onToggle).not.toHaveBeenCalled()
  })

  // ---------------------------------------------------------------------------
  // Alles wissen
  // ---------------------------------------------------------------------------

  it('shows "Alles wissen" when some options are selected', () => {
    setup({ selectedIds: new Set(['o1']) })
    expect(screen.getByRole('button', { name: 'Alles wissen' })).toBeInTheDocument()
  })

  it('hides "Alles wissen" when no options are selected', () => {
    setup({ selectedIds: new Set() })
    expect(screen.queryByRole('button', { name: 'Alles wissen' })).not.toBeInTheDocument()
  })

  it('calls onToggle for every selected id when "Alles wissen" is clicked', async () => {
    const onToggle = vi.fn()
    setup({ selectedIds: new Set(['o1', 'o2']), onToggle })
    await userEvent.click(screen.getByRole('button', { name: 'Alles wissen' }))
    expect(onToggle).toHaveBeenCalledWith('o1')
    expect(onToggle).toHaveBeenCalledWith('o2')
    expect(onToggle).toHaveBeenCalledTimes(2)
  })

  // ---------------------------------------------------------------------------
  // Tab switching
  // ---------------------------------------------------------------------------

  it('switches to the amounts tab when "Hoeveelheden" is clicked', async () => {
    setup({ selectedIds: new Set(['o1']), amounts: { o1: '100' } })
    await userEvent.click(screen.getByRole('button', { name: 'Hoeveelheden' }))
    expect(screen.getByDisplayValue('100')).toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // Amounts tab — content
  // ---------------------------------------------------------------------------

  it('shows "Selecteer eerst ingrediënten" on the amounts tab when nothing is selected', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: 'Hoeveelheden' }))
    expect(screen.getByText('Selecteer eerst ingrediënten')).toBeInTheDocument()
  })

  it('shows one row per selected ingredient on the amounts tab', async () => {
    setup({
      selectedIds: new Set(['o1', 'o2']),
      amounts: { o1: '100', o2: '2' },
    })
    await userEvent.click(screen.getByRole('button', { name: 'Hoeveelheden' }))
    // names parsed from ingredient text
    expect(screen.getByText('bloem')).toBeInTheDocument()
    expect(screen.getByText('eieren')).toBeInTheDocument()
  })

  it('pre-fills amount inputs with the current amounts', async () => {
    setup({
      selectedIds: new Set(['o1']),
      amounts: { o1: '150' },
    })
    await userEvent.click(screen.getByRole('button', { name: 'Hoeveelheden' }))
    expect(screen.getByDisplayValue('150')).toBeInTheDocument()
  })

  it('uses remainingAmounts as the placeholder when amounts entry is absent', async () => {
    setup({
      selectedIds: new Set(['o1']),
      amounts: {},
      remainingAmounts: { o1: '80' },
    })
    await userEvent.click(screen.getByRole('button', { name: 'Hoeveelheden' }))
    expect(screen.getByPlaceholderText('80')).toBeInTheDocument()
  })

  it('calls onAmountChange with the ingredient id when the user types in an amount input', async () => {
    const onAmountChange = vi.fn()
    setup({
      selectedIds: new Set(['o1']),
      amounts: { o1: '100' },
      onAmountChange,
    })
    await userEvent.click(screen.getByRole('button', { name: 'Hoeveelheden' }))
    // Type one character at end of controlled value '100' — controlled input keeps value='100'
    // so the resulting change fires with '1005'
    await userEvent.type(screen.getByDisplayValue('100'), '5')
    expect(onAmountChange).toHaveBeenCalledWith('o1', '1005')
  })

  // ---------------------------------------------------------------------------
  // Amounts tab — validation
  // ---------------------------------------------------------------------------

  it('shows an error when the entered amount is not a valid number', async () => {
    setup({
      selectedIds: new Set(['o1']),
      amounts: { o1: 'abc' },
    })
    await userEvent.click(screen.getByRole('button', { name: 'Hoeveelheden' }))
    expect(screen.getByText('Vul een getal in')).toBeInTheDocument()
  })

  it('shows an error when the entered amount exceeds the available remaining amount', async () => {
    setup({
      selectedIds: new Set(['o1']),
      amounts: { o1: '300' },
      remainingAmounts: { o1: '200' },
    })
    await userEvent.click(screen.getByRole('button', { name: 'Hoeveelheden' }))
    expect(screen.getByText('Max 200 beschikbaar')).toBeInTheDocument()
  })

  it('shows no error when the entered amount is within range', async () => {
    setup({
      selectedIds: new Set(['o1']),
      amounts: { o1: '100' },
      remainingAmounts: { o1: '200' },
    })
    await userEvent.click(screen.getByRole('button', { name: 'Hoeveelheden' }))
    expect(screen.queryByText(/Vul een getal in/)).not.toBeInTheDocument()
    expect(screen.queryByText(/beschikbaar/)).not.toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // Klaar button
  // ---------------------------------------------------------------------------

  it('calls onClose when "Klaar" is clicked with no validation errors', async () => {
    const onClose = vi.fn()
    setup({ onClose })
    await userEvent.click(screen.getByRole('button', { name: 'Klaar' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose and switches to amounts tab when "Klaar" is clicked with an invalid amount', async () => {
    const onClose = vi.fn()
    setup({
      selectedIds: new Set(['o1']),
      amounts: { o1: 'abc' },
      onClose,
    })
    await userEvent.click(screen.getByRole('button', { name: 'Klaar' }))
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByText('Vul een getal in')).toBeInTheDocument()
  })

  it('does not call onClose and switches to amounts tab when "Klaar" is clicked with an over-limit amount', async () => {
    const onClose = vi.fn()
    setup({
      selectedIds: new Set(['o1']),
      amounts: { o1: '500' },
      remainingAmounts: { o1: '200' },
      onClose,
    })
    await userEvent.click(screen.getByRole('button', { name: 'Klaar' }))
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByText('Max 200 beschikbaar')).toBeInTheDocument()
  })
})
