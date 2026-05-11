import { useState, useMemo, useEffect } from 'react'
import { useRecipeDetailUI } from './useRecipeDetailUI'
import { createPortal } from 'react-dom'
import { AnimatePresence } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { Play } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { deleteRecipe, updateRecipe } from '@/features/recipe/api/recipes'
import { recipeKeys } from '@/features/recipe/api/queryKeys'
import useRecipeLoad from '@/features/recipe/hooks/useRecipeLoad'
import { scaleIngredients, scaleStepAmounts } from '@/features/recipe/utils/scaleIngredient'
import CookingScreen from '@/features/cooking/components/CookingScreen'
import { collectIngredientMap } from '@/features/recipe/utils/ingredientUtils'
import AddToCalendarModal from '@/features/calendar/components/AddToCalendarModal'
import { flattenIngredientSections, flattenSteps } from '@/features/recipe/utils/recipeDisplay'
import useDelayedReset from '@/shared/hooks/useDelayedReset'
import useWakeLock from '@/shared/hooks/useWakeLock'
import useThemeColor from '@/shared/hooks/useThemeColor'
import useCheckedSet from '@/shared/hooks/useCheckedSet'
import RecipeDetailSkeleton from '@/features/recipe/pages/RecipeDetailPage/RecipeDetailSkeleton'
import RecipeHero from '@/features/recipe/components/detail/RecipeHero'
import RecipeMetaSection from '@/features/recipe/components/detail/RecipeMetaSection'
import RecipeIngredients from '@/features/recipe/components/detail/RecipeIngredients'
import RecipeSteps from '@/features/recipe/components/detail/RecipeSteps'
import RecipeSources from '@/features/recipe/components/detail/RecipeSources'
import RecipeNotes from '@/features/recipe/components/detail/RecipeNotes'
import RecipeEquipment from '@/features/recipe/components/detail/RecipeEquipment'
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

  useEffect(() => {
    if (recipe?.portionsLabel === 'stuks') {
      setPortions(recipe.portions ?? 1)
    }
  }, [recipe?.id])

  const handlePortionChange = (v: number) => {
    setPortionDir(v > portions ? 'up' : 'down')
    setPortions(v)
  }
  const {
    cookMode,
    setCookMode,
    calendarOpen,
    setCalendarOpen,
    showActions,
    setShowActions,
    confirmDelete,
    setConfirmDelete,
    deleting,
    setDeleting,
  } = useRecipeDetailUI()
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
  const ingredientMap = useMemo(() => collectIngredientMap(scaledIngredients), [scaledIngredients])
  const stepSections = useMemo(
    () => flattenSteps(scaleStepAmounts(recipe?.steps ?? [], ratio, ingredientMap)),
    [recipe?.steps, ratio, ingredientMap],
  )

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
      <div className="text-center px-5 pt-[60px]">
        <p className="text-stone font-serif italic">Recept niet gevonden.</p>
        <button onClick={() => navigate('/')} className="lb-btn lb-btn--ghost mt-4">
          ← Terug
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] relative bg-paper">
      <RecipeHero
        recipeId={recipe.id}
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
      <div className="px-[22px] pt-5">
        <button
          onClick={() => setCookMode(true)}
          className="lb-btn lb-btn--primary w-full h-10 rounded-[20px] text-[13px]"
        >
          <Play size={16} fill="currentColor" stroke="none" />
          Start kookmodus
        </button>
      </div>

      {(() => {
        const toRoman = (n: number) => ['I', 'II', 'III', 'IV', 'V'][n - 1]
        let d = 0
        const hasEquipment = (recipe.benodigdheden ?? []).length > 0
        const hasIngredients = ingredientSections.some((s) => s.items.length > 0)
        const hasSteps = stepSections.length > 0
        const hasNotes = (recipe.notes ?? []).length > 0
        const hasSources = (recipe.sources ?? []).length > 0
        const equipmentDeel = hasEquipment ? toRoman(++d) : ''
        const ingredientsDeel = hasIngredients ? toRoman(++d) : ''
        const instructionsDeel = hasSteps ? toRoman(++d) : ''
        const notesDeel = hasNotes ? toRoman(++d) : ''
        const sourcesDeel = hasSources ? toRoman(++d) : ''
        return (
          <>
            {hasEquipment && (
              <RecipeEquipment equipment={recipe.benodigdheden!} deel={equipmentDeel} />
            )}
            {hasIngredients && (
              <RecipeIngredients
                sections={ingredientSections}
                portions={portions}
                portionDir={portionDir}
                portionsLabel={recipe.portionsLabel}
                onPortionChange={handlePortionChange}
                checked={checked}
                onToggle={toggleCheck}
                deel={ingredientsDeel}
              />
            )}
            {hasSteps && (
              <RecipeSteps steps={stepSections} ingredientMap={ingredientMap} deel={instructionsDeel} />
            )}
            {hasNotes && <RecipeNotes notes={recipe.notes!} deel={notesDeel} />}
            {hasSources && <RecipeSources sources={recipe.sources ?? []} deel={sourcesDeel} />}
          </>
        )
      })()}

      <div className="pb-[100px]" />

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
