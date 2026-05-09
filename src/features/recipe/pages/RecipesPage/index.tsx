import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import FilterSheet from '@/features/recipe/components/FilterSheet'
import SortSheet from '@/features/recipe/components/SortSheet'
import AddToCalendarModal from '@/features/calendar/components/AddToCalendarModal'
import { getRecipes, getRecipe } from '@/features/recipe/api/recipes'
import { getMealPlanEntries } from '@/features/calendar/api/mealPlan'
import { recipeKeys } from '@/features/recipe/api/queryKeys'
import { calendarKeys } from '@/features/calendar/api/queryKeys'
import type { Recipe } from '@/features/recipe/types/recipe'
import { toISO } from '@/features/calendar/utils/dateUtils'
import useRecipeFilter, { SORT_LABELS } from '@/features/recipe/hooks/useRecipeFilter'
import TodayMenuCard from '@/features/recipe/pages/RecipesPage/TodayMenuCard'
import TodayMenuCardSkeleton from '@/features/recipe/pages/RecipesPage/TodayMenuCardSkeleton'
import RecipeListSkeleton from '@/features/recipe/pages/RecipesPage/RecipeListSkeleton'
import RecipeErrorBanner from '@/features/recipe/pages/RecipesPage/RecipeErrorBanner'
import RecipeEmptyState from '@/features/recipe/pages/RecipesPage/RecipeEmptyState'
import RecipeSearchBar from '@/features/recipe/pages/RecipesPage/RecipeSearchBar'
import RecipeListContent from '@/features/recipe/pages/RecipesPage/RecipeListContent'

const RecipesPage = () => {
  const navigate = useNavigate()
  const [calendarRecipe, setCalendarRecipe] = useState<Recipe | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showSort, setShowSort] = useState(false)

  const today = useMemo(() => toISO(new Date()), [])

  const {
    data: recipes = [],
    isLoading: loading,
    error: recipesError,
  } = useQuery({
    queryKey: recipeKeys.list(),
    queryFn: getRecipes,
  })

  const { data: todayRecipe, isLoading: todayLoading } = useQuery({
    queryKey: calendarKeys.todayRecipe(today),
    queryFn: async () => {
      const entries = await getMealPlanEntries(today, today)
      const entry = entries.find((e) => e.recipeId)
      if (!entry?.recipeId) return null
      return getRecipe(entry.recipeId)
    },
  })

  const error = recipesError
    ? 'Recepten konden niet worden geladen. Controleer je Firebase-configuratie.'
    : null

  const {
    searchQuery,
    setSearchQuery,
    activeTags,
    setActiveTags,
    sort,
    setSort,
    allTags,
    sorted,
    clearFilters,
  } = useRecipeFilter(recipes)

  return (
    <div className="lb-paper min-h-[100dvh] relative">
      <div className="px-5 pt-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="m-0 text-[42px] leading-[1.05] font-serif italic font-medium tracking-[-0.02em] text-ink whitespace-nowrap">
            Ons kookboek
          </h1>
          <Link
            to="/new"
            title="Recept toevoegen"
            className="inline-flex items-center justify-center w-10 h-10 rounded-[20px] bg-paper shadow-icon text-bordeaux shrink-0"
          >
            <Plus size={16} />
          </Link>
        </div>
      </div>

      {(todayLoading || todayRecipe) && (
        <div className="px-5 pt-5">
          <div className="lb-eyebrow mb-2">Op het menu vandaag</div>
          {todayLoading ? (
            <TodayMenuCardSkeleton />
          ) : todayRecipe ? (
            <TodayMenuCard recipe={todayRecipe} />
          ) : null}
        </div>
      )}

      {!error && (
        <RecipeSearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeTags={activeTags}
          onFiltersOpen={() => setShowFilters(true)}
          onSortOpen={() => setShowSort(true)}
          sortLabel={SORT_LABELS[sort]}
          count={sorted.length}
          loading={loading}
        />
      )}

      {loading && <RecipeListSkeleton />}
      {error && <RecipeErrorBanner message={error} />}

      {!loading && !error && sorted.length === 0 && (
        <RecipeEmptyState
          hasFilters={Boolean(searchQuery || activeTags.length)}
          onClearFilters={clearFilters}
          onAddFirst={() => navigate('/new')}
        />
      )}

      {!loading && !error && sorted.length > 0 && (
        <RecipeListContent
          recipes={sorted}
          activeTags={activeTags}
          onAddToCalendar={setCalendarRecipe}
        />
      )}

      <FilterSheet
        visible={showFilters}
        activeTags={activeTags}
        allTags={allTags}
        onChange={setActiveTags}
        onClose={() => setShowFilters(false)}
      />
      <SortSheet
        visible={showSort}
        sort={sort}
        onChange={setSort}
        onClose={() => setShowSort(false)}
      />

      {calendarRecipe && (
        <AddToCalendarModal recipe={calendarRecipe} onClose={() => setCalendarRecipe(null)} />
      )}
    </div>
  )
}

export default RecipesPage
