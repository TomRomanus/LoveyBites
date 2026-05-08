import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'

const googleEnabled = import.meta.env.VITE_ENABLE_GOOGLE_LOGIN !== 'false'

const NL_DAYS = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag']
const NL_MONTHS = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december']

const todayFull = () => {
  const d = new Date()
  return `${NL_DAYS[d.getDay()]} ${d.getDate()} ${NL_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

const LoginPage = () => {
  const { user, signInWithGoogle, signInWithEmail, signUpWithEmail, authError } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [modeDir, setModeDir] = useState<'forward' | 'back'>('forward')

  if (user) return <Navigate to="/" replace />

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
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
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

  const displayError = authError ?? error

  return (
    <div className="lb-paper" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Masthead */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.2, 0, 0.2, 1] }}
        style={{ padding: '70px 28px 0', flexShrink: 0 }}
      >
        <div className="lb-eyebrow" style={{ marginBottom: 14 }}>SINDS 2026</div>
        <h1 style={{ margin: 0, fontSize: 58, lineHeight: 1.0, letterSpacing: '-0.025em' }}>
          <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 600, color: 'var(--bordeaux)' }}>Lovey</span>
          <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 600, color: 'var(--ink)' }}>Bites</span>
        </h1>
      </motion.div>

      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.2, 0, 0.2, 1], delay: 0.12 }}
        style={{ padding: '0 28px', marginTop: 20 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ flex: 1, height: '0.5px', background: 'var(--line)' }} />
          <div style={{ textAlign: 'center' }}>
            <div className="lb-eyebrow" style={{ marginBottom: 3 }}>{todayFull()}</div>
            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 500, fontSize: 28, color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1.05 }}>Smakelijk</div>
          </div>
          <div style={{ flex: 1, height: '0.5px', background: 'var(--line)' }} />
        </div>
      </motion.div>

      {/* Form */}
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.2, 0, 0.2, 1], delay: 0.22 }}
        style={{ padding: '24px 28px 0', display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        {/* Mode toggle */}
        <LayoutGroup>
          <div style={{ display: 'flex', background: 'var(--paper-2)', padding: 4, borderRadius: 24, marginBottom: 6 }}>
            {(['signin', 'signup'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setModeDir(m === 'signup' ? 'forward' : 'back'); setMode(m); setError(null) }}
                style={{
                  flex: 1, position: 'relative',
                  background: 'transparent',
                  border: 0, height: 36, borderRadius: 18,
                  fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600,
                  color: mode === m ? 'var(--ink)' : 'var(--stone)',
                  cursor: 'pointer',
                }}
              >
                {mode === m && (
                  <motion.div
                    layoutId="login-pill"
                    style={{
                      position: 'absolute', inset: 0, borderRadius: 18,
                      background: 'var(--cream-card)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span style={{ position: 'relative', zIndex: 1 }}>
                  {m === 'signin' ? 'Inloggen' : 'Registreren'}
                </span>
              </button>
            ))}
          </div>
        </LayoutGroup>

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

        <AnimatePresence>
          {displayError && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              style={{
                background: 'var(--bordeaux-tint)',
                color: 'var(--bordeaux)',
                padding: '10px 14px',
                borderRadius: '0 12px 12px 0',
                fontSize: 13,
                fontWeight: 500,
                borderLeft: '3px solid var(--bordeaux)',
              }}
            >
              {displayError}
            </motion.div>
          )}
        </AnimatePresence>

        <button type="submit" className="lb-btn lb-btn--primary" style={{ marginTop: 4, overflow: 'hidden' }} disabled={loading}>
          <AnimatePresence mode="wait" custom={modeDir}>
            {loading ? (
              <motion.span key="spinner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
                <span className="lb-spinner" style={{ borderColor: 'var(--cream-card)', borderRightColor: 'transparent' }} />
              </motion.span>
            ) : (
              <motion.span
                key={mode}
                custom={modeDir}
                variants={{
                  enter: (d: 'forward' | 'back') => ({ opacity: 0, x: d === 'forward' ? 16 : -16 }),
                  center: { opacity: 1, x: 0 },
                  exit: (d: 'forward' | 'back') => ({ opacity: 0, x: d === 'forward' ? -16 : 16 }),
                }}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.15 }}
              >
                {mode === 'signin' ? 'Inloggen' : 'Account aanmaken'}
              </motion.span>
            )}
          </AnimatePresence>
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
          Als het mislukt, is er altijd nog de frituur.
        </div>
      </motion.form>
    </div>
  )
}

export default LoginPage
