import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { GripHandle, DragHandleCtx } from '../GripHandle'

describe('GripHandle', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing when no context is provided', () => {
    const { container } = render(<GripHandle />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('spreads listeners from DragHandleCtx onto the div', async () => {
    const onPointerDown = vi.fn()
    const listeners = { onPointerDown }
    const { container } = render(
      <DragHandleCtx.Provider value={{ listeners }}>
        <GripHandle />
      </DragHandleCtx.Provider>,
    )
    const div = container.firstChild as HTMLElement
    await userEvent.pointer({ target: div, keys: '[MouseLeft>]' })
    expect(onPointerDown).toHaveBeenCalled()
  })

  it('applies optional className to the handle div', () => {
    const { container } = render(<GripHandle className="my-custom-class" />)
    const div = container.firstChild as HTMLElement
    expect(div.className).toContain('my-custom-class')
  })
})
