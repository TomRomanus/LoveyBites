import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import RecipeNodeEditor from '../RecipeNodeEditor'

const leaf = { kind: 'leaf' as const, id: 'l1', text: 'ingrediënt 1' }
const group = {
  kind: 'group' as const,
  id: 'g1',
  title: 'Marinade',
  children: [{ kind: 'leaf' as const, id: 'c1', text: '' }],
}

function setup(overrides = {}) {
  const onChange = vi.fn()
  const props = { nodes: [leaf], onChange, ...overrides }
  return { ...render(<RecipeNodeEditor {...props} />), onChange }
}

describe('RecipeNodeEditor', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders leaf node text in textarea', () => {
    setup()
    expect(screen.getByDisplayValue('ingrediënt 1')).toBeInTheDocument()
  })

  it('renders group node title in input', () => {
    setup({ nodes: [group] })
    expect(screen.getByDisplayValue('Marinade')).toBeInTheDocument()
  })

  it('shows "ingrediënt toevoegen" button', () => {
    setup()
    expect(screen.getByRole('button', { name: /ingrediënt toevoegen/i })).toBeInTheDocument()
  })

  it('shows "sectie toevoegen" button', () => {
    setup()
    expect(screen.getByRole('button', { name: /sectie toevoegen/i })).toBeInTheDocument()
  })

  it('clicking "ingrediënt toevoegen" calls onChange with one more leaf appended', async () => {
    const { onChange } = setup()
    await userEvent.click(screen.getByRole('button', { name: /ingrediënt toevoegen/i }))
    expect(onChange).toHaveBeenCalledOnce()
    const result = onChange.mock.calls[0][0]
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual(leaf)
    expect(result[1].kind).toBe('leaf')
  })

  it('clicking "sectie toevoegen" calls onChange with a group appended', async () => {
    const { onChange } = setup()
    await userEvent.click(screen.getByRole('button', { name: /sectie toevoegen/i }))
    expect(onChange).toHaveBeenCalledOnce()
    const result = onChange.mock.calls[0][0]
    expect(result.at(-1)?.kind).toBe('group')
  })

  it('shows section suggestions when commonSections are provided and no matching group exists', () => {
    setup({ nodes: [leaf], commonSections: ['Deeg', 'Vulling'] })
    expect(screen.getByRole('button', { name: /Deeg/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Vulling/i })).toBeInTheDocument()
  })

  it('does not show suggestion when a group with that title already exists', () => {
    setup({ nodes: [group], commonSections: ['Marinade', 'Deeg'] })
    expect(screen.queryByRole('button', { name: /\+ Marinade/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /\+ Deeg/i })).toBeInTheDocument()
  })

  it('clicking a section suggestion calls onChange with that group added', async () => {
    const { onChange } = setup({ nodes: [leaf], commonSections: ['Saus'] })
    await userEvent.click(screen.getByRole('button', { name: /\+ Saus/i }))
    expect(onChange).toHaveBeenCalledOnce()
    const result = onChange.mock.calls[0][0]
    const added = result.find((n: any) => n.kind === 'group')
    expect(added).toBeDefined()
    expect(added.title).toBe('Saus')
  })

  it('removes trailing empty leaf when a section suggestion is clicked', async () => {
    const emptyLeaf = { kind: 'leaf' as const, id: 'empty1', text: '' }
    const { onChange } = setup({ nodes: [emptyLeaf], commonSections: ['Saus'] })
    await userEvent.click(screen.getByRole('button', { name: /\+ Saus/i }))
    const result = onChange.mock.calls[0][0]
    expect(result.every((n: any) => n.id !== 'empty1')).toBe(true)
    expect(result.at(-1)?.kind).toBe('group')
  })
})
