import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { Play } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { deleteRecipe, updateRecipe } from '@/features/recipe/api/recipes'
import { recipeKeys } from '@/features/recipe/api/queryKeys'
import useRecipeLoad from '@/features/recipe/hooks/useRecipeLoad'
import { scaleIngredients } from '@/features/recipe/utils/scaleIngredient'
import CookingScreen from '@/features/cooking/components/CookingScreen'
import { collectIngredientMap } from '@/features/recipe/utils/ingredientUtils'
import AddToCalendarModal from '@/features/calendar/components/AddToCalendarModal'
import { flattenIngredientSections, flattenSteps } from '@/features/recipe/utils/recipeDisplay'
import { useDelayedReset, useWakeLock, useThemeColor, useCheckedSet } from '@/shared/hooks'
import RecipeDetailSkeleton from '@/features/recipe/pages/RecipeDetailPage/RecipeDetailSkeleton'
import RecipeHero from '@/features/recipe/components/detail/RecipeHero'
import RecipeMetaSection from '@/features/recipe/components/detail/RecipeMetaSection'
import RecipeIngredients from '@/features/recipe/components/detail/RecipeIngredients'
import RecipeSteps from '@/features/recipe/components/detail/RecipeSteps'
import RecipeSources from '@/features/recipe/components/detail/RecipeSources'
import RecipeActionsSheet from '@/features/recipe/components/detail/RecipeActionsSheet'
import DeleteConfirmDialog from '@/features/recipe/components/detail/DeleteConfirmDialog'
import CalendarFab from '@/features/recipe/components/detail/CalendarFab'

const RecipeDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: recipe, isLoading: loading } = useRecipeLoad(id)
  const { checked, toggle: toggleCheck } = useCheckedSet()
  const [portions, setPortions] = useState(2)
  const [portionDir, setPortionDir] = useState<'up' | 'down' | null>(null)

  const handlePortionChange = (v: number) => {
    setPortionDir(v > portions ? 'up' : 'down')
    setPortions(v)
  }
  const [cookMode, setCookMode] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [ratingTick, setRatingTick] = useState(0)
  const showRatingSaved = useDelayedReset(ratingTick, 0, 900) > 0

  useThemeColor(recipe ? (cookMode ? '#1f1d1a' : '#6b1f2a') : '')
  useWakeLock(!!recipe)

  const ratio = portions / (recipe?.portions ?? 4)
  const scaledIngredients = useMemo(
    () => scaleIngredients(recipe?.ingredients ?? [], ratio),
    [recipe?.ingredients, ratio],
  )
  const ingredientSections = useMemo(
    () => flattenIngredientSections(scaledIngredients),
    [scaledIngredients],
  )
  const stepSections = useMemo(() => flattenSteps(recipe?.steps ?? []), [recipe?.steps])
  const ingredientMap = useMemo(() => collectIngredientMap(scaledIngredients), [scaledIngredients])

  const handleRating = async (rating: number) => {
    if (!id || !recipe) return
    await updateRecipe(id, { rating })
    queryClient.setQueryData(recipeKeys.detail(id), { ...recipe, rating })
    setRatingTick((t) => t + 1)
  }

  const handleDelete = async () => {
    if (!id) return
    setDeleting(true)
    await deleteRecipe(id)
    queryClient.invalidateQueries({ queryKey: recipeKeys.list() })
    navigate('/')
  }

  if (loading) {
    return <RecipeDetailSkeleton />
  }

  if (!recipe) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <p style={{ color: 'var(--stone)', fontFamily: 'var(--serif)', fontStyle: 'italic' }}>
          Recept niet gevonden.
        </p>
        <button
          onClick={() => navigate('/')}
          className="lb-btn lb-btn--ghost"
          style={{ marginTop: 16 }}
        >
          ← Terug
        </button>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', position: 'relative', background: 'var(--paper)' }}>
      <RecipeHero
        title={recipe.title}
        onBack={() => navigate(-1)}
        onActionsOpen={() => setShowActions(true)}
      />

      <RecipeMetaSection
        tags={recipe.tags}
        description={recipe.description}
        rating={recipe.rating}
        showRatingSaved={showRatingSaved}
        onRating={handleRating}
      />

      {/* Cook mode CTA */}
      <div style={{ padding: '20px 22px 0' }}>
        <button
          onClick={() => setCookMode(true)}
          className="lb-btn lb-btn--primary"
          style={{ width: '100%', height: 40, borderRadius: 20, fontSize: 13 }}
        >
          <Play size={16} fill="currentColor" stroke="none" />
          Start kookmodus
        </button>
      </div>

      {ingredientSections.some((s) => s.items.length > 0) && (
        <RecipeIngredients
          sections={ingredientSections}
          portions={portions}
          portionDir={portionDir}
          portionsLabel={recipe.portionsLabel}
          onPortionChange={handlePortionChange}
          checked={checked}
          onToggle={toggleCheck}
        />
      )}

      {stepSections.length > 0 && (
        <RecipeSteps steps={stepSections} ingredientMap={ingredientMap} />
      )}

      {(recipe.sources ?? []).length > 0 && <RecipeSources sources={recipe.sources ?? []} />}

      <div style={{ paddingBottom: 100 }} />

      <RecipeActionsSheet
        visible={showActions}
        onEdit={() => {
          setShowActions(false)
          navigate(`/edit/${recipe.id}`)
        }}
        onDeleteRequest={() => {
          setShowActions(false)
          setConfirmDelete(true)
        }}
        onClose={() => setShowActions(false)}
      />

      <DeleteConfirmDialog
        visible={confirmDelete}
        recipeTitle={recipe.title}
        deleting={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />

      <CalendarFab visible={!calendarOpen && !cookMode} onClick={() => setCalendarOpen(true)} />

      {calendarOpen && (
        <AddToCalendarModal recipe={recipe} onClose={() => setCalendarOpen(false)} />
      )}

      {createPortal(
        <AnimatePresence>
          {cookMode && (
            <CookingScreen
              recipe={recipe}
              scaledIngredients={scaledIngredients}
              selectedPortions={portions}
              onPortionsChange={setPortions}
              checked={checked}
              onToggle={toggleCheck}
              onClose={() => setCookMode(false)}
            />
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  )
}

export default RecipeDetailPage
