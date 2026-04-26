import { BrowserRouter, Routes, Route } from 'react-router-dom'
import RecipesPage from './pages/RecipesPage'
import RecipeDetailPage from './pages/RecipeDetailPage'
import NewRecipePage from './pages/NewRecipePage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RecipesPage />} />
        <Route path="/recipe/:id" element={<RecipeDetailPage />} />
        <Route path="/new" element={<NewRecipePage />} />
        <Route path="/edit/:id" element={<NewRecipePage />} />
      </Routes>
    </BrowserRouter>
  )
}
