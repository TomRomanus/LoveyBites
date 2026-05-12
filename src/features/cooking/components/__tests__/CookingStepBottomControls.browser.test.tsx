import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import CookingStepBottomControls from '../CookingStepBottomControls'

type Props = React.ComponentProps<typeof CookingStepBottomControls>

function setup(overrides: Partial<Props> = {}) {
  const defaults: Props = {
    currentIndex: 0,
    total: 3,
    stepDir: null,
    onGoTo: vi.fn(),
    hasComment: false,
    onCommentOpen: vi.fn(),
  }
  const props = { ...defaults, ...overrides }
  return {
    ...render(<CookingStepBottomControls {...props} />),
    onGoTo: props.onGoTo,
    onCommentOpen: props.onCommentOpen,
  }
}

describe('CookingStepBottomControls', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('step counter', () => {
    it('shows "1" when at the first step', () => {
      setup({ currentIndex: 0, total: 3 })
      expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('shows the total in the step counter text', () => {
      const { container } = setup({ total: 3 })
      expect(container.textContent).toContain('VAN 3')
    })

    it('shows the current step number for a middle step', () => {
      setup({ currentIndex: 1, total: 3 })
      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('shows the last step number on the last step', () => {
      setup({ currentIndex: 2, total: 3 })
      expect(screen.getByText('3')).toBeInTheDocument()
    })
  })

  describe('progress dots', () => {
    it('renders one dot per step', () => {
      const { container } = setup({ total: 4 })
      const dots = container.querySelectorAll('.h-\\[5px\\]')
      expect(dots).toHaveLength(4)
    })
  })

  describe('previous button', () => {
    it('is disabled when at the first step', () => {
      const { container } = setup({ currentIndex: 0 })
      const [prevBtn] = container.querySelectorAll('button')
      expect(prevBtn).toBeDisabled()
    })

    it('is enabled when not at the first step', () => {
      const { container } = setup({ currentIndex: 1 })
      const [prevBtn] = container.querySelectorAll('button')
      expect(prevBtn).not.toBeDisabled()
    })

    it('calls onGoTo with currentIndex - 1 when clicked', async () => {
      const onGoTo = vi.fn()
      const { container } = setup({ currentIndex: 2, onGoTo })
      const [prevBtn] = container.querySelectorAll('button')
      await userEvent.click(prevBtn)
      expect(onGoTo).toHaveBeenCalledWith(1)
    })
  })

  describe('next button', () => {
    it('shows "Volgende stap" when not on the last step', () => {
      setup({ currentIndex: 0, total: 3 })
      expect(screen.getByText('Volgende stap')).toBeInTheDocument()
    })

    it('shows "Klaar" on the last step', () => {
      setup({ currentIndex: 2, total: 3 })
      expect(screen.getByText('Klaar')).toBeInTheDocument()
    })

    it('is disabled on the last step', () => {
      const { container } = setup({ currentIndex: 2, total: 3 })
      const buttons = container.querySelectorAll('button')
      expect(buttons[1]).toBeDisabled()
    })

    it('is enabled when not on the last step', () => {
      const { container } = setup({ currentIndex: 0, total: 3 })
      const buttons = container.querySelectorAll('button')
      expect(buttons[1]).not.toBeDisabled()
    })

    it('calls onGoTo with currentIndex + 1 when clicked', async () => {
      const onGoTo = vi.fn()
      const { container } = setup({ currentIndex: 0, total: 3, onGoTo })
      const buttons = container.querySelectorAll('button')
      await userEvent.click(buttons[1])
      expect(onGoTo).toHaveBeenCalledWith(1)
    })

    it('does not call onGoTo when clicked on the last step', async () => {
      const onGoTo = vi.fn()
      const { container } = setup({ currentIndex: 2, total: 3, onGoTo })
      const buttons = container.querySelectorAll('button')
      await userEvent.click(buttons[1])
      expect(onGoTo).not.toHaveBeenCalled()
    })
  })

  describe('comment button', () => {
    it('renders the comment button', () => {
      setup()
      expect(screen.getByRole('button', { name: /opmerking/i })).toBeInTheDocument()
    })

    it('calls onCommentOpen when the comment button is clicked', async () => {
      const onCommentOpen = vi.fn()
      setup({ onCommentOpen })
      await userEvent.click(screen.getByRole('button', { name: /opmerking/i }))
      expect(onCommentOpen).toHaveBeenCalledOnce()
    })

    it('sets data-has-comment to true when hasComment is true', () => {
      setup({ hasComment: true })
      expect(screen.getByRole('button', { name: /opmerking/i })).toHaveAttribute(
        'data-has-comment',
        'true',
      )
    })

    it('sets data-has-comment to false when hasComment is false', () => {
      setup({ hasComment: false })
      expect(screen.getByRole('button', { name: /opmerking/i })).toHaveAttribute(
        'data-has-comment',
        'false',
      )
    })
  })
})
