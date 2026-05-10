import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import ReorderFab from '../ReorderFab'

type Props = React.ComponentProps<typeof ReorderFab>

function setup(overrides: Partial<Props> = {}) {
  const defaults: Props = {
    active: false,
    onToggle: vi.fn(),
  }
  const props = { ...defaults, ...overrides }
  return { ...render(<ReorderFab {...props} />), onToggle: props.onToggle }
}

describe('ReorderFab', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('aria-label', () => {
    it('has aria-label "Volgorde aanpassen" when inactive', () => {
      setup({ active: false })
      expect(screen.getByRole('button', { name: 'Volgorde aanpassen' })).toBeInTheDocument()
    })

    it('has aria-label "Klaar met sorteren" when active', () => {
      setup({ active: true })
      expect(screen.getByRole('button', { name: 'Klaar met sorteren' })).toBeInTheDocument()
    })
  })

  describe('interaction', () => {
    it('clicking the button calls onToggle', async () => {
      const onToggle = vi.fn()
      setup({ onToggle })
      await userEvent.click(screen.getByRole('button', { name: 'Volgorde aanpassen' }))
      expect(onToggle).toHaveBeenCalledTimes(1)
    })
  })

  describe('portal rendering', () => {
    it('renders into document.body and is queryable via screen', () => {
      setup()
      expect(screen.getByRole('button', { name: 'Volgorde aanpassen' })).toBeInTheDocument()
    })
  })
})
