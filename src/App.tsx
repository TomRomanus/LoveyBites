import { useLayoutEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import BottomNav from './components/BottomNav'
import LoginPage from './pages/LoginPage'
import RecipesPage from './pages/RecipesPage'
import RecipeDetailPage from './pages/RecipeDetailPage'
import NewRecipePage from './pages/NewRecipePage'
import CalendarPage from './pages/CalendarPage'

const NAV_ROUTES = ['/', '/calendar']

function AppShell() {
  const location = useLocation()
  const showNav = NAV_ROUTES.includes(location.pathname)

  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100dvh', position: 'relative' }}>
      <div key={location.pathname} className="lb-page-enter">
        <Routes location={location}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><RecipesPage /></ProtectedRoute>} />
          <Route path="/recipe/:id" element={<ProtectedRoute><RecipeDetailPage /></ProtectedRoute>} />
          <Route path="/new" element={<ProtectedRoute><NewRecipePage /></ProtectedRoute>} />
          <Route path="/edit/:id" element={<ProtectedRoute><NewRecipePage /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
        </Routes>
      </div>
      {showNav && <BottomNav />}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AuthProvider>
  )
}
