import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate } from 'react-router-dom'
import { getRecipe, deleteRecipe, updateRecipe } from '../services/recipes'
import type { Recipe } from '../types/recipe'
import { scaleIngredients } from '../utils/scaleIngredient'
import CookModeView, { collectIngredientMap } from '../components/CookModeView'
import AddToCalendarModal from '../components/AddToCalendarModal'
import { DEFAULT_RECIPE_COLOR, flattenIngredientSections, flattenSteps } from '../utils/recipeDisplay'

function scaleItem(text: string, ratio: number): string {
  if (ratio === 1) return text
  const m = text.match(/^(\d+(?:\.\d+)?(?:\/\d+)?)\s*(.+)/)
  if (!m) return text
  let num: number
  if (m[1].includes('/')) {
    const [a, b] = m[1].split('/').map(Number)
    num = a / b
  } else {
    num = parseFloat(m[1])
  }
  const scaled = num * ratio
  let display: string
  if (scaled >= 10) display = String(Math.round(scaled))
  else if (Number.isInteger(scaled)) display = String(scaled)
  else display = scaled.toFixed(1).replace(/\.0$/, '')
  return display + ' ' + m[2]
}

function Stars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const dim = 20
  return (
    <div className="lb-stars" data-size="md">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < value
        return (
          <button key={i} type="button"
            onClick={onChange ? () => onChange(i + 1 === value ? 0 : i + 1) : undefined}
            disabled={!onChange}
            style={{ cursor: onChange ? 'pointer' : 'default', width: dim, height: dim, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 0, padding: 0 }}>
            <svg width={dim} height={dim} viewBox="0 0 24 24"
              fill={filled ? 'var(--bordeaux)' : 'none'}
              stroke={filled ? 'var(--bordeaux)' : 'var(--stone-2)'} strokeWidth="1.4">
              <path d="M12 3l3 6 6.5 1-4.7 4.6 1.1 6.4L12 18l-5.9 3 1.1-6.4L2.5 10 9 9l3-6z" strokeLinejoin="round" />
            </svg>
          </button>
        )
      })}
    </div>
  )
}

function PortionStepper({ value, onChange, label, dir }: { value: number; onChange: (v: number) => void; label: string; dir: 'up' | 'down' | null }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--paper-2)', borderRadius: 16, padding: 3 }}>
      <button onClick={() => onChange(Math.max(1, value - 1))} style={{ width: 30, height: 30, borderRadius: 13, background: 'var(--cream-card)', border: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.06)', cursor: 'pointer' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><path d="M5 12h14" /></svg>
      </button>
      <div style={{ minWidth: 72, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink)', letterSpacing: '0.08em', textTransform: 'uppercase', overflow: 'hidden' }}>
        <span key={value} className={dir ? (dir === 'up' ? 'lb-num-up' : 'lb-num-down') : ''} style={{ display: 'inline-block' }}>
          {value} {label}
        </span>
      </div>
      <button onClick={() => onChange(value + 1)} style={{ width: 30, height: 30, borderRadius: 13, background: 'var(--cream-card)', border: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.06)', cursor: 'pointer' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
      </button>
    </div>
  )
}

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [portions, setPortions] = useState(4)
  const [portionDir, setPortionDir] = useState<'up' | 'down' | null>(null)

  function handlePortionChange(v: number) {
    setPortionDir(v > portions ? 'up' : 'down')
    setPortions(v)
  }
  const [cookMode, setCookMode] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [actionsClosing, setActionsClosing] = useState(false)

  function closeActions() {
    setActionsClosing(true)
    setTimeout(() => { setShowActions(false); setActionsClosing(false) }, 260)
  }
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!id) return
    getRecipe(id).then(r => {
      setRecipe(r)
      if (r) setPortions(r.portions ?? 4)
    }).finally(() => setLoading(false))
  }, [id])

  // Wake lock while viewing recipe
  useEffect(() => {
    if (!recipe) return
    let wakeLock: WakeLockSentinel | null = null
    async function acquire() {
      try {
        if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen')
      } catch { /* non-critical */ }
    }
    function onVisChange() { if (document.visibilityState === 'visible') acquire() }
    acquire()
    document.addEventListener('visibilitychange', onVisChange)
    return () => { document.removeEventListener('visibilitychange', onVisChange); wakeLock?.release() }
  }, [recipe])

  function toggleCheck(key: string) {
    setChecked(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n })
  }

  async function handleRating(rating: number) {
    if (!id || !recipe) return
    await updateRecipe(id, { rating })
    setRecipe({ ...recipe, rating })
  }

  async function handleDelete() {
    if (!id) return
    setDeleting(true)
    await deleteRecipe(id)
    navigate('/')
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', color: 'var(--stone)', fontFamily: 'var(--serif)', fontStyle: 'italic' }}>
        Laden…
      </div>
    )
  }

  if (!recipe) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <p style={{ color: 'var(--stone)', fontFamily: 'var(--serif)', fontStyle: 'italic' }}>Recept niet gevonden.</p>
        <button onClick={() => navigate('/')} className="lb-btn lb-btn--ghost" style={{ marginTop: 16 }}>← Terug</button>
      </div>
    )
  }

  const color = recipe.color ?? DEFAULT_RECIPE_COLOR
  const ratio = portions / (recipe.portions ?? 4)
  const scaledIngredients = scaleIngredients(recipe.ingredients, ratio)
  const ingredientSections = flattenIngredientSections(scaledIngredients)
  const stepSections = flattenSteps(recipe.steps)
  const ingredientMap = collectIngredientMap(scaledIngredients)

  if (cookMode) {
    return (
      <CookModeView
        recipe={recipe}
        scaledIngredients={scaledIngredients}
        selectedPortions={portions}
        onPortionsChange={setPortions}
        checked={checked}
        onToggle={toggleCheck}
        onClose={() => setCookMode(false)}
      />
    )
  }

  return (
    <div className="lb-paper" style={{ minHeight: '100dvh', position: 'relative' }}>
      {/* Hero color block */}
      <div style={{ position: 'relative' }}>
        <div className="lb-color-block" style={{
          '--block-bg': color,
          minHeight: 185,
          padding: '24px 22px 24px',
          borderRadius: 0,
          justifyContent: 'flex-start',
        } as React.CSSProperties}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1, position: 'relative' }}>
            <button onClick={() => navigate('/')}
              style={{ width: 36, height: 36, borderRadius: 18, background: 'transparent', border: '0.5px solid rgba(255,250,240,0.45)', color: 'var(--cream-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
            </button>
            <button onClick={() => setShowActions(true)}
              style={{ width: 36, height: 36, borderRadius: 18, background: 'transparent', border: '0.5px solid rgba(255,250,240,0.45)', color: 'var(--cream-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></svg>
            </button>
          </div>
          <div style={{ zIndex: 1, position: 'relative', marginTop: 46 }}>
            <div className="lb-color-block-corner" style={{ marginBottom: 8 }}>RECEPT</div>
            <div className="lb-color-block-title" style={{ fontSize: 34, lineHeight: 1.0, letterSpacing: '-0.025em' }}>{recipe.title}</div>
          </div>
        </div>
      </div>

      {/* Tags + description + rating */}
      <div style={{ padding: '20px 22px 0' }}>
        {recipe.tags.length > 0 && (
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12, color: 'var(--stone)' }}>
            {recipe.tags.map((t, i) => (
              <span key={t}>
                {i > 0 && <span> · </span>}
                <span>{t}</span>
              </span>
            ))}
          </div>
        )}
        {recipe.description && (
          <p style={{ margin: '0 0 14px', color: 'var(--ink-2)', fontSize: 15, lineHeight: 1.55 }}>
            {recipe.description}
          </p>
        )}
        <Stars value={recipe.rating ?? 0} onChange={handleRating} />
      </div>

      {/* Cook mode CTA */}
      <div style={{ padding: '20px 22px 0' }}>
        <button onClick={() => setCookMode(true)} className="lb-btn lb-btn--primary" style={{ width: '100%', height: 52, borderRadius: 26, fontSize: 16 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M7 4v16l13-8L7 4z" /></svg>
          Start kookmodus
        </button>
      </div>

      {/* Ingredients */}
      {ingredientSections.some(s => s.items.length > 0) && (
        <div style={{ padding: '28px 22px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div className="lb-eyebrow">DEEL I</div>
              <h2 style={{ margin: '4px 0 0', fontSize: 24, fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.05 }}>
                Ingrediënten
              </h2>
            </div>
            <PortionStepper value={portions} onChange={handlePortionChange} label={recipe.portionsLabel || 'pers'} dir={portionDir} />
          </div>

          {ingredientSections.map((sec, si) => (
            <div key={si} style={{ marginBottom: 16 }}>
              {sec.section && (
                <>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 14, color: 'var(--bordeaux)', marginBottom: 3, fontWeight: 500 }}>
                    {sec.section}
                  </div>
                  <div style={{ width: 22, height: 1.5, background: 'var(--bordeaux)', borderRadius: 1, opacity: 0.55, marginBottom: 8 }} />
                </>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {sec.items.map((item, ii) => {
                  const key = `${si}-${ii}`
                  const isChecked = checked.has(key)
                  return (
                    <button key={ii} onClick={() => toggleCheck(key)} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                      background: 'transparent', border: 0, textAlign: 'left',
                      borderBottom: '0.5px solid var(--line-soft)', cursor: 'pointer',
                    }}>
                      <span className="lb-check" data-checked={isChecked ? 'true' : 'false'}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </span>
                      <span style={{ flex: 1, fontSize: 15, color: isChecked ? 'var(--stone)' : 'var(--ink)', textDecoration: isChecked ? 'line-through' : 'none', opacity: isChecked ? 0.5 : 1, transitionProperty: 'color, opacity', transition: 'color 0.2s ease, opacity 0.2s ease', overflow: 'hidden' }}>
                        <span key={portions} className={portionDir ? (portionDir === 'up' ? 'lb-num-up' : 'lb-num-down') : ''} style={{ display: 'inline' }}>
                          {item}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Steps */}
      {stepSections.length > 0 && (
        <div style={{ padding: '28px 22px 0' }}>
          <div className="lb-eyebrow">DEEL II</div>
          <h2 style={{ margin: '4px 0 16px', fontSize: 24, fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.05 }}>
            Instructies
          </h2>
          {(() => {
            let num = 0
            let prevPhase = ''
            return stepSections.map((step, i) => {
              num++
              const showPhase = step.phase !== prevPhase
              if (showPhase) prevPhase = step.phase
              return (
                <div key={i}>
                  {showPhase && step.phase && (
                    <>
                      <div style={{ fontFamily: 'var(--serif)', fontSize: 14, color: 'var(--bordeaux)', marginBottom: 3, marginTop: i > 0 ? 20 : 0, fontWeight: 500 }}>
                        {step.phase}
                      </div>
                      <div style={{ width: 22, height: 1.5, background: 'var(--bordeaux)', borderRadius: 1, opacity: 0.55, marginBottom: 8 }} />
                    </>
                  )}
                  <div style={{ display: 'flex', gap: 14, padding: '8px 0', borderBottom: '0.5px solid var(--line-soft)' }}>
                    <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 22, color: 'var(--bordeaux)', fontWeight: 500, width: 22, flexShrink: 0, lineHeight: 1.1, paddingTop: 1 }}>
                      {num}
                    </div>
                    <div style={{ flex: 1 }}>
                      {step.ingredientRefs && step.ingredientRefs.length > 0 && (
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(107,31,42,0.55)', marginBottom: 5 }}>
                          {step.ingredientRefs.map(id => ingredientMap.get(id) ?? id).join(' · ')}
                        </div>
                      )}
                      <div style={{ fontSize: 15, color: 'var(--ink)', lineHeight: 1.55 }}>{step.text}</div>
                    </div>
                  </div>
                </div>
              )
            })
          })()}
        </div>
      )}

      {/* Sources */}
      {(recipe.sources ?? []).length > 0 && (
        <div style={{ padding: '28px 22px 0' }}>
          <div className="lb-eyebrow">DEEL III</div>
          <h2 style={{ margin: '4px 0 16px', fontSize: 24, fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.05 }}>
            Bronnen
          </h2>
          <div style={{ marginTop: 0 }}>
            {(recipe.sources ?? []).map((s, i) => (
              <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                color: 'var(--ink)', textDecoration: 'none', borderBottom: '0.5px solid var(--line-soft)',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--bordeaux)" strokeWidth={1.6}><path d="M10 14a4 4 0 005.66 0l3-3a4 4 0 00-5.66-5.66l-1 1" /><path d="M14 10a4 4 0 00-5.66 0l-3 3a4 4 0 005.66 5.66l1-1" /></svg>
                <span style={{ fontSize: 14, fontStyle: 'italic', fontFamily: 'var(--serif)' }}>{s.label || s.url}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      <div style={{ paddingBottom: 100 }} />

      {showActions && createPortal(
        <>
          <div className={`lb-sheet-backdrop${actionsClosing ? ' lb-sheet-backdrop--exit' : ''}`} onClick={closeActions} />
          <div className={`lb-sheet${actionsClosing ? ' lb-sheet--exit' : ''}`} style={{ paddingBottom: 30 }}>
            <div className="lb-sheet-grabber" />
            <div style={{ padding: '14px 12px' }}>
              {[
                { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round"><path d="M16 3l5 5-12 12H4v-5L16 3z" /></svg>, label: 'Recept bewerken', action: () => { closeActions(); navigate(`/edit/${recipe.id}`) } },
                { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13" /></svg>, label: 'Recept verwijderen', action: () => { closeActions(); setConfirmDelete(true) }, destructive: true },
              ].map((item, i) => (
                <button key={i} onClick={item.action} style={{
                  display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                  padding: '14px 16px', background: 'transparent', border: 0, borderRadius: 12,
                  color: item.destructive ? 'var(--bordeaux)' : 'var(--ink)',
                  fontSize: 15, fontWeight: 500, cursor: 'pointer',
                }}>
                  {item.icon} {item.label}
                </button>
              ))}
            </div>
          </div>
        </>,
        document.body
      )}

      {confirmDelete && createPortal(
        <>
          <div className="lb-sheet-backdrop" onClick={() => setConfirmDelete(false)} />
          <div className="lb-pop-in" style={{
            position: 'fixed', top: '50%', left: 24, right: 24,
            transform: 'translateY(-50%)', background: 'var(--paper)',
            borderRadius: 18, padding: 24, zIndex: 202,
          }}>
            <h3 className="lb-display" style={{ margin: 0, fontSize: 22, textAlign: 'center' }}>Dit recept verwijderen?</h3>
            <p style={{ margin: '10px 0 22px', textAlign: 'center', fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.5 }}>
              "{recipe.title}" wordt uit ons kookboek gehaald.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmDelete(false)} className="lb-btn lb-btn--ghost" style={{ flex: 1 }}>Annuleren</button>
              <button onClick={handleDelete} disabled={deleting} className="lb-btn lb-btn--primary" style={{ flex: 1 }}>
                {deleting ? <span className="lb-spinner" /> : 'Verwijderen'}
              </button>
            </div>
          </div>
        </>,
        document.body
      )}

      {createPortal(
        <button
          onClick={() => setCalendarOpen(true)}
          style={{
            position: 'fixed', bottom: 'max(28px, env(safe-area-inset-bottom))', right: 22,
            width: 52, height: 52, borderRadius: 26,
            background: 'var(--bordeaux)', color: 'var(--cream-card)',
            border: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(107,31,42,0.35)',
            cursor: 'pointer', zIndex: 90,
          }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
            <rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" />
          </svg>
        </button>,
        document.body
      )}

      {calendarOpen && (
        <AddToCalendarModal recipe={recipe} onClose={() => setCalendarOpen(false)} onSaved={() => setCalendarOpen(false)} />
      )}
    </div>
  )
}
