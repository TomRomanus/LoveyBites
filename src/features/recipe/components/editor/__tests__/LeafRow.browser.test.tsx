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

describe('LeafRow — comment field (steps)', () => {
  const stepNode: IngredientNode & { kind: 'leaf' } = {
    kind: 'leaf', id: 'step-c', text: 'Bak de ui glazig',
  }

  function setupStep(overrides: Partial<Props> = {}) {
    const defaults: Props = {
      node: stepNode,
      path: [0],
      isOnly: true,
      isLast: true,
      allNodes: [stepNode],
      labels,
      onChange: vi.fn(),
      ordered: true,
      itemIndex: 0,
    }
    const props = { ...defaults, ...overrides }
    return { ...render(<LeafRow {...props} />), onChange: props.onChange }
  }

  it('renders a comment textarea for ordered (step) rows', () => {
    setupStep()
    expect(screen.getAllByRole('textbox')).toHaveLength(2)
  })

  it('does not render a comment textarea for non-ordered (ingredient) rows', () => {
    setup()
    expect(screen.getAllByRole('textbox')).toHaveLength(1)
  })

  it('populates comment textarea with node.comment', () => {
    const nodeWithComment: IngredientNode & { kind: 'leaf' } = {
      ...stepNode, comment: 'Let op de textuur',
    }
    setupStep({ node: nodeWithComment, allNodes: [nodeWithComment] })
    const textboxes = screen.getAllByRole('textbox')
    expect(textboxes[1]).toHaveValue('Let op de textuur')
  })

  it('calls onChange with updated comment when typing in the comment textarea', async () => {
    const onChange = vi.fn()
    setupStep({ onChange })
    const commentBox = screen.getAllByRole('textbox')[1]
    await userEvent.type(commentBox, 'n')
    const updatedNodes: IngredientNode[] = onChange.mock.calls.at(-1)[0]
    const leaf = updatedNodes[0]
    if (leaf.kind !== 'leaf') throw new Error('Expected leaf')
    expect(leaf.comment).toBe('n')
  })

  it('removes comment from node when comment textarea is cleared', async () => {
    const nodeWithComment: IngredientNode & { kind: 'leaf' } = {
      ...stepNode, comment: 'oud',
    }
    const onChange = vi.fn()
    setupStep({ node: nodeWithComment, allNodes: [nodeWithComment], onChange })
    const commentBox = screen.getAllByRole('textbox')[1]
    await userEvent.clear(commentBox)
    const updatedNodes: IngredientNode[] = onChange.mock.calls.at(-1)[0]
    const leaf = updatedNodes[0]
    if (leaf.kind !== 'leaf') throw new Error('Expected leaf')
    expect(leaf.comment).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// LeafRow — ordered (steps) mode with ingredient refs
// ---------------------------------------------------------------------------

describe('LeafRow — ingredient refs panel', () => {
  const stepNode: IngredientNode & { kind: 'leaf' } = {
    kind: 'leaf',
    id: 'step1',
    text: 'Bak de ui glazig',
  }

  const ingredientOptions = [
    { id: 'ing1', text: '200 g bloem' },
    { id: 'ing2', text: '3 eieren' },
  ]

  function setupStep(overrides: Partial<Props> = {}) {
    const defaults: Props = {
      node: stepNode,
      path: [0],
      isOnly: true,
      isLast: true,
      allNodes: [stepNode],
      labels,
      onChange: vi.fn(),
      ordered: true,
      ingredientOptions,
    }
    const props = { ...defaults, ...overrides }
    return { ...render(<LeafRow {...props} />), onChange: props.onChange }
  }

  it('shows the "+ ingrediënten" prompt when no refs are selected', () => {
    setupStep()
    expect(screen.getByText('+ ingrediënten')).toBeInTheDocument()
  })

  it('opens the ingredient picker sheet when the refs prompt is clicked', async () => {
    setupStep()
    await userEvent.click(screen.getByText('+ ingrediënten'))
    expect(screen.getByText('200 g bloem')).toBeInTheDocument()
  })

  it('shows formatted ingredient refs as a summary when refs are already selected', () => {
    const nodeWithRefs: IngredientNode & { kind: 'leaf' } = {
      ...stepNode,
      ingredientRefs: ['ing1'],
      ingredientAmounts: { ing1: '100' },
    }
    setupStep({ node: nodeWithRefs, allNodes: [nodeWithRefs] })
    expect(screen.getByText(/100 g bloem/)).toBeInTheDocument()
  })

  it('opens the picker when the refs summary button is clicked', async () => {
    const nodeWithRefs: IngredientNode & { kind: 'leaf' } = {
      ...stepNode,
      ingredientRefs: ['ing1'],
      ingredientAmounts: { ing1: '100' },
    }
    setupStep({ node: nodeWithRefs, allNodes: [nodeWithRefs] })
    await userEvent.click(screen.getByText(/100 g bloem/))
    expect(screen.getByRole('button', { name: 'Ingrediënten' })).toBeInTheDocument()
  })

  it('calls onChange with updated ingredientRefs when an ingredient is toggled on', async () => {
    const onChange = vi.fn()
    setupStep({ onChange })
    await userEvent.click(screen.getByText('+ ingrediënten'))
    await userEvent.click(screen.getByRole('button', { name: /200 g bloem/ }))
    expect(onChange).toHaveBeenCalled()
    const updatedNodes: IngredientNode[] = onChange.mock.calls.at(-1)[0]
    const leaf = updatedNodes[0]
    if (leaf.kind !== 'leaf') throw new Error('Expected leaf')
    expect(leaf.ingredientRefs).toContain('ing1')
  })
})

// ---------------------------------------------------------------------------
// LeafRow — cross-step remaining amount coordination
// ---------------------------------------------------------------------------

describe('LeafRow — cross-step remaining amounts', () => {
  const singleIngredient = [{ id: 'ing1', text: '200 g bloem' }]

  function setupCrossStep(
    currentNode: IngredientNode & { kind: 'leaf' },
    otherNode: IngredientNode & { kind: 'leaf' },
  ) {
    const props: Props = {
      node: currentNode,
      path: [1],
      isOnly: false,
      isLast: true,
      allNodes: [otherNode, currentNode],
      labels,
      onChange: vi.fn(),
      ordered: true,
      ingredientOptions: singleIngredient,
    }
    return render(<LeafRow {...props} />)
  }

  it('disables a chip whose ingredient is fully consumed by another step', async () => {
    const otherStep: IngredientNode & { kind: 'leaf' } = {
      kind: 'leaf',
      id: 'step1',
      text: 'Voeg alle bloem toe',
      ingredientRefs: ['ing1'],
      ingredientAmounts: { ing1: '200' },
    }
    const currentStep: IngredientNode & { kind: 'leaf' } = {
      kind: 'leaf',
      id: 'step2',
      text: 'Meng de rest',
    }
    setupCrossStep(currentStep, otherStep)
    await userEvent.click(screen.getByText('+ ingrediënten'))
    // fullyAssignedIds includes ing1 — chip is disabled
    const chip = screen.getByRole('button', { name: /200 g bloem/ })
    expect(chip).toHaveClass('cursor-not-allowed')
  })

  it('shows the reduced remaining amount as the default value in the amounts tab', async () => {
    const otherStep: IngredientNode & { kind: 'leaf' } = {
      kind: 'leaf',
      id: 'step1',
      text: 'Voeg helft bloem toe',
      ingredientRefs: ['ing1'],
      ingredientAmounts: { ing1: '100' }, // uses 100 of 200g
    }
    // current step already has ing1 selected (so it appears on the amounts tab)
    const currentStep: IngredientNode & { kind: 'leaf' } = {
      kind: 'leaf',
      id: 'step2',
      text: 'Meng de rest',
      ingredientRefs: ['ing1'],
    }
    setupCrossStep(currentStep, otherStep)
    // Open via the refs summary button
    await userEvent.click(screen.getByText(/200 g bloem/))
    await userEvent.click(screen.getByRole('button', { name: 'Hoeveelheden' }))
    // remainingDefault = 200 - 100 = 100 → passed as remainingAmounts to the sheet
    // input value = amounts['ing1'] ?? maxAvailable = undefined ?? '100' = '100'
    expect(screen.getByDisplayValue('100')).toBeInTheDocument()
  })
})
