import { useLayoutEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AuthProvider, useAuth } from './auth/contexts/AuthContext'
import ProtectedRoute from './auth/components/ProtectedRoute'
import BottomNav from './shared/components/BottomNav'
import LoadingLogo from './shared/components/LoadingLogo'
import LoginPage from './auth/pages/LoginPage'
import RecipesPage from './recipe/pages/RecipesPage'
import RecipeDetailPage from './recipe/pages/RecipeDetailPage'
import RecipeFormPage from './recipe/pages/RecipeFormPage'
import CalendarPage from './calendar/pages/CalendarPage'

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
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--paper)',
        }}
      >
        <LoadingLogo />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100dvh', position: 'relative' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.22, ease: [0.2, 0, 0.2, 1] }}
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
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  </AuthProvider>
)

export default App
