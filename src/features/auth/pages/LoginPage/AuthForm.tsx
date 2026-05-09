import { motion, AnimatePresence } from 'framer-motion'
import { EASE_STANDARD } from '@/shared/constants/animations'
import AnimatedTabBar from '@/shared/components/AnimatedTabBar'
import type { UseLoginFormReturn } from './useLoginForm'

const googleEnabled = import.meta.env.VITE_ENABLE_GOOGLE_LOGIN !== 'false'

type Props = UseLoginFormReturn

const AuthForm = ({
  mode,
  modeDir,
  email,
  setEmail,
  password,
  setPassword,
  loading,
  displayError,
  handleSubmit,
  handleGoogle,
  handleModeChange,
}: Props) => (
  <motion.form
    onSubmit={handleSubmit}
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: EASE_STANDARD, delay: 0.22 }}
    className="pt-6 px-7 flex flex-col gap-3"
  >
    <AnimatedTabBar
      layoutId="login-mode"
      tabs={[
        { key: 'signin' as const, label: 'Inloggen' },
        { key: 'signup' as const, label: 'Registreren' },
      ]}
      active={mode}
      onChange={handleModeChange}
      variant="pill"
    />

    <input
      className="lb-input"
      type="email"
      placeholder="E-mailadres"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      disabled={loading}
      autoComplete="email"
    />
    <input
      className="lb-input"
      type="password"
      placeholder="Wachtwoord"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
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
          className="bg-bordeaux-tint text-bordeaux px-[14px] py-[10px] rounded-[0_12px_12px_0] text-[13px] font-medium border-l-[3px] border-bordeaux"
        >
          {displayError}
        </motion.div>
      )}
    </AnimatePresence>

    <button
      type="submit"
      className="lb-btn lb-btn--primary mt-1 overflow-hidden"
      disabled={loading}
    >
      <AnimatePresence mode="wait" custom={modeDir}>
        {loading ? (
          <motion.span
            key="spinner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            <span
              className="lb-spinner"
              style={{ borderColor: 'var(--cream-card)', borderRightColor: 'transparent' }}
            />
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
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.15 }}
          >
            {mode === 'signin' ? 'Inloggen' : 'Account aanmaken'}
          </motion.span>
        )}
      </AnimatePresence>
    </button>

    {googleEnabled && (
      <>
        <div className="lb-divider-ornament">
          <span>of</span>
        </div>
        <button
          type="button"
          onClick={handleGoogle}
          className="lb-btn lb-btn--ghost"
          disabled={loading}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              d="M21 12.2c0-.7-.1-1.3-.2-1.9H12v3.7h5.1c-.2 1.2-.9 2.2-1.9 2.9v2.4h3.1c1.8-1.7 2.7-4.1 2.7-7.1z"
              fill="#4285F4"
            />
            <path
              d="M12 21c2.6 0 4.7-.9 6.3-2.3l-3.1-2.4c-.9.6-2 1-3.2 1-2.5 0-4.5-1.6-5.3-3.9H3.6v2.4C5.2 18.9 8.3 21 12 21z"
              fill="#34A853"
            />
            <path
              d="M6.7 13.4c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7H3.6C2.9 8.5 2.5 10.2 2.5 12s.4 3.5 1.1 5l3.1-2.4-1-1.2z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.5c1.4 0 2.7.5 3.7 1.4l2.7-2.7C16.7 2.7 14.6 1.8 12 1.8 8.3 1.8 5.2 4 3.6 7l3.1 2.4c.8-2.3 2.8-3.9 5.3-3.9z"
              fill="#EA4335"
            />
          </svg>
          Doorgaan met Google
        </button>
      </>
    )}

    <div className="text-center mt-[18px] mb-8 text-[12px] text-stone font-serif italic">
      Als het mislukt, is er altijd nog de frituur.
    </div>
  </motion.form>
)

export default AuthForm
