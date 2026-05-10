import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import SortSheet from '../SortSheet'
import type { SortOption } from '@/features/recipe/hooks/useRecipeFilter'

vi.mock('@/shared/components/Sheet', () => ({
  default: ({ visible, children }: any) => visible ? <div>{children}</div> : null,
}))

type Props = React.ComponentProps<typeof SortSheet>

function setup(overrides: Partial<Props> = {}) {
  const defaults: Props = {
    visible: true,
    sort: 'default' as SortOption,
    onChange: vi.fn(),
    onClose: vi.fn(),
  }
  const props = { ...defaults, ...overrides }
  return { ...render(<SortSheet {...props} />), onChange: props.onChange, onClose: props.onClose }
}

describe('SortSheet', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders nothing when visible is false', () => {
    setup({ visible: false })
    expect(screen.queryByText('Sorteren')).not.toBeInTheDocument()
  })

  it('shows "Sorteren" heading when visible', () => {
    setup()
    expect(screen.getByText('Sorteren')).toBeInTheDocument()
  })

  it('shows all five sort option labels', () => {
    setup()
    expect(screen.getByText('Nieuwste eerst')).toBeInTheDocument()
    expect(screen.getByText('Naam A → Z')).toBeInTheDocument()
    expect(screen.getByText('Naam Z → A')).toBeInTheDocument()
    expect(screen.getByText('Hoogste beoordeling')).toBeInTheDocument()
    expect(screen.getByText('Laagste beoordeling')).toBeInTheDocument()
  })

  it('calls onChange with the selected sort option when an option is clicked', async () => {
    const onChange = vi.fn()
    setup({ onChange })
    await userEvent.click(screen.getByText('Naam A → Z'))
    expect(onChange).toHaveBeenCalledWith('name-asc')
  })

  it('calls onClose when a sort option is clicked', async () => {
    const onClose = vi.fn()
    setup({ onClose })
    await userEvent.click(screen.getByText('Naam A → Z'))
    expect(onClose).toHaveBeenCalled()
  })

  it('applies font-semibold class to the currently active sort option', () => {
    setup({ sort: 'rating-desc' })
    const btn = screen.getByText('Hoogste beoordeling').closest('button')!
    expect(btn.className).toContain('font-semibold')
  })

  it('does not apply font-semibold to inactive sort options', () => {
    setup({ sort: 'default' })
    const btn = screen.getByText('Naam A → Z').closest('button')!
    expect(btn.className).toContain('font-normal')
  })
})
