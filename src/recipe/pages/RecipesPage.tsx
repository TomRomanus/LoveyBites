import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { SlidersHorizontal, ArrowUpDown, ChevronDown, Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import RecipeCard from '../components/RecipeCard'
import FilterSheet from '../components/FilterSheet'
import SortSheet from '../components/SortSheet'
import AddToCalendarModal from '../../calendar/components/AddToCalendarModal'
import { StarRating } from '../components/StarRating'
import { getRecipes, getRecipe } from '../services/recipes'
import { getMealPlanEntries } from '../../calendar/services/mealPlan'
import { recipeKeys } from '../services/queryKeys'
import { calendarKeys } from '../../calendar/services/queryKeys'
import type { Recipe } from '../types/recipe'
import { toISO } from '../../calendar/utils/dateUtils'
import SearchInput from '../../shared/components/SearchInput'
import useRecipeFilter, { SORT_LABELS } from '../hooks/useRecipeFilter'

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

  const { searchQuery, setSearchQuery, activeTags, setActiveTags, sort, setSort, allTags, sorted, clearFilters } =
    useRecipeFilter(recipes)

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
            <Link
              to={`/recipe/${todayRecipe.id}`}
              style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
            >
              <div className="lb-card" style={{ overflow: 'hidden' }}>
                <div
                  style={{
                    height: 72,
                    background: 'var(--bordeaux)',
                    display: 'flex',
                    alignItems: 'flex-end',
                    padding: '0 14px 12px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background:
                        'radial-gradient(120% 80% at 100% 0%, rgba(255,255,255,0.10), transparent 60%), radial-gradient(80% 60% at 0% 100%, rgba(0,0,0,0.18), transparent 60%)',
                      pointerEvents: 'none',
                    }}
                  />
                  <div
                    style={{
                      fontFamily: 'var(--serif)',
                      fontStyle: 'italic',
                      fontSize: 20,
                      fontWeight: 500,
                      color: 'rgba(255,250,240,0.96)',
                      lineHeight: 1.05,
                      letterSpacing: '-0.02em',
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    {todayRecipe.title}
                  </div>
                </div>
                <div style={{ padding: '10px 14px 12px' }}>
                  {todayRecipe.description && (
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        color: 'var(--ink-2)',
                        lineHeight: 1.45,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {todayRecipe.description}
                    </p>
                  )}
                  <div style={{ marginTop: 8 }}>
                    <StarRating value={todayRecipe.rating ?? 0} />
                  </div>
                </div>
              </div>
            </Link>
          ) : null}
        </div>
      )}

      {/* Search + filters */}
      <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading && (
          <div className="lb-skeleton" style={{ height: 11, width: '30%', borderRadius: 4 }} />
        )}
        {!loading && !error && (
          <div
            className="lb-eyebrow"
            style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden' }}
          >
            <AnimatePresence mode="popLayout">
              <motion.span
                key={sorted.length}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                style={{ display: 'block' }}
              >
                {sorted.length}
              </motion.span>
            </AnimatePresence>
            {sorted.length === 1 ? 'RECEPT' : 'RECEPTEN'}
          </div>
        )}
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Zoek recept of ingrediënt"
        />

        {loading && (
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="lb-skeleton" style={{ flex: 1, height: 36, borderRadius: 10 }} />
            <div className="lb-skeleton" style={{ flex: 1, height: 36, borderRadius: 10 }} />
          </div>
        )}
        {!loading && !error && recipes.length > 0 && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setShowFilters(true)}
              className="lb-btn lb-btn--ghost lb-btn--small"
              style={{ flex: 1, justifyContent: 'space-between', padding: '0 14px' }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <SlidersHorizontal size={14} strokeWidth={1.6} />
                Tags
              </span>
              {activeTags.length > 0 && (
                <span
                  style={{
                    background: 'var(--bordeaux)',
                    color: 'var(--cream-card)',
                    borderRadius: 9,
                    height: 18,
                    minWidth: 18,
                    padding: '0 6px',
                    fontSize: 11,
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {activeTags.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowSort(true)}
              className="lb-btn lb-btn--ghost lb-btn--small"
              style={{ flex: 1, justifyContent: 'space-between', padding: '0 14px' }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <ArrowUpDown size={14} strokeWidth={1.6} />
                {SORT_LABELS[sort]}
              </span>
              <ChevronDown size={14} strokeWidth={1.6} />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {loading && (
        <div style={{ padding: '10px 20px 120px' }}>
          {[62, 48, 70, 55, 65, 50].map((titleW, i) => (
            <div key={i} style={{ padding: '10px 0', borderBottom: '0.5px solid var(--line)' }}>
              <div className="lb-skeleton" style={{ height: 20, width: `${titleW}%` }} />
              <div
                style={{
                  width: 24,
                  height: 1.5,
                  background: 'var(--bordeaux)',
                  borderRadius: 1,
                  opacity: 0.25,
                  margin: '4px 0',
                }}
              />
              <div className="lb-skeleton" style={{ height: 12, width: '78%', marginBottom: 3 }} />
              <div className="lb-skeleton" style={{ height: 12, width: '55%' }} />
              <div
                className="lb-skeleton"
                style={{
                  height: 9,
                  width: ['45%', '38%', '52%', '42%', '48%', '35%'][i],
                  marginTop: 4,
                  marginBottom: 4,
                }}
              />
              <div className="lb-skeleton" style={{ height: 13, width: 73 }} />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div
          style={{
            margin: '20px',
            padding: '14px',
            background: 'var(--bordeaux-tint)',
            borderRadius: '0 12px 12px 0',
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--bordeaux)',
            borderLeft: '3px solid var(--bordeaux)',
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && sorted.length === 0 && (
        <div style={{ padding: '60px 32px', textAlign: 'center' }}>
          <div
            style={{
              fontSize: 48,
              marginBottom: 12,
              fontFamily: 'var(--serif)',
              fontStyle: 'italic',
              color: 'var(--bordeaux)',
            }}
          >
            ·
          </div>
          <h2 className="lb-display" style={{ margin: 0, fontSize: 26 }}>
            {searchQuery || activeTags.length ? 'Niets gevonden' : 'Je boek is nog leeg'}
          </h2>
          <p
            style={{ margin: '10px 0 24px', color: 'var(--stone)', fontSize: 14, lineHeight: 1.5 }}
          >
            {searchQuery || activeTags.length
              ? 'Probeer andere woorden of wis de filters.'
              : 'Begin met het bewaren van je eerste favoriete recept.'}
          </p>
          {searchQuery || activeTags.length ? (
            <button onClick={clearFilters} className="lb-btn lb-btn--ghost">
              Filters wissen
            </button>
          ) : (
            <button onClick={() => navigate('/new')} className="lb-btn lb-btn--primary">
              <Plus size={16} />
              Eerste recept toevoegen
            </button>
          )}
        </div>
      )}

      {!loading && !error && sorted.length > 0 && (
        <div style={{ padding: '10px 20px 120px' }}>
          <AnimatePresence initial={false}>
            {sorted.map((r) => (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 0.18,
                  layout: { type: 'spring', stiffness: 350, damping: 35 },
                }}
              >
                <RecipeCard
                  recipe={r}
                  variant="default"
                  onAddToCalendar={setCalendarRecipe}
                  highlightTags={activeTags.length > 0 ? activeTags : undefined}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
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
