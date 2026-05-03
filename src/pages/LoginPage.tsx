import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const googleEnabled = import.meta.env.VITE_ENABLE_GOOGLE_LOGIN !== 'false'

export default function LoginPage() {
  const { user, signInWithGoogle, signInWithEmail, signUpWithEmail, authError } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)

  if (user) return <Navigate to="/" replace />

  function triggerShake() {
    setShake(false)
    requestAnimationFrame(() => setShake(true))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!email || !password) {
      setError('Vul e-mail en wachtwoord in.')
      triggerShake()
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
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setError('Ongeldig e-mailadres of wachtwoord.')
      } else if (code === 'auth/email-already-in-use') {
        setError('Dit e-mailadres is al in gebruik.')
      } else if (code === 'auth/weak-password') {
        setError('Wachtwoord moet minimaal 6 tekens zijn.')
      } else {
        setError('Inloggen mislukt. Probeer het opnieuw.')
      }
      triggerShake()
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setError(null)
    setLoading(true)
    try {
      await signInWithGoogle()
    } catch (err: unknown) {
      const code = (err as { code?: string }).code
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        setError('Inloggen mislukt. Probeer het opnieuw.')
        triggerShake()
      }
    } finally {
      setLoading(false)
    }
  }

  const displayError = authError ?? error

  return (
    <div className="lb-paper" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Masthead */}
      <div style={{ padding: '70px 28px 0', flexShrink: 0 }}>
        <div className="lb-eyebrow" style={{ marginBottom: 14 }}>SINDS 2026 · JOUW KEUKEN</div>
        <h1 style={{ margin: 0, fontSize: 58, lineHeight: 1.0, letterSpacing: '-0.025em' }}>
          <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 600, color: 'var(--ink)' }}>Lovey</span>
          <span style={{ fontFamily: 'var(--serif)', fontStyle: 'normal', fontWeight: 600, color: 'var(--ink)' }}>Bites</span>
        </h1>
        <div className="lb-divider-ornament" style={{ marginTop: 18 }}>
          <span>jouw eigen kookboek</span>
        </div>
      </div>

      {/* Color block */}
      <div style={{ padding: '0 28px' }}>
        <div className="lb-color-block" style={{
          '--block-bg': 'var(--bordeaux)',
          height: 130,
          borderRadius: 18,
        } as React.CSSProperties}>
          <div className="lb-color-block-corner">EDITIE I · MEI</div>
          <div className="lb-color-block-title" style={{ fontSize: 28 }}>Welkom thuis</div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ padding: '24px 28px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Mode toggle */}
        <div style={{ display: 'flex', background: 'var(--paper-2)', padding: 4, borderRadius: 14, marginBottom: 6 }}>
          {(['signin', 'signup'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError(null) }}
              style={{
                flex: 1,
                background: mode === m ? 'var(--cream-card)' : 'transparent',
                border: 0,
                height: 36,
                borderRadius: 10,
                fontFamily: 'var(--sans)',
                fontSize: 13,
                fontWeight: 600,
                color: mode === m ? 'var(--ink)' : 'var(--stone)',
                boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                cursor: 'pointer',
              }}
            >
              {m === 'signin' ? 'Inloggen' : 'Registreren'}
            </button>
          ))}
        </div>

        <input
          className="lb-input"
          type="email"
          placeholder="E-mailadres"
          value={email}
          onChange={e => setEmail(e.target.value)}
          disabled={loading}
          autoComplete="email"
        />
        <input
          className="lb-input"
          type="password"
          placeholder="Wachtwoord"
          value={password}
          onChange={e => setPassword(e.target.value)}
          disabled={loading}
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
        />

        {displayError && (
          <div
            className={shake ? 'lb-shake' : ''}
            style={{
              background: 'var(--bordeaux-tint)',
              color: 'var(--bordeaux)',
              padding: '10px 14px',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 500,
              borderLeft: '3px solid var(--bordeaux)',
            }}
          >
            {displayError}
          </div>
        )}

        <button type="submit" className="lb-btn lb-btn--primary" style={{ marginTop: 4 }} disabled={loading}>
          {loading
            ? <span className="lb-spinner" style={{ borderColor: 'var(--cream-card)', borderRightColor: 'transparent' }} />
            : mode === 'signin' ? 'Inloggen' : 'Account aanmaken'
          }
        </button>

        {googleEnabled && (
          <>
            <div className="lb-divider-ornament"><span>of</span></div>
            <button
              type="button"
              onClick={handleGoogle}
              className="lb-btn lb-btn--ghost"
              disabled={loading}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M21 12.2c0-.7-.1-1.3-.2-1.9H12v3.7h5.1c-.2 1.2-.9 2.2-1.9 2.9v2.4h3.1c1.8-1.7 2.7-4.1 2.7-7.1z" fill="#4285F4" />
                <path d="M12 21c2.6 0 4.7-.9 6.3-2.3l-3.1-2.4c-.9.6-2 1-3.2 1-2.5 0-4.5-1.6-5.3-3.9H3.6v2.4C5.2 18.9 8.3 21 12 21z" fill="#34A853" />
                <path d="M6.7 13.4c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7H3.6C2.9 8.5 2.5 10.2 2.5 12s.4 3.5 1.1 5l3.1-2.4-1-1.2z" fill="#FBBC05" />
                <path d="M12 5.5c1.4 0 2.7.5 3.7 1.4l2.7-2.7C16.7 2.7 14.6 1.8 12 1.8 8.3 1.8 5.2 4 3.6 7l3.1 2.4c.8-2.3 2.8-3.9 5.3-3.9z" fill="#EA4335" />
              </svg>
              Doorgaan met Google
            </button>
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: 18, marginBottom: 32, fontSize: 12, color: 'var(--stone)', fontFamily: 'var(--serif)', fontStyle: 'italic' }}>
          Door door te gaan beloof je jezelf goed te voeden.
        </div>
      </form>
    </div>
  )
}
