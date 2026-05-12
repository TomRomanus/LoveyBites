import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import FilterSheet from '../FilterSheet'

vi.mock('@/shared/components/Sheet', () => ({
  default: ({ visible, children }: any) => (visible ? <div>{children}</div> : null),
}))

vi.mock('@/shared/components/SearchInput', () => ({
  default: ({ value, onChange, placeholder }: any) => (
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
  ),
}))

const ALL_TAGS = ['italiaans', 'pasta', 'vegetarisch', 'soep']

type Props = React.ComponentProps<typeof FilterSheet>

function setup(overrides: Partial<Props> = {}) {
  const defaults: Props = {
    visible: true,
    activeTags: [],
    allTags: ALL_TAGS,
    onChange: vi.fn(),
    onClose: vi.fn(),
  }
  const props = { ...defaults, ...overrides }
  return { ...render(<FilterSheet {...props} />), onChange: props.onChange, onClose: props.onClose }
}

describe('FilterSheet', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders nothing when visible is false', () => {
    setup({ visible: false })
    expect(screen.queryByText('Filter op tag')).not.toBeInTheDocument()
  })

  it('shows "Filter op tag" heading when visible', () => {
    setup()
    expect(screen.getByText('Filter op tag')).toBeInTheDocument()
  })

  it('shows all tag buttons', () => {
    setup()
    for (const tag of ALL_TAGS) {
      expect(screen.getByRole('button', { name: new RegExp(tag) })).toBeInTheDocument()
    }
  })

  it('does not show "Alles wissen" when activeTags is empty', () => {
    setup({ activeTags: [] })
    expect(screen.queryByText('Alles wissen')).not.toBeInTheDocument()
  })

  it('shows "Alles wissen" when activeTags has items', () => {
    setup({ activeTags: ['pasta'] })
    expect(screen.getByText('Alles wissen')).toBeInTheDocument()
  })

  it('calls onChange with [] when "Alles wissen" is clicked', async () => {
    const onChange = vi.fn()
    setup({ activeTags: ['pasta'], onChange })
    await userEvent.click(screen.getByText('Alles wissen'))
    expect(onChange).toHaveBeenCalledWith([])
  })

  it('calls onChange with tag added when clicking an inactive tag', async () => {
    const onChange = vi.fn()
    setup({ activeTags: [], onChange })
    await userEvent.click(screen.getByRole('button', { name: /italiaans/ }))
    expect(onChange).toHaveBeenCalledWith(['italiaans'])
  })

  it('calls onChange with tag removed when clicking an active tag', async () => {
    const onChange = vi.fn()
    setup({ activeTags: ['italiaans', 'pasta'], onChange })
    await userEvent.click(screen.getByRole('button', { name: /italiaans/ }))
    expect(onChange).toHaveBeenCalledWith(['pasta'])
  })

  it('calls onClose when "Toepassen" is clicked', async () => {
    const onClose = vi.fn()
    setup({ onClose })
    await userEvent.click(screen.getByRole('button', { name: 'Toepassen' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('filters displayed tags when typing in the search input', async () => {
    setup()
    await userEvent.type(screen.getByPlaceholderText('Zoek tags'), 'pasta')
    expect(screen.getByRole('button', { name: /pasta/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /italiaans/ })).not.toBeInTheDocument()
  })

  it('shows no-match message when search has no results', async () => {
    setup()
    await userEvent.type(screen.getByPlaceholderText('Zoek tags'), 'xyzxyz')
    expect(screen.getByText(/Geen tags voor/)).toBeInTheDocument()
  })
})
