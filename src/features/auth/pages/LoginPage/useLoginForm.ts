import { useState } from 'react'
import { useAuth } from '@/features/auth/contexts/AuthContext'

type LoginMode = 'signin' | 'signup'

export interface UseLoginFormReturn {
  mode: LoginMode
  modeDir: 'forward' | 'back'
  email: string
  setEmail: (v: string) => void
  password: string
  setPassword: (v: string) => void
  error: string | null
  loading: boolean
  displayError: string | null
  handleSubmit: (e: React.FormEvent) => Promise<void>
  handleGoogle: () => Promise<void>
  handleModeChange: (m: LoginMode) => void
}

export function useLoginForm(): UseLoginFormReturn {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, authError } = useAuth()
  const [mode, setMode] = useState<LoginMode>('signin')
  const [modeDir, setModeDir] = useState<'forward' | 'back'>('forward')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleModeChange = (m: LoginMode) => {
    setModeDir(m === 'signup' ? 'forward' : 'back')
    setMode(m)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email || !password) {
      setError('Vul e-mail en wachtwoord in.')
      return
    }
    setLoading(true)
    try {
      if (mode === 'signup') {
        await signUpWithEmail(email, password)
      } else {
        await signInWithEmail(email, password)
      }
    } catch (err: unknown) {
      const code = (err as { code?: string }).code
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found'
      ) {
        setError('Ongeldig e-mailadres of wachtwoord.')
      } else if (code === 'auth/email-already-in-use') {
        setError('Dit e-mailadres is al in gebruik.')
      } else if (code === 'auth/weak-password') {
        setError('Wachtwoord moet minimaal 6 tekens zijn.')
      } else {
        setError('Inloggen mislukt. Probeer het opnieuw.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError(null)
    setLoading(true)
    try {
      await signInWithGoogle()
    } catch (err: unknown) {
      const code = (err as { code?: string }).code
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        setError('Inloggen mislukt. Probeer het opnieuw.')
      }
    } finally {
      setLoading(false)
    }
  }

  return {
    mode,
    modeDir,
    email,
    setEmail,
    password,
    setPassword,
    error,
    loading,
    displayError: authError ?? error,
    handleSubmit,
    handleGoogle,
    handleModeChange,
  }
}
