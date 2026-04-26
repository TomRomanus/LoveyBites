import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import type { User } from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'

const ALLOWED_EMAILS = ((import.meta.env.VITE_ALLOWED_EMAILS as string) ?? '')
  .split(',')
  .map((e: string) => e.trim().toLowerCase())
  .filter(Boolean)

interface AuthContextValue {
  user: User | null
  loading: boolean
  authError: string | null
  signInWithGoogle: () => Promise<void>
  signOutUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const email = firebaseUser.email?.toLowerCase() ?? ''
        if (ALLOWED_EMAILS.includes(email)) {
          setUser(firebaseUser)
          setAuthError(null)
        } else {
          signOut(auth)
          setUser(null)
          setAuthError('Dit account heeft geen toegang tot LoveyBites.')
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  async function signInWithGoogle() {
    setAuthError(null)
    await signInWithPopup(auth, googleProvider)
  }

  async function signOutUser() {
    await signOut(auth)
    setAuthError(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, authError, signInWithGoogle, signOutUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
