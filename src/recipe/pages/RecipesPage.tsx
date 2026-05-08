import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Check, Search, X, SlidersHorizontal, ArrowUpDown, ChevronDown, Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import RecipeCard from '../components/RecipeCard'
import AddToCalendarModal from '../../calendar/components/AddToCalendarModal'
import { StarRating } from '../components/StarRating'
import { getRecipes, getRecipe } from '../services/recipes'
import { getMealPlanEntries } from '../../calendar/services/mealPlan'
import { recipeKeys } from '../services/queryKeys'
import { calendarKeys } from '../../calendar/services/queryKeys'
import type { Recipe } from '../types/recipe'
import { toISO } from '../../calendar/utils/dateUtils'
import { extractLeafTexts } from '../utils/ingredientUtils'

type SortOption = 'default' | 'name-asc' | 'name-desc' | 'rating-desc' | 'rating-asc'

const SORT_LABELS: Record<SortOption, string> = {
  'default': 'Nieuwste eerst',
  'name-asc': 'Naam A → Z',
  'name-desc': 'Naam Z → A',
  'rating-desc': 'Hoogste beoordeling',
  'rating-asc': 'Laagste beoordeling',
}

const sheetVariants = {
  hidden: { y: '100%', transition: { type: 'tween' as const, duration: 0.22, ease: [0.4, 0, 1, 1] as const } },
  visible: { y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 32 } },
}
const backdropVariants = {
  hidden: { opacity: 0, transition: { duration: 0.2 } },
  visible: { opacity: 1, transition: { duration: 0.24 } },
}

const FilterSheet = ({ activeTags, allTags, onChange, onClose }: {
  activeTags: string[]
  allTags: string[]
  onChange: (tags: string[]) => void
  onClose: () => void
}) => {
  const [visible, setVisible] = useState(true)
  const [q, setQ] = useState('')
  const filtered = allTags.filter(t => t.toLowerCase().includes(q.toLowerCase()))
  const toggle = (t: string) =>
    onChange(activeTags.includes(t) ? activeTags.filter(x => x !== t) : [...activeTags, t])

  return createPortal(
    <AnimatePresence onExitComplete={onClose}>
      {visible && <motion.div key="filter-bd"
        variants={backdropVariants} initial="hidden" animate="visible" exit="hidden"
        onClick={() => setVisible(false)}
        style={{ position: 'fixed', inset: 0, background: 'rgba(31,29,26,0.12)', backdropFilter: 'blur(1px)', WebkitBackdropFilter: 'blur(1px)', zIndex: 200 }} />}
      {visible && <motion.div key="filter-sheet" className="lb-sheet" style={{ animation: 'none', paddingBottom: 30 }}
        variants={sheetVariants} initial="hidden" animate="visible" exit="hidden">
        <div className="lb-sheet-grabber" />
        <div style={{ padding: '12px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 className="lb-display" style={{ margin: 0, fontSize: 22 }}>Filter op tag</h3>
          {activeTags.length > 0 && (
            <button onClick={() => onChange([])} style={{ background: 'none', border: 0, color: 'var(--bordeaux)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
              Alles wissen
            </button>
          )}
        </div>
        <div style={{ padding: '14px 20px 0' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)', pointerEvents: 'none' }}>
              <Search size={16} strokeWidth={1.6} />
            </div>
            <input className="lb-input" placeholder="Zoek tags" value={q} onChange={e => setQ(e.target.value)}
              style={{ paddingLeft: 40, height: 40 }} autoFocus />
          </div>
        </div>
        <div style={{ padding: '16px 20px 20px', display: 'flex', flexWrap: 'wrap', gap: 8, overflowY: 'auto', overflowX: 'hidden', flex: 1 }}>
          {filtered.map(t => {
            const isActive = activeTags.includes(t)
            return (
              <motion.button
                key={t}
                type="button"
                className="lb-tag"
                data-active={isActive ? 'true' : 'false'}
                onClick={() => toggle(t)}
                layout
                transition={{ layout: { type: 'spring', stiffness: 400, damping: 32 } }}
                style={{ cursor: 'pointer', gap: 4 }}
              >
                <AnimatePresence mode="popLayout">
                  {isActive && (
                    <motion.span
                      key="check"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 25 }}
                      style={{ display: 'inline-flex' }}
                    >
                      <Check size={14} strokeWidth={2.5} />
                    </motion.span>
                  )}
                </AnimatePresence>
                {t}
              </motion.button>
            )
          })}
          {filtered.length === 0 && (
            <div style={{ fontSize: 13, color: 'var(--stone)' }}>Geen tags voor &ldquo;{q}&rdquo;.</div>
          )}
        </div>
        <div style={{ padding: '0 20px 14px', flexShrink: 0 }}>
          <button onClick={() => setVisible(false)} className="lb-btn lb-btn--primary" style={{ width: '100%' }}>Toepassen</button>
        </div>
      </motion.div>}
    </AnimatePresence>,
    document.body
  )
}

const SortSheet = ({ sort, onChange, onClose }: {
  sort: SortOption
  onChange: (v: SortOption) => void
  onClose: () => void
}) => {
  const [visible, setVisible] = useState(true)
  const opts = (Object.keys(SORT_LABELS) as SortOption[])
  return createPortal(
    <AnimatePresence onExitComplete={onClose}>
      {visible && <motion.div key="sort-bd" className="lb-sheet-backdrop" style={{ animation: 'none' }}
        variants={backdropVariants} initial="hidden" animate="visible" exit="hidden"
        onClick={() => setVisible(false)} />}
      {visible && <motion.div key="sort-sheet" className="lb-sheet" style={{ animation: 'none', paddingBottom: 30 }}
        variants={sheetVariants} initial="hidden" animate="visible" exit="hidden">
        <div className="lb-sheet-grabber" />
        <div style={{ padding: '12px 20px 0' }}>
          <h3 className="lb-display" style={{ margin: 0, fontSize: 22 }}>Sorteren</h3>
        </div>
        <div style={{ padding: '14px 12px 16px' }}>
          {opts.map(o => (
            <button key={o} onClick={() => { onChange(o); setVisible(false) }} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', padding: '14px 16px', background: 'transparent', border: 0,
              fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--ink)', borderRadius: 12,
              fontWeight: sort === o ? 600 : 400, cursor: 'pointer',
            }}>
              {SORT_LABELS[o]}
              {sort === o && (
                <Check size={18} color="var(--bordeaux)" />
              )}
            </button>
          ))}
        </div>
      </motion.div>}
    </AnimatePresence>,
    document.body
  )
}


const RecipesPage = () => {
  const navigate = useNavigate()
  const [calendarRecipe, setCalendarRecipe] = useState<Recipe | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [sort, setSort] = useState<SortOption>('name-asc')
  const [showFilters, setShowFilters] = useState(false)
  const [showSort, setShowSort] = useState(false)

  const today = useMemo(() => toISO(new Date()), [])

  const { data: recipes = [], isLoading: loading, error: recipesError } = useQuery({
    queryKey: recipeKeys.list(),
    queryFn: getRecipes,
  })

  const { data: todayRecipe, isLoading: todayLoading } = useQuery({
    queryKey: calendarKeys.todayRecipe(today),
    queryFn: async () => {
      const entries = await getMealPlanEntries(today, today)
      const entry = entries.find(e => e.recipeId)
      if (!entry?.recipeId) return null
      return getRecipe(entry.recipeId)
    },
  })

  const error = recipesError ? 'Recepten konden niet worden geladen. Controleer je Firebase-configuratie.' : null

  const allTags = [...new Set(recipes.flatMap(r => r.tags))].sort((a, b) => a.localeCompare(b))

  const filtered = recipes.filter(recipe => {
    if (activeTags.length && !activeTags.every(t => recipe.tags.includes(t))) return false
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    if (recipe.title.toLowerCase().includes(q)) return true
    if (recipe.description?.toLowerCase().includes(q)) return true
    return extractLeafTexts(recipe.ingredients).some(t => t.toLowerCase().includes(q))
  })

  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case 'name-asc': return a.title.localeCompare(b.title)
      case 'name-desc': return b.title.localeCompare(a.title)
      case 'rating-desc': return (b.rating ?? 0) - (a.rating ?? 0)
      case 'rating-asc': return (a.rating ?? 0) - (b.rating ?? 0)
      default: return 0
    }
  })

  return (
    <div className="lb-paper" style={{ minHeight: '100dvh', position: 'relative' }}>
      {/* Editorial masthead */}
      <div style={{ padding: '24px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: 42, lineHeight: 1.05, fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--ink)', whiteSpace: 'nowrap' }}>
            Ons kookboek
          </h1>
          <Link to="/new" title="Recept toevoegen"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 20, background: 'var(--paper)', boxShadow: '0 1px 2px rgba(31,29,26,0.04), 0 0 0 0.5px var(--line)', color: 'var(--bordeaux)', flexShrink: 0 }}>
            <Plus size={16} />
          </Link>
        </div>
      </div>

      {/* Today's menu */}
      {(todayLoading || todayRecipe) && (
        <div style={{ padding: '20px 20px 0' }}>
          <div className="lb-eyebrow" style={{ marginBottom: 8 }}>Op het menu vandaag</div>
          {todayLoading ? (
            <div className="lb-card" style={{ overflow: 'hidden' }}>
              <div className="lb-skeleton" style={{ height: 72, borderRadius: 0 }} />
              <div style={{ padding: '10px 14px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div className="lb-skeleton" style={{ height: 13, width: '55%' }} />
                <div className="lb-skeleton" style={{ height: 13, width: '35%' }} />
              </div>
            </div>
          ) : todayRecipe ? (
            <Link to={`/recipe/${todayRecipe.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
              <div className="lb-card" style={{ overflow: 'hidden' }}>
                <div style={{
                  height: 72, background: 'var(--bordeaux)',
                  display: 'flex', alignItems: 'flex-end', padding: '0 14px 12px',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 80% at 100% 0%, rgba(255,255,255,0.10), transparent 60%), radial-gradient(80% 60% at 0% 100%, rgba(0,0,0,0.18), transparent 60%)', pointerEvents: 'none' }} />
                  <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 20, fontWeight: 500, color: 'rgba(255,250,240,0.96)', lineHeight: 1.05, letterSpacing: '-0.02em', position: 'relative', zIndex: 1 }}>
                    {todayRecipe.title}
                  </div>
                </div>
                <div style={{ padding: '10px 14px 12px' }}>
                  {todayRecipe.description && (
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
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
        {loading && <div className="lb-skeleton" style={{ height: 11, width: '30%', borderRadius: 4 }} />}
        {!loading && !error && (
          <div className="lb-eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden' }}>
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
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)', pointerEvents: 'none' }}>
            <Search size={18} strokeWidth={1.6} />
          </div>
          <input
            className="lb-input"
            placeholder="Zoek recept of ingrediënt"
            style={{ paddingLeft: 42, paddingRight: searchQuery ? 42 : 14 }}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <AnimatePresence>
            {searchQuery && (
              <motion.button
                key="clear"
                onClick={() => setSearchQuery('')}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                style={{
                  position: 'absolute', right: 8, top: '50%', translateY: '-50%',
                  background: 'none', border: 0, width: 26, height: 26, borderRadius: 13,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--stone)', cursor: 'pointer',
                }}
              >
                <X size={14} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {loading && (
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="lb-skeleton" style={{ flex: 1, height: 36, borderRadius: 10 }} />
            <div className="lb-skeleton" style={{ flex: 1, height: 36, borderRadius: 10 }} />
          </div>
        )}
        {!loading && !error && recipes.length > 0 && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowFilters(true)} className="lb-btn lb-btn--ghost lb-btn--small"
              style={{ flex: 1, justifyContent: 'space-between', padding: '0 14px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <SlidersHorizontal size={14} strokeWidth={1.6} />
                Tags
              </span>
              {activeTags.length > 0 && (
                <span style={{ background: 'var(--bordeaux)', color: 'var(--cream-card)', borderRadius: 9, height: 18, minWidth: 18, padding: '0 6px', fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  {activeTags.length}
                </span>
              )}
            </button>
            <button onClick={() => setShowSort(true)} className="lb-btn lb-btn--ghost lb-btn--small"
              style={{ flex: 1, justifyContent: 'space-between', padding: '0 14px' }}>
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
              <div style={{ width: 24, height: 1.5, background: 'var(--bordeaux)', borderRadius: 1, opacity: 0.25, margin: '4px 0' }} />
              <div className="lb-skeleton" style={{ height: 12, width: '78%', marginBottom: 3 }} />
              <div className="lb-skeleton" style={{ height: 12, width: '55%' }} />
              <div className="lb-skeleton" style={{ height: 9, width: ['45%', '38%', '52%', '42%', '48%', '35%'][i], marginTop: 4, marginBottom: 4 }} />
              <div className="lb-skeleton" style={{ height: 13, width: 73 }} />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div style={{ margin: '20px', padding: '14px', background: 'var(--bordeaux-tint)', borderRadius: '0 12px 12px 0', fontSize: 13, fontWeight: 500, color: 'var(--bordeaux)', borderLeft: '3px solid var(--bordeaux)' }}>
          {error}
        </div>
      )}

      {!loading && !error && sorted.length === 0 && (
        <div style={{ padding: '60px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12, fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--bordeaux)' }}>·</div>
          <h2 className="lb-display" style={{ margin: 0, fontSize: 26 }}>
            {searchQuery || activeTags.length ? 'Niets gevonden' : 'Je boek is nog leeg'}
          </h2>
          <p style={{ margin: '10px 0 24px', color: 'var(--stone)', fontSize: 14, lineHeight: 1.5 }}>
            {searchQuery || activeTags.length
              ? 'Probeer andere woorden of wis de filters.'
              : 'Begin met het bewaren van je eerste favoriete recept.'}
          </p>
          {searchQuery || activeTags.length ? (
            <button onClick={() => { setSearchQuery(''); setActiveTags([]) }} className="lb-btn lb-btn--ghost">
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
                transition={{ duration: 0.18, layout: { type: 'spring', stiffness: 350, damping: 35 } }}
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


      {showFilters && (
        <FilterSheet activeTags={activeTags} allTags={allTags} onChange={setActiveTags} onClose={() => setShowFilters(false)} />
      )}
      {showSort && (
        <SortSheet sort={sort} onChange={setSort} onClose={() => setShowSort(false)} />
      )}

      {calendarRecipe && (
        <AddToCalendarModal
          recipe={calendarRecipe}
          onClose={() => setCalendarRecipe(null)}
        />
      )}
    </div>
  )
}

export default RecipesPage
