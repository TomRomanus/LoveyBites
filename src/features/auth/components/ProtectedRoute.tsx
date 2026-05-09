import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/contexts/AuthContext'
import LoadingLogo from '@/shared/components/LoadingLogo'

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-paper">
        <LoadingLogo />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
