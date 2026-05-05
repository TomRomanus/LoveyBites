import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { animate, motion, AnimatePresence } from 'framer-motion'
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

const STAR_COUNT = 5
const STAR_PATH = 'M12 3l3 6 6.5 1-4.7 4.6 1.1 6.4L12 18l-5.9 3 1.1-6.4L2.5 10 9 9l3-6z'

function snapToHalf(n: number) {
  return Math.round(n * 2) / 2
}

function Stars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const rowRef    = useRef<HTMLDivElement>(null)
  const starRefs  = useRef<(HTMLDivElement | null)[]>([])
  const isDragging   = useRef(false)
  const committedRef = useRef(value)
  const livePosRef   = useRef(value)
  const onChangeRef  = useRef(onChange)
  onChangeRef.current = onChange

  const [livePos,      setLivePos]      = useState(value)
  const [displayValue, setDisplayValue] = useState(value)
  const [dir,          setDir]          = useState<'up' | 'down'>('up')

  useEffect(() => {
    committedRef.current = value
    livePosRef.current   = value
    setLivePos(value)
    setDisplayValue(value)
  }, [value])

  const posFromX = useCallback((clientX: number) => {
    const rect = rowRef.current?.getBoundingClientRect()
    if (!rect) return 0
    return Math.max(0, Math.min(STAR_COUNT, ((clientX - rect.left) / rect.width) * STAR_COUNT))
  }, [])

  const finishDrag = useCallback(() => {
    if (!isDragging.current) return
    isDragging.current = false
    const snapped = snapToHalf(livePosRef.current)
    const prev    = committedRef.current

    for (let i = 0; i < STAR_COUNT; i++) {
      const el    = starRefs.current[i]
      if (!el) continue
      const prevF = Math.max(0, Math.min(1, prev    - i))
      const newF  = Math.max(0, Math.min(1, snapped - i))
      if (prevF === 0 && newF > 0) {
        animate(el,
          { scale: [0.35, 1.32, 1], rotate: [-18, 6, 0], opacity: [0.2, 1, 1] },
          { duration: 0.38, ease: [0.34, 1.56, 0.64, 1], delay: i * 0.055 }
        )
      } else if (prevF > 0 && newF === 0) {
        animate(el,
          { scale: [1, 0.65, 1] },
          { duration: 0.22, ease: 'easeIn', delay: Math.max(0, (Math.ceil(prev) - i - 1) * 0.035) }
        )
      }
    }

    committedRef.current = snapped
    setDir(snapped >= prev ? 'up' : 'down')
    setDisplayValue(snapped)
    setLivePos(snapped)
    onChangeRef.current?.(snapped)
  }, [])

  const moveHandler = useCallback((clientX: number) => {
    if (!isDragging.current) return
    livePosRef.current = posFromX(clientX)
    setLivePos(livePosRef.current)
  }, [posFromX])

  useEffect(() => {
    const onMM = (e: MouseEvent)  => moveHandler(e.clientX)
    const onTM = (e: TouchEvent)  => { e.preventDefault(); moveHandler(e.touches[0].clientX) }
    window.addEventListener('mousemove', onMM)
    window.addEventListener('touchmove', onTM, { passive: false })
    window.addEventListener('mouseup',   finishDrag)
    window.addEventListener('touchend',  finishDrag)
    return () => {
      window.removeEventListener('mousemove', onMM)
      window.removeEventListener('touchmove', onTM)
      window.removeEventListener('mouseup',   finishDrag)
      window.removeEventListener('touchend',  finishDrag)
    }
  }, [finishDrag, moveHandler])

  const intPart = displayValue > 0 ? String(Math.floor(displayValue)) : ''
  const decPart = displayValue > 0 ? (displayValue % 1 === 0 ? '0' : '5') : ''

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5 }}>
      <div
        ref={rowRef}
        style={{ display: 'flex', gap: 3, cursor: onChange ? 'grab' : 'default', touchAction: 'none', userSelect: 'none' }}
        onMouseDown={onChange ? e => {
          isDragging.current = true
          livePosRef.current = posFromX(e.clientX)
          setLivePos(livePosRef.current)
        } : undefined}
        onTouchStart={onChange ? e => {
          e.preventDefault()
          isDragging.current = true
          livePosRef.current = posFromX(e.touches[0].clientX)
          setLivePos(livePosRef.current)
        } : undefined}
      >
        {Array.from({ length: STAR_COUNT }, (_, i) => {
          const frac = Math.max(0, Math.min(1, livePos - i))
          return (
            <div key={i} ref={el => { starRefs.current[i] = el }}
              style={{ width: 28, height: 28, position: 'relative', flexShrink: 0 }}>
              <svg width="28" height="28" viewBox="0 0 24 24" style={{ position: 'absolute' }}>
                <path d={STAR_PATH} fill="none" stroke="var(--stone-2)" strokeWidth="1.4" strokeLinejoin="round" />
              </svg>
              <svg width="28" height="28" viewBox="0 0 24 24"
                style={{ position: 'absolute', clipPath: `inset(0 ${((1 - frac) * 100).toFixed(1)}% 0 0)`, transition: 'clip-path 0.06s ease' }}>
                <path d={STAR_PATH} fill="var(--bordeaux)" stroke="var(--bordeaux)" strokeWidth="1.4" strokeLinejoin="round" />
              </svg>
            </div>
          )
        })}
      </div>

      {displayValue > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', marginTop: -3, fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 500, letterSpacing: 0, color: 'rgba(107, 31, 42, 0.45)' }}>
          <div style={{ overflow: 'hidden', height: 14, display: 'flex', alignItems: 'center' }}>
            <AnimatePresence mode="popLayout" custom={dir}>
              <motion.span key={`i${intPart}`} custom={dir}
                variants={{
                  enter: (d: string) => ({ y: d === 'up' ? 10 : -10, opacity: 0 }),
                  center: { y: 0, opacity: 1 },
                  exit:  (d: string) => ({ y: d === 'up' ? -10 : 10, opacity: 0 }),
                }}
                initial="enter" animate="center" exit="exit"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                style={{ display: 'block' }}>
                {intPart}
              </motion.span>
            </AnimatePresence>
          </div>
          <span>.</span>
          <div style={{ overflow: 'hidden', height: 14, display: 'flex', alignItems: 'center' }}>
            <AnimatePresence mode="popLayout" custom={dir}>
              <motion.span key={`d${decPart}`} custom={dir}
                variants={{
                  enter: (d: string) => ({ y: d === 'up' ? 10 : -10, opacity: 0 }),
                  center: { y: 0, opacity: 1 },
                  exit:  (d: string) => ({ y: d === 'up' ? -10 : 10, opacity: 0 }),
                }}
                initial="enter" animate="center" exit="exit"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                style={{ display: 'block' }}>
                {decPart}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  )
}

function PortionStepper({ value, onChange, label, dir }: { value: number; onChange: (v: number) => void; label: string; dir: 'up' | 'down' | null }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--paper-2)', borderRadius: 16, padding: 3 }}>
      <button onClick={() => onChange(Math.max(1, value - 1))} style={{ width: 30, height: 30, borderRadius: 13, background: 'var(--cream-card)', border: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.06)', cursor: 'pointer' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><path d="M5 12h14" /></svg>
      </button>
      <div style={{ minWidth: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        <div style={{ overflow: 'hidden', position: 'relative' }}>
          <AnimatePresence mode="popLayout" custom={dir}>
            <motion.span
              key={value}
              custom={dir}
              variants={{
                enter: (d: 'up' | 'down' | null) => ({ y: d === 'up' ? 10 : d === 'down' ? -10 : 0, opacity: 0 }),
                center: { y: 0, opacity: 1 },
                exit: (d: 'up' | 'down' | null) => ({ y: d === 'up' ? -10 : d === 'down' ? 10 : 0, opacity: 0 }),
              }}
              initial="enter" animate="center" exit="exit"
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              style={{ display: 'block' }}
            >
              {value}
            </motion.span>
          </AnimatePresence>
        </div>
        <span>{label}</span>
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
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!id) return
    getRecipe(id).then(r => {
      setRecipe(r)
      if (r) {
        setPortions(r.portions ?? 4)
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', r.color ?? DEFAULT_RECIPE_COLOR)
      }
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
      <div style={{ minHeight: '100dvh', background: 'var(--paper)' }}>
        <div className="lb-skeleton" style={{ height: 185, borderRadius: 0 }} />
        <div style={{ padding: '20px 22px 0' }}>
          <div className="lb-skeleton" style={{ height: 10, width: '30%', marginBottom: 10, borderRadius: 4 }} />
          <div className="lb-skeleton" style={{ height: 34, width: '60%', marginBottom: 10 }} />
          <div className="lb-skeleton" style={{ height: 14, width: '88%', marginBottom: 5 }} />
          <div className="lb-skeleton" style={{ height: 14, width: '70%', marginBottom: 16 }} />
          <div className="lb-skeleton" style={{ height: 20, width: 110 }} />
        </div>
        <div style={{ padding: '20px 22px 0' }}>
          <div className="lb-skeleton" style={{ height: 52, borderRadius: 26 }} />
        </div>
        <div style={{ padding: '28px 22px 0' }}>
          <div className="lb-skeleton" style={{ height: 10, width: '18%', marginBottom: 8, borderRadius: 4 }} />
          <div className="lb-skeleton" style={{ height: 26, width: '42%', marginBottom: 18 }} />
          {[55, 72, 48, 65, 60].map((w, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '0.5px solid var(--line-soft)' }}>
              <div className="lb-skeleton" style={{ width: 22, height: 22, borderRadius: 11, flexShrink: 0 }} />
              <div className="lb-skeleton" style={{ height: 14, width: `${w}%` }} />
            </div>
          ))}
        </div>
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
    <div style={{ minHeight: '100dvh', position: 'relative', background: 'var(--paper)' }}>
      {/* Hero color block */}
      <div className="lb-color-block" style={{
        '--block-bg': color,
        minHeight: 185,
        padding: '24px 22px 24px',
        borderRadius: 0,
        justifyContent: 'flex-start',
      } as React.CSSProperties}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => navigate('/')}
            style={{ width: 36, height: 36, borderRadius: 18, background: 'transparent', border: '0.5px solid rgba(255,250,240,0.45)', color: 'var(--cream-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
          </button>
          <button onClick={() => setShowActions(true)}
            style={{ width: 36, height: 36, borderRadius: 18, background: 'transparent', border: '0.5px solid rgba(255,250,240,0.45)', color: 'var(--cream-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></svg>
          </button>
        </div>
        <div style={{ marginTop: 46 }}>
          <div className="lb-color-block-corner" style={{ marginBottom: 8 }}>RECEPT</div>
          <div className="lb-color-block-title" style={{ fontSize: 34, lineHeight: 1.0, letterSpacing: '-0.025em' }}>{recipe.title}</div>
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
                  <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14, color: 'var(--bordeaux)', marginBottom: 3, fontWeight: 500 }}>
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
                      <motion.span
                        initial={false}
                        animate={{
                          background: isChecked ? 'var(--bordeaux)' : 'transparent',
                          borderColor: isChecked ? 'var(--bordeaux)' : 'var(--stone-2)',
                          scale: isChecked ? [1, 0.82, 1] : 1,
                        }}
                        transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
                        style={{ width: 22, height: 22, borderRadius: 6, border: '1.5px solid', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <motion.path
                            d="M5 12l5 5L20 7"
                            strokeLinecap="round" strokeLinejoin="round"
                            initial={false}
                            animate={{ pathLength: isChecked ? 1 : 0, opacity: isChecked ? 1 : 0 }}
                            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                          />
                        </svg>
                      </motion.span>
                      <span style={{ flex: 1, fontSize: 15, color: isChecked ? 'var(--stone)' : 'var(--ink)', opacity: isChecked ? 0.5 : 1, transitionProperty: 'color, opacity', transition: 'color 0.2s ease, opacity 0.2s ease', overflow: 'hidden', position: 'relative' }}>
                        <AnimatePresence mode="popLayout" custom={portionDir}>
                          <motion.span
                            key={portions}
                            custom={portionDir}
                            variants={{
                              enter: (d: 'up' | 'down' | null) => ({ y: d === 'up' ? 8 : d === 'down' ? -8 : 0, opacity: 0 }),
                              center: { y: 0, opacity: 1 },
                              exit: (d: 'up' | 'down' | null) => ({ y: d === 'up' ? -8 : d === 'down' ? 8 : 0, opacity: 0 }),
                            }}
                            initial="enter" animate="center" exit="exit"
                            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                            style={{ display: 'block', position: 'relative', width: 'fit-content' }}
                          >
                            {item}
                            <motion.span
                              aria-hidden
                              initial={false}
                              animate={{ scaleX: isChecked ? 1 : 0 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                              style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1.5, background: 'currentColor', transformOrigin: 'left', pointerEvents: 'none' }}
                            />
                          </motion.span>
                        </AnimatePresence>
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
                      <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14, color: 'var(--bordeaux)', marginBottom: 3, marginTop: i > 0 ? 20 : 0, fontWeight: 500 }}>
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
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(107,31,42,0.55)', marginBottom: 5 }}>
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
                <span style={{ fontSize: 14, fontStyle: 'italic', fontFamily: 'var(--serif)', color: 'var(--bordeaux)' }}>{s.label || s.url}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      <div style={{ paddingBottom: 100 }} />

      {createPortal(
        <AnimatePresence>
          {showActions && <motion.div
            key="actions-bd"
            className="lb-sheet-backdrop"
            style={{ animation: 'none' }}
            variants={{
              hidden: { opacity: 0, transition: { duration: 0.2 } },
              visible: { opacity: 1, transition: { duration: 0.24 } },
            }}
            initial="hidden" animate="visible" exit="hidden"
            onClick={() => setShowActions(false)}
          />}
          {showActions && <motion.div
            key="actions-sheet"
            className="lb-sheet"
            style={{ animation: 'none', paddingBottom: 30 }}
            variants={{
              hidden: { y: '100%', transition: { type: 'tween', duration: 0.22, ease: [0.4, 0, 1, 1] } },
              visible: { y: 0, transition: { type: 'spring', stiffness: 300, damping: 32 } },
            }}
            initial="hidden" animate="visible" exit="hidden"
          >
            <div className="lb-sheet-grabber" />
            <div style={{ padding: '14px 12px' }}>
              {[
                { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round"><path d="M16 3l5 5-12 12H4v-5L16 3z" /></svg>, label: 'Recept bewerken', action: () => { setShowActions(false); navigate(`/edit/${recipe.id}`) } },
                { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13" /></svg>, label: 'Recept verwijderen', action: () => { setShowActions(false); setConfirmDelete(true) }, destructive: true },
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
          </motion.div>}
        </AnimatePresence>,
        document.body
      )}

      {createPortal(
        <AnimatePresence>
          {confirmDelete && <motion.div
            key="confirm-bd"
            className="lb-sheet-backdrop"
            style={{ animation: 'none', zIndex: 202 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setConfirmDelete(false)}
          />}
          {confirmDelete && <motion.div
            key="confirm-dialog"
            style={{
              position: 'fixed', inset: 0, display: 'flex', alignItems: 'center',
              justifyContent: 'center', padding: '0 24px', zIndex: 203, pointerEvents: 'none',
            }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              style={{ background: 'var(--paper)', borderRadius: 18, padding: 24, width: '100%', pointerEvents: 'auto' }}
              initial={{ scale: 0.92, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
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
            </motion.div>
          </motion.div>}
        </AnimatePresence>,
        document.body
      )}

      {createPortal(
        <AnimatePresence>
          {!calendarOpen && !cookMode && (
            <motion.button
              key="calendar-fab"
              onClick={() => setCalendarOpen(true)}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
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
            </motion.button>
          )}
        </AnimatePresence>,
        document.body
      )}

      {calendarOpen && (
        <AddToCalendarModal recipe={recipe} onClose={() => setCalendarOpen(false)} onSaved={() => setCalendarOpen(false)} />
      )}

    </div>
  )
}
