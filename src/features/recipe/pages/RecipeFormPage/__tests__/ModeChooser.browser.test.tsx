import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import ModeChooser from '../ModeChooser'

function setup(props: Partial<React.ComponentProps<typeof ModeChooser>> = {}) {
  const defaults = { onSelect: vi.fn(), onClose: vi.fn() }
  const merged = { ...defaults, ...props }
  return { ...render(<ModeChooser {...merged} />), merged }
}

describe('ModeChooser', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders "Nieuw recept" title', () => {
    setup()
    expect(screen.getByText('Nieuw recept')).toBeInTheDocument()
  })

  it('shows all four mode labels', () => {
    setup()
    expect(screen.getByText('Vanuit URL')).toBeInTheDocument()
    expect(screen.getByText('Vanuit tekst')).toBeInTheDocument()
    expect(screen.getByText('Vanuit foto')).toBeInTheDocument()
    expect(screen.getByText('Zelf invullen')).toBeInTheDocument()
  })

  it('shows a description under each mode', () => {
    setup()
    expect(screen.getByText('Plak een receptlink of TikTok-video')).toBeInTheDocument()
    expect(screen.getByText('Plak ruwe tekst van waar dan ook')).toBeInTheDocument()
    expect(screen.getByText('Upload een foto uit een kookboek')).toBeInTheDocument()
    expect(screen.getByText('Tik het zelf in')).toBeInTheDocument()
  })

  it('calls onSelect("url") when "Vanuit URL" is clicked', async () => {
    const onSelect = vi.fn()
    setup({ onSelect })
    await userEvent.click(screen.getByText('Vanuit URL'))
    expect(onSelect).toHaveBeenCalledWith('url')
  })

  it('calls onSelect("text") when "Vanuit tekst" is clicked', async () => {
    const onSelect = vi.fn()
    setup({ onSelect })
    await userEvent.click(screen.getByText('Vanuit tekst'))
    expect(onSelect).toHaveBeenCalledWith('text')
  })

  it('calls onSelect("photo") when "Vanuit foto" is clicked', async () => {
    const onSelect = vi.fn()
    setup({ onSelect })
    await userEvent.click(screen.getByText('Vanuit foto'))
    expect(onSelect).toHaveBeenCalledWith('photo')
  })

  it('calls onSelect("manual") when "Zelf invullen" is clicked', async () => {
    const onSelect = vi.fn()
    setup({ onSelect })
    await userEvent.click(screen.getByText('Zelf invullen'))
    expect(onSelect).toHaveBeenCalledWith('manual')
  })

  it('calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn()
    setup({ onClose })
    await userEvent.click(screen.getByTestId('form-close-btn'))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
