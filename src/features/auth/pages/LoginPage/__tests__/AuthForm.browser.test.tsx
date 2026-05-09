import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import AuthForm from '../AuthForm'
import type { UseLoginFormReturn } from '../useLoginForm'

function makeProps(overrides: Partial<UseLoginFormReturn> = {}): UseLoginFormReturn {
  return {
    mode: 'signin',
    modeDir: 'forward',
    email: '',
    setEmail: vi.fn(),
    password: '',
    setPassword: vi.fn(),
    loading: false,
    error: null,
    displayError: null,
    handleSubmit: vi.fn(async (e: React.FormEvent) => e.preventDefault()),
    handleGoogle: vi.fn(),
    handleModeChange: vi.fn(),
    ...overrides,
  }
}

describe('AuthForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('inputs', () => {
    it('renders an email input', () => {
      render(<AuthForm {...makeProps()} />)
      expect(screen.getByPlaceholderText('E-mailadres')).toHaveAttribute('type', 'email')
    })

    it('renders a password input', () => {
      render(<AuthForm {...makeProps()} />)
      expect(screen.getByPlaceholderText('Wachtwoord')).toHaveAttribute('type', 'password')
    })

    it('disables inputs while loading', () => {
      render(<AuthForm {...makeProps({ loading: true })} />)
      expect(screen.getByPlaceholderText('E-mailadres')).toBeDisabled()
      expect(screen.getByPlaceholderText('Wachtwoord')).toBeDisabled()
    })

    it('enables inputs when not loading', () => {
      render(<AuthForm {...makeProps({ loading: false })} />)
      expect(screen.getByPlaceholderText('E-mailadres')).not.toBeDisabled()
      expect(screen.getByPlaceholderText('Wachtwoord')).not.toBeDisabled()
    })

    it('calls setEmail when email input changes', async () => {
      const props = makeProps()
      render(<AuthForm {...props} />)
      await userEvent.type(screen.getByPlaceholderText('E-mailadres'), 'a')
      expect(props.setEmail).toHaveBeenCalled()
    })

    it('calls setPassword when password input changes', async () => {
      const props = makeProps()
      render(<AuthForm {...props} />)
      await userEvent.type(screen.getByPlaceholderText('Wachtwoord'), 'x')
      expect(props.setPassword).toHaveBeenCalled()
    })

    it('uses current-password autocomplete in signin mode', () => {
      render(<AuthForm {...makeProps({ mode: 'signin' })} />)
      expect(screen.getByPlaceholderText('Wachtwoord')).toHaveAttribute(
        'autocomplete',
        'current-password',
      )
    })

    it('uses new-password autocomplete in signup mode', () => {
      render(<AuthForm {...makeProps({ mode: 'signup' })} />)
      expect(screen.getByPlaceholderText('Wachtwoord')).toHaveAttribute(
        'autocomplete',
        'new-password',
      )
    })
  })

  describe('submit button', () => {
    it('shows "Inloggen" label in signin mode', () => {
      const { container } = render(<AuthForm {...makeProps({ mode: 'signin' })} />)
      expect(container.querySelector('button[type="submit"]')).toHaveTextContent('Inloggen')
    })

    it('shows "Account aanmaken" label in signup mode', () => {
      const { container } = render(<AuthForm {...makeProps({ mode: 'signup' })} />)
      expect(container.querySelector('button[type="submit"]')).toHaveTextContent('Account aanmaken')
    })

    it('is disabled while loading', () => {
      const { container } = render(<AuthForm {...makeProps({ loading: true })} />)
      expect(container.querySelector('button[type="submit"]')).toBeDisabled()
    })

    it('is enabled when not loading', () => {
      const { container } = render(<AuthForm {...makeProps({ loading: false })} />)
      expect(container.querySelector('button[type="submit"]')).not.toBeDisabled()
    })
  })

  describe('error message', () => {
    it('renders the error when displayError is set', () => {
      render(<AuthForm {...makeProps({ displayError: 'Ongeldig e-mailadres of wachtwoord.' })} />)
      expect(screen.getByText('Ongeldig e-mailadres of wachtwoord.')).toBeInTheDocument()
    })

    it('renders no error message when displayError is null', () => {
      render(<AuthForm {...makeProps({ displayError: null })} />)
      expect(screen.queryByText('Ongeldig e-mailadres of wachtwoord.')).not.toBeInTheDocument()
    })
  })

  describe('mode tab bar', () => {
    it('calls handleModeChange with "signup" when Registreren tab is clicked', async () => {
      const props = makeProps()
      render(<AuthForm {...props} />)
      await userEvent.click(screen.getByRole('button', { name: 'Registreren' }))
      expect(props.handleModeChange).toHaveBeenCalledWith('signup')
    })

    it('does not submit the form when a tab is clicked', async () => {
      const props = makeProps()
      render(<AuthForm {...props} />)
      await userEvent.click(screen.getByRole('button', { name: 'Registreren' }))
      expect(props.handleSubmit).not.toHaveBeenCalled()
    })
  })

  describe('form submission', () => {
    it('calls handleSubmit when the form is submitted', () => {
      const props = makeProps()
      const { container } = render(<AuthForm {...props} />)
      fireEvent.submit(container.querySelector('form')!)
      expect(props.handleSubmit).toHaveBeenCalledOnce()
    })
  })

  describe('Google sign-in', () => {
    it('renders the Google button by default', () => {
      render(<AuthForm {...makeProps()} />)
      expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument()
    })

    it('calls handleGoogle when Google button is clicked', async () => {
      const props = makeProps()
      render(<AuthForm {...props} />)
      await userEvent.click(screen.getByRole('button', { name: /google/i }))
      expect(props.handleGoogle).toHaveBeenCalledOnce()
    })

    it('disables Google button while loading', () => {
      render(<AuthForm {...makeProps({ loading: true })} />)
      expect(screen.getByRole('button', { name: /google/i })).toBeDisabled()
    })
  })
})
