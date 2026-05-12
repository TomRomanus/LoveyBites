import { useLayoutEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/features/auth/contexts/AuthContext'
import ProtectedRoute from '@/features/auth/components/ProtectedRoute'
import BottomNav from '@/shared/components/BottomNav'
import LoadingLogo from '@/shared/components/LoadingLogo'
import LoginPage from '@/features/auth/pages/LoginPage'
import RecipesPage from '@/features/recipe/pages/RecipesPage'
import RecipeDetailPage from '@/features/recipe/pages/RecipeDetailPage'
import RecipeFormPage from '@/features/recipe/pages/RecipeFormPage'
import CalendarPage from '@/features/calendar/pages/CalendarPage'
import { EASE_STANDARD } from '@/shared/constants/animations'

const NAV_ROUTES = ['/', '/calendar']

const AppShell = () => {
  const { loading } = useAuth()
  const location = useLocation()
  const showNav = NAV_ROUTES.includes(location.pathname)

  useLayoutEffect(() => {
    window.scrollTo(0, 0)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', 'transparent')
  }, [location.pathname])

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-paper">
        <LoadingLogo />
      </div>
    )
  }

  return (
    <div className="max-w-[480px] mx-auto min-h-[100dvh] relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0, transition: { duration: location.pathname.startsWith('/recipe/') ? 0.22 : 0.16, ease: EASE_STANDARD } }}
          exit={{ opacity: 0, y: -10, transition: { duration: location.pathname.startsWith('/recipe/') ? 0.22 : 0.10, ease: EASE_STANDARD } }}
        >
          <Routes location={location}>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <RecipesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recipe/:id"
              element={
                <ProtectedRoute>
                  <RecipeDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/new"
              element={
                <ProtectedRoute>
                  <RecipeFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit/:id"
              element={
                <ProtectedRoute>
                  <RecipeFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <CalendarPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </motion.div>
      </AnimatePresence>
      {showNav && <BottomNav />}
    </div>
  )
}

const App = () => (
  <AuthProvider>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppShell />
    </BrowserRouter>
  </AuthProvider>
)

export default App
