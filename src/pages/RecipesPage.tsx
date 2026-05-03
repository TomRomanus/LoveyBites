import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import RecipeCard from '../components/RecipeCard'
import AddToCalendarModal from '../components/AddToCalendarModal'
import { getRecipes, getRecipe } from '../services/recipes'
import { getMealPlanEntries } from '../services/mealPlan'
import type { Recipe, IngredientNode } from '../types/recipe'

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function extractIngredientTexts(nodes: IngredientNode[]): string[] {
  return nodes.flatMap(n =>
    n.kind === 'leaf' ? [n.text] : extractIngredientTexts(n.children)
  )
}

type SortOption = 'default' | 'name-asc' | 'name-desc' | 'rating-desc' | 'rating-asc'

const SORT_LABELS: Record<SortOption, string> = {
  'default': 'Nieuwste eerst',
  'name-asc': 'Naam A → Z',
  'name-desc': 'Naam Z → A',
  'rating-desc': 'Hoogste beoordeling',
  'rating-asc': 'Laagste beoordeling',
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12l5 5L20 7" />
    </svg>
  )
}

function FilterSheet({ activeTags, allTags, onChange, onClose }: {
  activeTags: string[]
  allTags: string[]
  onChange: (tags: string[]) => void
  onClose: () => void
}) {
  const [q, setQ] = useState('')
  const filtered = allTags.filter(t => t.toLowerCase().includes(q.toLowerCase()))
  const toggle = (t: string) =>
    onChange(activeTags.includes(t) ? activeTags.filter(x => x !== t) : [...activeTags, t])

  return (
    <>
      <div className="lb-sheet-backdrop" onClick={onClose} />
      <div className="lb-sheet" style={{ paddingBottom: 30 }}>
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}><circle cx="11" cy="11" r="7" /><path d="M16.5 16.5L21 21" strokeLinecap="round" /></svg>
            </div>
            <input className="lb-input" placeholder="Zoek tags" value={q} onChange={e => setQ(e.target.value)}
              style={{ paddingLeft: 40, height: 40 }} autoFocus />
          </div>
        </div>
        <div style={{ padding: '16px 20px 20px', display: 'flex', flexWrap: 'wrap', gap: 8, overflowY: 'auto', flex: 1 }}>
          {filtered.map(t => (
            <button key={t} type="button" className="lb-tag" data-active={activeTags.includes(t) ? 'true' : 'false'}
              onClick={() => toggle(t)} style={{ cursor: 'pointer', gap: activeTags.includes(t) ? 4 : 0 }}>
              {activeTags.includes(t) && <CheckIcon />}
              {t}
            </button>
          ))}
          {filtered.length === 0 && (
            <div style={{ fontSize: 13, color: 'var(--stone)' }}>Geen tags voor "{q}".</div>
          )}
        </div>
        <div style={{ padding: '0 20px 14px', flexShrink: 0 }}>
          <button onClick={onClose} className="lb-btn lb-btn--primary" style={{ width: '100%' }}>Toepassen</button>
        </div>
      </div>
    </>
  )
}

function SortSheet({ sort, onChange, onClose }: {
  sort: SortOption
  onChange: (v: SortOption) => void
  onClose: () => void
}) {
  const opts = (Object.keys(SORT_LABELS) as SortOption[])
  return (
    <>
      <div className="lb-sheet-backdrop" onClick={onClose} />
      <div className="lb-sheet" style={{ paddingBottom: 30 }}>
        <div className="lb-sheet-grabber" />
        <div style={{ padding: '12px 20px 0' }}>
          <h3 className="lb-display" style={{ margin: 0, fontSize: 22 }}>Sorteren</h3>
        </div>
        <div style={{ padding: '14px 12px 16px' }}>
          {opts.map(o => (
            <button key={o} onClick={() => onChange(o)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', padding: '14px 16px', background: 'transparent', border: 0,
              fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--ink)', borderRadius: 12,
              fontWeight: sort === o ? 600 : 400, cursor: 'pointer',
            }}>
              {SORT_LABELS[o]}
              {sort === o && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--bordeaux)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12l5 5L20 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}


export default function RecipesPage() {
  const navigate = useNavigate()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [calendarRecipe, setCalendarRecipe] = useState<Recipe | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [sort, setSort] = useState<SortOption>('default')
  const [showFilters, setShowFilters] = useState(false)
  const [showSort, setShowSort] = useState(false)
  const [todayRecipe, setTodayRecipe] = useState<Recipe | null>(null)

  useEffect(() => {
    const today = toISO(new Date())
    getMealPlanEntries(today, today).then(async entries => {
      const entry = entries.find(e => e.recipeId)
      if (entry?.recipeId) {
        const recipe = await getRecipe(entry.recipeId)
        setTodayRecipe(recipe)
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    getRecipes()
      .then(setRecipes)
      .catch(() => setError('Recepten konden niet worden geladen. Controleer je Firebase-configuratie.'))
      .finally(() => setLoading(false))
  }, [])

  const allTags = [...new Set(recipes.flatMap(r => r.tags))].sort((a, b) => a.localeCompare(b))

  const filtered = recipes.filter(recipe => {
    if (activeTags.length && !activeTags.every(t => recipe.tags.includes(t))) return false
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    if (recipe.title.toLowerCase().includes(q)) return true
    if (recipe.description?.toLowerCase().includes(q)) return true
    return extractIngredientTexts(recipe.ingredients).some(t => t.toLowerCase().includes(q))
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
          <Link to="/calendar" title="Weekmenu"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 22, background: 'var(--paper)', boxShadow: '0 1px 2px rgba(31,29,26,0.04), 0 0 0 0.5px var(--line)', color: 'var(--ink)', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
              <path d="M5 8h14l-1 12a2 2 0 01-2 2H8a2 2 0 01-2-2L5 8zM9 8V6a3 3 0 016 0v2" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Today's menu */}
      {todayRecipe && (
        <div style={{ padding: '20px 20px 0' }}>
          <div className="lb-eyebrow" style={{ marginBottom: 8 }}>Op het menu vandaag</div>
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
                {(todayRecipe.rating ?? 0) > 0 && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2, marginTop: 8 }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg key={i} width="13" height="13" viewBox="0 0 24 24"
                        fill={i < (todayRecipe.rating ?? 0) ? 'var(--bordeaux)' : 'none'}
                        stroke={i < (todayRecipe.rating ?? 0) ? 'var(--bordeaux)' : 'var(--stone-2)'}
                        strokeWidth="1.4">
                        <path d="M12 3l3 6 6.5 1-4.7 4.6 1.1 6.4L12 18l-5.9 3 1.1-6.4L2.5 10 9 9l3-6z" strokeLinejoin="round" />
                      </svg>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Search + filters */}
      <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)', pointerEvents: 'none' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}><circle cx="11" cy="11" r="7" /><path d="M16.5 16.5L21 21" strokeLinecap="round" /></svg>
          </div>
          <input
            className="lb-input"
            placeholder="Zoek recept of ingrediënt"
            style={{ paddingLeft: 42, paddingRight: searchQuery ? 42 : 14 }}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'var(--paper-3)', border: 0, width: 26, height: 26, borderRadius: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-2)', cursor: 'pointer',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          )}
        </div>

        {!loading && !error && recipes.length > 0 && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowFilters(true)} className="lb-btn lb-btn--ghost lb-btn--small"
              style={{ flex: 1, justifyContent: 'space-between', padding: '0 14px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
                  <path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h12M20 18h0M16 18h4" /><circle cx="16" cy="6" r="2" /><circle cx="8" cy="12" r="2" /><circle cx="14" cy="18" r="2" />
                </svg>
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3" />
                </svg>
                {SORT_LABELS[sort]}
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {loading && (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--stone)', fontFamily: 'var(--serif)', fontStyle: 'italic' }}>
          Recepten laden…
        </div>
      )}

      {error && (
        <div style={{ margin: '20px', padding: '14px', background: 'var(--bordeaux-tint)', borderRadius: 12, fontSize: 13, color: 'var(--bordeaux)', borderLeft: '3px solid var(--bordeaux)' }}>
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              Eerste recept toevoegen
            </button>
          )}
        </div>
      )}

      {!loading && !error && sorted.length > 0 && (
        <div style={{ padding: '20px 20px 120px' }}>
          <div className="lb-eyebrow" style={{ marginBottom: 4 }}>{sorted.length} {sorted.length === 1 ? 'RECEPT' : 'RECEPTEN'}</div>
          {sorted.map((r, i) => (
            <RecipeCard
              key={r.id}
              recipe={r}
              variant="default"
              onAddToCalendar={setCalendarRecipe}
              highlightTags={activeTags.length > 0 ? activeTags : undefined}
            />
          ))}
        </div>
      )}

      {/* FAB */}
      <Link
        to="/new"
        style={{
          position: 'fixed', right: 20, bottom: 32,
          height: 44, borderRadius: 22, padding: '0 20px',
          background: 'var(--bordeaux)', color: 'var(--cream-card)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: '0 4px 16px rgba(107, 31, 42, 0.30)',
          zIndex: 50, textDecoration: 'none',
          fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600, letterSpacing: '0.03em',
        }}
        aria-label="Recept toevoegen"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
        Toevoegen
      </Link>

      {showFilters && (
        <FilterSheet activeTags={activeTags} allTags={allTags} onChange={setActiveTags} onClose={() => setShowFilters(false)} />
      )}
      {showSort && (
        <SortSheet sort={sort} onChange={v => { setSort(v); setShowSort(false) }} onClose={() => setShowSort(false)} />
      )}

      {calendarRecipe && (
        <AddToCalendarModal
          recipe={calendarRecipe}
          onClose={() => setCalendarRecipe(null)}
          onSaved={() => setCalendarRecipe(null)}
        />
      )}
    </div>
  )
}
