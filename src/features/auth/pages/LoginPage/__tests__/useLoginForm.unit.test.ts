import { renderHook, act } from '@testing-library/react'
import type { FormEvent } from 'react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { useLoginForm } from '../useLoginForm'
import { useAuth } from '@/features/auth/contexts/AuthContext'

vi.mock('@/features/auth/contexts/AuthContext')

const mockSignInWithEmail = vi.fn()
const mockSignUpWithEmail = vi.fn()
const mockSignInWithGoogle = vi.fn()
const mockEvent = { preventDefault: vi.fn() } as unknown as FormEvent

function setup(authOverrides: Partial<ReturnType<typeof useAuth>> = {}) {
  vi.mocked(useAuth).mockReturnValue({
    signInWithGoogle: mockSignInWithGoogle,
    signInWithEmail: mockSignInWithEmail,
    signUpWithEmail: mockSignUpWithEmail,
    authError: null,
    user: null,
    loading: false,
    signOutUser: vi.fn(),
    ...authOverrides,
  })
  return renderHook(() => useLoginForm())
}

describe('useLoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts in signin mode with empty fields and no error', () => {
    const { result } = setup()
    expect(result.current.mode).toBe('signin')
    expect(result.current.modeDir).toBe('forward')
    expect(result.current.email).toBe('')
    expect(result.current.password).toBe('')
    expect(result.current.displayError).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  describe('handleModeChange', () => {
    it('switches to signup with forward direction', () => {
      const { result } = setup()
      act(() => result.current.handleModeChange('signup'))
      expect(result.current.mode).toBe('signup')
      expect(result.current.modeDir).toBe('forward')
    })

    it('switches back to signin with back direction', () => {
      const { result } = setup()
      act(() => result.current.handleModeChange('signup'))
      act(() => result.current.handleModeChange('signin'))
      expect(result.current.mode).toBe('signin')
      expect(result.current.modeDir).toBe('back')
    })

    it('clears error when switching mode', async () => {
      mockSignInWithEmail.mockRejectedValue({ code: 'auth/invalid-credential' })
      const { result } = setup()
      act(() => {
        result.current.setEmail('a@b.com')
        result.current.setPassword('wrongpass')
      })
      await act(async () => {
        await result.current.handleSubmit(mockEvent)
      })
      expect(result.current.displayError).not.toBeNull()

      act(() => result.current.handleModeChange('signup'))
      expect(result.current.displayError).toBeNull()
    })
  })

  describe('handleSubmit', () => {
    it('sets validation error and skips API call when email is empty', async () => {
      const { result } = setup()
      act(() => result.current.setPassword('password123'))
      await act(async () => {
        await result.current.handleSubmit(mockEvent)
      })
      expect(result.current.displayError).toBe('Vul e-mail en wachtwoord in.')
      expect(mockSignInWithEmail).not.toHaveBeenCalled()
    })

    it('sets validation error and skips API call when password is empty', async () => {
      const { result } = setup()
      act(() => result.current.setEmail('a@b.com'))
      await act(async () => {
        await result.current.handleSubmit(mockEvent)
      })
      expect(result.current.displayError).toBe('Vul e-mail en wachtwoord in.')
      expect(mockSignInWithEmail).not.toHaveBeenCalled()
    })

    it('calls signInWithEmail with credentials in signin mode', async () => {
      mockSignInWithEmail.mockResolvedValue(undefined)
      const { result } = setup()
      act(() => {
        result.current.setEmail('user@test.com')
        result.current.setPassword('password123')
      })
      await act(async () => {
        await result.current.handleSubmit(mockEvent)
      })
      expect(mockSignInWithEmail).toHaveBeenCalledWith('user@test.com', 'password123')
      expect(mockSignUpWithEmail).not.toHaveBeenCalled()
    })

    it('calls signUpWithEmail with credentials in signup mode', async () => {
      mockSignUpWithEmail.mockResolvedValue(undefined)
      const { result } = setup()
      act(() => {
        result.current.handleModeChange('signup')
        result.current.setEmail('new@test.com')
        result.current.setPassword('password123')
      })
      await act(async () => {
        await result.current.handleSubmit(mockEvent)
      })
      expect(mockSignUpWithEmail).toHaveBeenCalledWith('new@test.com', 'password123')
      expect(mockSignInWithEmail).not.toHaveBeenCalled()
    })

    it.each([
      ['auth/invalid-credential', 'Ongeldig e-mailadres of wachtwoord.'],
      ['auth/wrong-password', 'Ongeldig e-mailadres of wachtwoord.'],
      ['auth/user-not-found', 'Ongeldig e-mailadres of wachtwoord.'],
      ['auth/email-already-in-use', 'Dit e-mailadres is al in gebruik.'],
      ['auth/weak-password', 'Wachtwoord moet minimaal 6 tekens zijn.'],
      ['auth/some-unknown-error', 'Inloggen mislukt. Probeer het opnieuw.'],
    ] as const)('maps %s to the correct Dutch error message', async (code, expected) => {
      mockSignInWithEmail.mockRejectedValue({ code })
      const { result } = setup()
      act(() => {
        result.current.setEmail('a@b.com')
        result.current.setPassword('password123')
      })
      await act(async () => {
        await result.current.handleSubmit(mockEvent)
      })
      expect(result.current.displayError).toBe(expected)
    })

    it('clears loading after a successful submit', async () => {
      mockSignInWithEmail.mockResolvedValue(undefined)
      const { result } = setup()
      act(() => {
        result.current.setEmail('user@test.com')
        result.current.setPassword('password123')
      })
      await act(async () => {
        await result.current.handleSubmit(mockEvent)
      })
      expect(result.current.loading).toBe(false)
    })

    it('clears loading after a failed submit', async () => {
      mockSignInWithEmail.mockRejectedValue({ code: 'auth/invalid-credential' })
      const { result } = setup()
      act(() => {
        result.current.setEmail('a@b.com')
        result.current.setPassword('password123')
      })
      await act(async () => {
        await result.current.handleSubmit(mockEvent)
      })
      expect(result.current.loading).toBe(false)
    })
  })

  describe('handleGoogle', () => {
    it('calls signInWithGoogle', async () => {
      mockSignInWithGoogle.mockResolvedValue(undefined)
      const { result } = setup()
      await act(async () => {
        await result.current.handleGoogle()
      })
      expect(mockSignInWithGoogle).toHaveBeenCalledOnce()
    })

    it('does not set an error when user closes the popup', async () => {
      mockSignInWithGoogle.mockRejectedValue({ code: 'auth/popup-closed-by-user' })
      const { result } = setup()
      await act(async () => {
        await result.current.handleGoogle()
      })
      expect(result.current.displayError).toBeNull()
    })

    it('does not set an error when popup request is cancelled', async () => {
      mockSignInWithGoogle.mockRejectedValue({ code: 'auth/cancelled-popup-request' })
      const { result } = setup()
      await act(async () => {
        await result.current.handleGoogle()
      })
      expect(result.current.displayError).toBeNull()
    })

    it('sets generic error for unexpected Google sign-in failure', async () => {
      mockSignInWithGoogle.mockRejectedValue({ code: 'auth/network-request-failed' })
      const { result } = setup()
      await act(async () => {
        await result.current.handleGoogle()
      })
      expect(result.current.displayError).toBe('Inloggen mislukt. Probeer het opnieuw.')
    })

    it('clears loading after Google sign-in attempt', async () => {
      mockSignInWithGoogle.mockRejectedValue({ code: 'auth/network-request-failed' })
      const { result } = setup()
      await act(async () => {
        await result.current.handleGoogle()
      })
      expect(result.current.loading).toBe(false)
    })
  })

  describe('displayError', () => {
    it('surfaces authError from context when no local error exists', () => {
      const { result } = setup({ authError: 'Dit account heeft geen toegang tot LoveyBites.' })
      expect(result.current.displayError).toBe('Dit account heeft geen toegang tot LoveyBites.')
    })

    it('prefers authError over a local submit error', async () => {
      mockSignInWithEmail.mockRejectedValue({ code: 'auth/invalid-credential' })
      const { result } = setup({ authError: 'Context toegangsfout' })
      act(() => {
        result.current.setEmail('a@b.com')
        result.current.setPassword('pass')
      })
      await act(async () => {
        await result.current.handleSubmit(mockEvent)
      })
      // authError ?? localError → authError wins because it is not null
      expect(result.current.displayError).toBe('Context toegangsfout')
    })
  })
})
