import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/contexts/AuthContext'
import { useLoginForm } from './useLoginForm'
import AuthMasthead from './AuthMasthead'
import AuthForm from './AuthForm'

const LoginPage = () => {
  const { user } = useAuth()
  const form = useLoginForm()

  if (user) return <Navigate to="/" replace />

  return (
    <div className="lb-paper min-h-[100dvh] flex flex-col">
      <AuthMasthead />
      <AuthForm {...form} />
    </div>
  )
}

export default LoginPage
