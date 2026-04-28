import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const googleEnabled = import.meta.env.VITE_ENABLE_GOOGLE_LOGIN !== 'false'

function GoogleIcon() {
  return (
    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

export default function LoginPage() {
  const { user, signInWithGoogle, signInWithEmail, signUpWithEmail, authError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [signInError, setSignInError] = useState<string | null>(null)

  if (user) return <Navigate to="/" replace />

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setSignInError(null)
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password)
      } else {
        await signInWithEmail(email, password)
      }
    } catch (err: unknown) {
      const code = (err as { code?: string }).code
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setSignInError('Ongeldig e-mailadres of wachtwoord.')
      } else if (code === 'auth/email-already-in-use') {
        setSignInError('Dit e-mailadres is al in gebruik.')
      } else if (code === 'auth/weak-password') {
        setSignInError('Wachtwoord moet minimaal 6 tekens zijn.')
      } else {
        setSignInError('Inloggen mislukt. Probeer het opnieuw.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setIsLoading(true)
    setSignInError(null)
    try {
      await signInWithGoogle()
    } catch (err: unknown) {
      const code = (err as { code?: string }).code
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        setSignInError('Inloggen mislukt. Probeer het opnieuw.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-md border border-stone-200 px-6 py-8 sm:px-10 sm:py-10 w-full max-w-sm text-center">
        <p className="text-5xl mb-3">🍴</p>
        <h1 className="font-display text-4xl font-bold italic text-stone-900 tracking-tight mb-1">
          LoveyBites
        </h1>
        <p className="text-stone-400 text-sm mb-8">Ons eigen receptenboekje</p>

        <form onSubmit={handleEmailSubmit} className="text-left mb-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1.5">E-mailadres</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="w-full border border-stone-200 rounded-2xl px-4 py-3 text-sm text-stone-700 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-clay-500 focus:border-transparent disabled:opacity-50 transition"
              placeholder="jij@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1.5">Wachtwoord</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="w-full border border-stone-200 rounded-2xl px-4 py-3 text-sm text-stone-700 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-clay-500 focus:border-transparent disabled:opacity-50 transition"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-clay-500 hover:bg-clay-600 text-white font-semibold rounded-2xl px-4 py-3.5 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
          >
            {isLoading ? 'Bezig…' : isSignUp ? 'Account aanmaken' : 'Inloggen'}
          </button>
        </form>

        <button
          onClick={() => { setIsSignUp(v => !v); setSignInError(null) }}
          className="text-xs text-stone-400 hover:text-stone-600 transition-colors mb-2"
        >
          {isSignUp ? 'Al een account? Inloggen' : 'Nog geen account? Aanmaken'}
        </button>

        {googleEnabled && (
          <>
            <div className="flex items-center my-5">
              <div className="flex-1 border-t border-stone-200" />
              <span className="px-3 text-xs text-stone-400">of</span>
              <div className="flex-1 border-t border-stone-200" />
            </div>
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center bg-white border border-stone-200 rounded-2xl px-4 py-3.5 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <GoogleIcon />
              Inloggen met Google
            </button>
          </>
        )}

        {(authError || signInError) && (
          <div className="mt-5 bg-red-50 border border-red-200 rounded-2xl p-3 text-sm text-red-700">
            {authError ?? signInError}
          </div>
        )}
      </div>
    </div>
  )
}
