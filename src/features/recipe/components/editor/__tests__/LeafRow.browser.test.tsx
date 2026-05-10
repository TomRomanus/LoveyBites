import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import LeafRow from '../LeafRow'
import type { EditorLabels } from '../LeafRow'
import type { IngredientNode } from '@/features/recipe/types/recipe'

vi.mock('@/shared/components/Sheet', () => ({
  default: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
    visible ? <div>{children}</div> : null,
}))

const node: IngredientNode & { kind: 'leaf' } = { kind: 'leaf', id: 'n1', text: 'ingrediënt 1' }
const allNodes: IngredientNode[] = [node]
const labels: EditorLabels = {
  leafPlaceholder: 'bijv. 360ml',
  groupPlaceholder: 'Sectie',
  addLeafInGroup: 'in sectie',
  addLeaf: 'toevoegen',
  addGroup: 'sectie',
}

type Props = React.ComponentProps<typeof LeafRow>

function setup(overrides: Partial<Props> = {}) {
  const defaults: Props = {
    node,
    path: [0],
    isOnly: true,
    isLast: true,
    allNodes,
    labels,
    onChange: vi.fn(),
  }
  const props = { ...defaults, ...overrides }
  return { ...render(<LeafRow {...props} />), onChange: props.onChange }
}

describe('LeafRow', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders textarea with node.text as value', () => {
    setup()
    expect(screen.getByRole('textbox')).toHaveValue('ingrediënt 1')
  })

  it('textarea has placeholder from labels.leafPlaceholder', () => {
    setup()
    expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', 'bijv. 360ml')
  })

  it('does not render X button when isOnly is true', () => {
    setup({ isOnly: true })
    expect(screen.queryByRole('button', { name: 'Verwijderen' })).not.toBeInTheDocument()
  })

  it('renders X button when isOnly is false', () => {
    setup({ isOnly: false })
    expect(screen.getByRole('button', { name: 'Verwijderen' })).toBeInTheDocument()
  })

  it('calls onChange when typing in the textarea', async () => {
    const onChange = vi.fn()
    setup({ onChange })
    const textarea = screen.getByRole('textbox')
    await userEvent.clear(textarea)
    await userEvent.type(textarea, 'nieuw')
    expect(onChange).toHaveBeenCalled()
  })

  it('calls onChange when X button is clicked', async () => {
    const onChange = vi.fn()
    setup({ isOnly: false, onChange })
    await userEvent.click(screen.getByRole('button', { name: 'Verwijderen' }))
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('shows step number when ordered is true', () => {
    setup({ ordered: true, itemIndex: 0 })
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('does not show step number when ordered is false', () => {
    setup({ ordered: false })
    expect(screen.queryByText('1')).not.toBeInTheDocument()
  })
})
