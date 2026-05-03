import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import RecipeCard from '../components/RecipeCard'
import AddToCalendarModal from '../components/AddToCalendarModal'
import { getRecipes } from '../services/recipes'
import type { Recipe, IngredientNode } from '../types/recipe'

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

function todayLabel() {
  const d = new Date()
  const dag = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'][d.getDay()]
  const maand = ['JAN', 'FEB', 'MRT', 'APR', 'MEI', 'JUN', 'JUL', 'AUG', 'SEP', 'OKT', 'NOV', 'DEC'][d.getMonth()]
  return `${dag.toUpperCase().slice(0, 2)} ${d.getDate()} ${maand}`
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
      <div style={{ padding: '60px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div className="lb-eyebrow">EDITIE I · {todayLabel()}</div>
          <Link to="/calendar" title="Weekmenu"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 22, background: 'var(--paper)', boxShadow: '0 1px 2px rgba(31,29,26,0.04), 0 0 0 0.5px var(--line)', color: 'var(--ink)', marginTop: -6 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
              <path d="M5 8h14l-1 12a2 2 0 01-2 2H8a2 2 0 01-2-2L5 8zM9 8V6a3 3 0 016 0v2" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
        <h1 style={{ margin: '8px 0 0', fontSize: 42, lineHeight: 1.05, fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--ink)', whiteSpace: 'nowrap' }}>
          <span style={{ fontStyle: 'italic' }}>Jouw</span>{' '}
          <span style={{ fontFamily: 'var(--sans)', fontStyle: 'normal', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--bordeaux)' }}>boek</span>
        </h1>
      </div>

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
        <div style={{ padding: '20px 20px 120px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="lb-eyebrow">{sorted.length} {sorted.length === 1 ? 'RECEPT' : 'RECEPTEN'}</div>
          {sorted.map((r, i) => (
            <RecipeCard
              key={r.id}
              recipe={r}
              variant={i === 0 ? 'feature' : 'default'}
              onAddToCalendar={setCalendarRecipe}
            />
          ))}
        </div>
      )}

      {/* FAB */}
      <Link
        to="/new"
        style={{
          position: 'fixed', right: 24, bottom: 100, width: 56, height: 56, borderRadius: 28,
          background: 'var(--bordeaux)', color: 'var(--cream-card)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(107, 31, 42, 0.35)',
          zIndex: 50, textDecoration: 'none',
        }}
        aria-label="Recept toevoegen"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
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
