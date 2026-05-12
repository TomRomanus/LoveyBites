import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { vi, describe, it, expect } from 'vitest'
import type { User } from 'firebase/auth'
import LoginPage from '../index'
import { useAuth } from '@/features/auth/contexts/AuthContext'

vi.mock('@/features/auth/contexts/AuthContext')

function setup(user: User | null = null) {
  vi.mocked(useAuth).mockReturnValue({
    user,
    loading: false,
    authError: null,
    signInWithGoogle: vi.fn(),
    signInWithEmail: vi.fn(),
    signUpWithEmail: vi.fn(),
    signOutUser: vi.fn(),
  })

  return render(
    <MemoryRouter
      initialEntries={['/login']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<div>home page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  it('renders the auth form when no user is signed in', () => {
    setup(null)
    expect(screen.getByPlaceholderText('E-mailadres')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Wachtwoord')).toBeInTheDocument()
  })

  it('renders the masthead when no user is signed in', () => {
    setup(null)
    expect(screen.getByText('Lovey')).toBeInTheDocument()
    expect(screen.getByText('Bites')).toBeInTheDocument()
  })

  it('redirects to "/" when a user is already signed in', () => {
    setup({ uid: 'abc', email: 'user@test.com' } as User)
    expect(screen.getByText('home page')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('E-mailadres')).not.toBeInTheDocument()
  })
})
