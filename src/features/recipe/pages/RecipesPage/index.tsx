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
    <div className="lb-paper" style={{ minHeight: '100dvh', position: 'relative' }}>
      {/* Editorial masthead */}
      <div style={{ padding: '24px 20px 0' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 42,
              lineHeight: 1.05,
              fontFamily: 'var(--serif)',
              fontStyle: 'italic',
              fontWeight: 500,
              letterSpacing: '-0.02em',
              color: 'var(--ink)',
              whiteSpace: 'nowrap',
            }}
          >
            Ons kookboek
          </h1>
          <Link
            to="/new"
            title="Recept toevoegen"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 20,
              background: 'var(--paper)',
              boxShadow: '0 1px 2px rgba(31,29,26,0.04), 0 0 0 0.5px var(--line)',
              color: 'var(--bordeaux)',
              flexShrink: 0,
            }}
          >
            <Plus size={16} />
          </Link>
        </div>
      </div>

      {/* Today's menu */}
      {(todayLoading || todayRecipe) && (
        <div style={{ padding: '20px 20px 0' }}>
          <div className="lb-eyebrow" style={{ marginBottom: 8 }}>
            Op het menu vandaag
          </div>
          {todayLoading ? (
            <div className="lb-card" style={{ overflow: 'hidden' }}>
              <div className="lb-skeleton" style={{ height: 72, borderRadius: 0 }} />
              <div
                style={{
                  padding: '10px 14px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div className="lb-skeleton" style={{ height: 13, width: '55%' }} />
                <div className="lb-skeleton" style={{ height: 13, width: '35%' }} />
              </div>
            </div>
          ) : todayRecipe ? (
            <TodayMenuCard recipe={todayRecipe} />
          ) : null}
        </div>
      )}

      {/* Search + filters — only shown when not error */}
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

      {/* Content */}
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
