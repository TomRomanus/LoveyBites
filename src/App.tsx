import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RecipesPage from './pages/RecipesPage'
import RecipeDetailPage from './pages/RecipeDetailPage'
import NewRecipePage from './pages/NewRecipePage'
import CalendarPage from './pages/CalendarPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100dvh', position: 'relative' }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><RecipesPage /></ProtectedRoute>} />
          <Route path="/recipe/:id" element={<ProtectedRoute><RecipeDetailPage /></ProtectedRoute>} />
          <Route path="/new" element={<ProtectedRoute><NewRecipePage /></ProtectedRoute>} />
          <Route path="/edit/:id" element={<ProtectedRoute><NewRecipePage /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
        </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}
