import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import GroupRow from '../GroupRow'
import type { EditorLabels } from '../LeafRow'
import type { IngredientNode } from '@/features/recipe/types/recipe'

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: any) => <>{children}</>,
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
  verticalListSortingStrategy: 'vertical',
}))

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: any) => <>{children}</>,
  DragOverlay: () => null,
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
  PointerSensor: vi.fn(),
  TouchSensor: vi.fn(),
  closestCenter: vi.fn(),
  pointerWithin: vi.fn(() => []),
}))

vi.mock('@/shared/components/Sheet', () => ({
  default: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
    visible ? <div>{children}</div> : null,
}))

const child: IngredientNode & { kind: 'leaf' } = { kind: 'leaf', id: 'c1', text: 'stap 1' }
const node: IngredientNode & { kind: 'group' } = {
  kind: 'group',
  id: 'g1',
  title: 'Voorbereiding',
  children: [child],
}
const allNodes: IngredientNode[] = [node]
const labels: EditorLabels = {
  leafPlaceholder: 'bijv. 360ml',
  groupPlaceholder: 'Sectie',
  addLeafInGroup: 'in sectie',
  addLeaf: 'toevoegen',
  addGroup: 'sectie',
}

type Props = React.ComponentProps<typeof GroupRow>

function setup(overrides: Partial<Props> = {}) {
  const defaults: Props = {
    node,
    path: [0],
    isOnly: false,
    allNodes,
    labels,
    onChange: vi.fn(),
    onRequestFocus: vi.fn(),
  }
  const props = { ...defaults, ...overrides }
  return {
    ...render(<GroupRow {...props} />),
    onChange: props.onChange,
    onRequestFocus: props.onRequestFocus,
  }
}

describe('GroupRow', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the title input with node.title as value', () => {
    setup()
    expect(screen.getByDisplayValue('Voorbereiding')).toBeInTheDocument()
  })

  it('renders children leaf text', () => {
    setup()
    expect(screen.getByDisplayValue('stap 1')).toBeInTheDocument()
  })

  it('calls onChange with node.children when isOnly=true and children exist', async () => {
    const onChange = vi.fn()
    setup({ isOnly: true, onChange })
    await userEvent.click(screen.getByRole('button', { name: 'Sectie verwijderen' }))
    expect(onChange).toHaveBeenCalledWith(node.children)
  })

  it('calls onChange when isOnly=false (removes the group)', async () => {
    const onChange = vi.fn()
    setup({ isOnly: false, onChange })
    await userEvent.click(screen.getByRole('button', { name: 'Sectie verwijderen' }))
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('calls onRequestFocus and onChange when the add-leaf button is clicked', async () => {
    const onChange = vi.fn()
    const onRequestFocus = vi.fn()
    setup({ onChange, onRequestFocus })
    await userEvent.click(screen.getByRole('button', { name: /in sectie/ }))
    expect(onRequestFocus).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('calls onChange with updated title when title input is edited', async () => {
    const onChange = vi.fn()
    setup({ onChange })
    const titleInput = screen.getByDisplayValue('Voorbereiding')
    await userEvent.clear(titleInput)
    await userEvent.type(titleInput, 'Saus')
    expect(onChange).toHaveBeenCalled()
  })
})
