import { useState, useEffect, useRef } from 'react'
import type { Recipe, IngredientNode as TreeNode } from '../types/recipe'

// ─── Shared helpers (exported for RecipeDetailPage) ───────────────────────────

export interface IngredientListProps {
  nodes: TreeNode[]
  pathPrefix: string
  depth: number
  checked: Set<string>
  onToggle: (path: string) => void
}

export function IngredientList({ nodes, pathPrefix, depth, checked, onToggle }: IngredientListProps) {
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {nodes.map((node, i) => {
        const path = `${pathPrefix}${i}`
        if (node.kind === 'leaf') {
          const isChecked = checked.has(path)
          return (
            <li key={path} onClick={() => onToggle(path)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', userSelect: 'none', padding: '2px 0' }}>
              <span className="lb-check" data-checked={isChecked}>
                {isChecked && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                )}
              </span>
              <span style={{ textDecoration: isChecked ? 'line-through' : 'none', color: isChecked ? 'var(--stone-2)' : 'var(--ink)', fontSize: 15 }}>
                {node.text}
              </span>
            </li>
          )
        }
        return (
          <li key={path}>
            {node.title && (
              <p style={{
                fontFamily: depth === 0 ? 'var(--serif)' : 'var(--mono)',
                fontStyle: depth === 0 ? 'italic' : 'normal',
                fontSize: depth === 0 ? 15 : 10,
                fontWeight: 500,
                color: depth === 0 ? 'var(--bordeaux)' : 'var(--stone)',
                textTransform: depth === 0 ? 'none' : 'uppercase',
                letterSpacing: depth === 0 ? 'normal' : '0.08em',
                marginTop: depth === 0 ? 16 : 12,
                marginBottom: 8,
              }}>
                {node.title}
              </p>
            )}
            <div style={depth > 0 ? { paddingLeft: 12, borderLeft: '0.5px solid var(--line)' } : {}}>
              <IngredientList nodes={node.children} pathPrefix={`${path}.`} depth={depth + 1} checked={checked} onToggle={onToggle} />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export function collectIngredientMap(nodes: TreeNode[]): Map<string, string> {
  const map = new Map<string, string>()
  function traverse(ns: TreeNode[]) {
    for (const node of ns) {
      if (node.kind === 'leaf' && node.id) {
        map.set(node.id, node.text)
      } else if (node.kind === 'group') {
        traverse(node.children)
      }
    }
  }
  traverse(nodes)
  return map
}

// ─── Cook mode types ──────────────────────────────────────────────────────────

interface FlatStep {
  text: string
  sectionTitle?: string
  ingredientRefs?: string[]
  globalIndex: number
}

function flattenSteps(nodes: TreeNode[], sectionTitle?: string, counter = { n: 0 }): FlatStep[] {
  const result: FlatStep[] = []
  for (const node of nodes) {
    if (node.kind === 'leaf') {
      result.push({ text: node.text, sectionTitle, ingredientRefs: node.ingredientRefs, globalIndex: counter.n++ })
    } else {
      result.push(...flattenSteps(node.children, node.title, counter))
    }
  }
  return result
}

// ─── Cook mode view ───────────────────────────────────────────────────────────

type CookTab = 'step' | 'ingredients' | 'overview'

interface CookModeViewProps {
  recipe: Recipe
  scaledIngredients: TreeNode[]
  selectedPortions: number
  onPortionsChange: (p: number) => void
  checked: Set<string>
  onToggle: (path: string) => void
  onClose: () => void
}

export default function CookModeView({
  recipe,
  scaledIngredients,
  selectedPortions,
  onPortionsChange,
  checked,
  onToggle,
  onClose,
}: CookModeViewProps) {
  const ingredientMap = collectIngredientMap(scaledIngredients)
  const steps = flattenSteps(recipe.steps)
  const total = steps.length

  const [isExiting, setIsExiting] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [displayIndex, setDisplayIndex] = useState(0)
  const [stepDir, setStepDir] = useState<'next' | 'prev' | null>(null)
  const [tab, setTab] = useState<CookTab>('step')
  const overviewRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const lockRef = useRef(false)

  useEffect(() => {
    if (tab === 'overview' && overviewRef.current) {
      const active = overviewRef.current.querySelector('[data-active="true"]')
      active?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [tab])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  if (total === 0) return null

  const current = steps[currentIndex]

  function goTo(index: number) {
    const newIndex = Math.max(0, Math.min(total - 1, index))
    if (tab !== 'step' || newIndex === currentIndex) {
      setCurrentIndex(newIndex)
      setDisplayIndex(newIndex)
      setTab('step')
      return
    }
    if (lockRef.current) return
    lockRef.current = true

    const dir = newIndex > currentIndex ? 'next' : 'prev'
    setStepDir(dir)
    setDisplayIndex(newIndex)

    const el = contentRef.current
    if (!el) {
      setCurrentIndex(newIndex)
      lockRef.current = false
      return
    }

    // Slide out
    el.style.transition = 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease'
    el.style.transform = dir === 'next' ? 'translateX(-40px)' : 'translateX(40px)'
    el.style.opacity = '0'

    setTimeout(() => {
      // Snap to incoming position (no transition)
      el.style.transition = 'none'
      el.style.transform = dir === 'next' ? 'translateX(40px)' : 'translateX(-40px)'
      el.style.opacity = '0'
      setCurrentIndex(newIndex)

      // Slide in — double rAF ensures React has rendered and browser has painted the snap
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.transition = 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease'
          el.style.transform = 'translateX(0)'
          el.style.opacity = '1'
          setTimeout(() => {
            el.style.transition = ''
            el.style.transform = ''
            el.style.opacity = ''
            lockRef.current = false
          }, 200)
        })
      })
    }, 200)
  }

  const currentIngredients = (current.ingredientRefs ?? [])
    .map((id) => ingredientMap.get(id))
    .filter((t): t is string => t !== undefined)

  const dark = { background: '#1f1d1a', color: '#f8f4ed' }
  const sectionHeaderColor = '#b8394e'

  function handleClose() {
    setIsExiting(true)
    setTimeout(onClose, 240)
  }

  return (
    <div className={isExiting ? 'lb-modal-exit' : 'lb-modal-enter'} style={{
      height: '100dvh', ...dark, display: 'flex', flexDirection: 'column', userSelect: 'none',
      ...(isExiting && { animation: 'lb-modal-slide-down 220ms cubic-bezier(0.4, 0, 1, 1) both' }),
    }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '20px 20px 14px', flexShrink: 0 }}>
        <button onClick={handleClose} style={{
          background: 'transparent',
          border: '0.5px solid rgba(248,244,237,0.38)',
          color: '#f8f4ed',
          width: 36, height: 36, borderRadius: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <div style={{ flex: 1, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(248,244,237,0.5)' }}>
          Kookmodus
        </div>
        <div style={{ width: 36 }} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 4, padding: '0 20px 8px', flexShrink: 0 }}>
        {([['step', 'Instructies'], ['ingredients', 'Ingrediënten'], ['overview', 'Overzicht']] as const).map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)} style={{
            background: tab === v ? 'rgba(248,244,237,0.12)' : 'transparent',
            color: tab === v ? '#f8f4ed' : 'rgba(248,244,237,0.5)',
            border: 0, padding: '8px 14px', borderRadius: 16, fontSize: 13, fontWeight: 500, cursor: 'pointer',
            fontFamily: 'var(--sans)',
          }}>{l}</button>
        ))}
      </div>

      {/* ── Step content ── */}
      {tab === 'step' && (
        <div style={{ flex: 1, overflow: 'hidden', minHeight: 0, position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div ref={contentRef}>

            {/* Prev step */}
            {steps[currentIndex - 1] && (
              <>
                <button onClick={() => goTo(currentIndex - 1)} style={{
                  display: 'block', width: '100%', padding: '0 22px',
                  background: 'transparent', border: 0, cursor: 'pointer', textAlign: 'left',
                  opacity: 0.3, marginBottom: 24,
                }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#f8f4ed', marginBottom: 6 }}>
                    ← Vorige
                  </div>
                  <div style={{
                    fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 18, lineHeight: 1.35, color: '#f8f4ed',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  } as React.CSSProperties}>
                    {steps[currentIndex - 1].text}
                  </div>
                </button>
                <div style={{ height: '0.5px', margin: '0 22px 24px', background: 'rgba(248,244,237,0.1)' }} />
              </>
            )}

            {/* Current step */}
            <div style={{ padding: '0 22px' }}>
              {current.sectionTitle && (
                <>
                  <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14, color: sectionHeaderColor, fontWeight: 500, marginBottom: 3 }}>
                    {current.sectionTitle}
                  </div>
                  <div style={{ width: 22, height: 1.5, background: sectionHeaderColor, borderRadius: 1, opacity: 0.6, marginBottom: 10 }} />
                </>
              )}
              {currentIngredients.length > 0 && (
                <div style={{ fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'rgba(243,222,224,0.5)', marginBottom: 10 }}>
                  {currentIngredients.join(' · ')}
                </div>
              )}
              <div style={{ fontFamily: 'var(--serif)', fontWeight: 500, fontSize: 28, letterSpacing: '-0.02em', lineHeight: 1.25, color: '#f8f4ed' }}>
                {current.text}
              </div>
            </div>

            {/* Next step */}
            {steps[currentIndex + 1] && (
              <>
                <div style={{ height: '0.5px', margin: '24px 22px 24px', background: 'rgba(248,244,237,0.1)' }} />
                <button onClick={() => goTo(currentIndex + 1)} style={{
                  display: 'block', width: '100%', padding: '0 22px',
                  background: 'transparent', border: 0, cursor: 'pointer', textAlign: 'left',
                  opacity: 0.3,
                }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#f8f4ed', marginBottom: 6 }}>
                    Volgende →
                  </div>
                  <div style={{
                    fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 18, lineHeight: 1.35, color: '#f8f4ed',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  } as React.CSSProperties}>
                    {steps[currentIndex + 1].text}
                  </div>
                </button>
              </>
            )}
          </div>

          {/* Gradient fades */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 48, background: 'linear-gradient(to bottom, #1f1d1a, transparent)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'linear-gradient(to top, #1f1d1a, transparent)', pointerEvents: 'none' }} />
        </div>
      )}

      {/* ── Ingredients & Overview ── */}
      {tab !== 'step' && (
        <div style={{ flex: 1, overflow: 'auto', paddingBottom: 40 }}>

          {tab === 'ingredients' && (
            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div className="lb-eyebrow" style={{ color: 'rgba(248,244,237,0.5)' }}>INGREDIËNTEN</div>
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(248,244,237,0.1)', borderRadius: 16, padding: 3 }}>
                  <button onClick={() => onPortionsChange(Math.max(1, selectedPortions - 1))} style={{
                    width: 28, height: 28, borderRadius: 12, background: 'rgba(248,244,237,0.1)', border: 0,
                    color: '#f8f4ed', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><path d="M5 12h14" /></svg>
                  </button>
                  <div style={{ minWidth: 36, textAlign: 'center', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: '#f8f4ed' }}>
                    {selectedPortions}
                  </div>
                  <button onClick={() => onPortionsChange(selectedPortions + 1)} style={{
                    width: 28, height: 28, borderRadius: 12, background: 'rgba(248,244,237,0.1)', border: 0,
                    color: '#f8f4ed', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                  </button>
                </div>
              </div>
              {scaledIngredients.flatMap((node, ni) => {
                if (node.kind === 'group') {
                  return [
                    node.title ? (
                      <div key={`h${ni}`} style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--bordeaux-soft)', fontSize: 14, marginBottom: 8, marginTop: ni > 0 ? 16 : 0 }}>
                        {node.title}
                      </div>
                    ) : null,
                    ...node.children.filter(c => c.kind === 'leaf').map((c, ci) => {
                      if (c.kind !== 'leaf') return null
                      const k = `${ni}-${ci}`
                      const isChecked = checked.has(k)
                      return (
                        <button key={k} onClick={() => onToggle(k)} style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', width: '100%',
                          background: 'transparent', border: 0, borderBottom: '0.5px solid rgba(248,244,237,0.08)',
                          color: isChecked ? 'rgba(248,244,237,0.4)' : '#f8f4ed',
                          textDecoration: isChecked ? 'line-through' : 'none', textAlign: 'left', cursor: 'pointer',
                        }}>
                          <span style={{
                            width: 22, height: 22, borderRadius: 6,
                            border: '1.5px solid ' + (isChecked ? 'transparent' : 'rgba(248,244,237,0.4)'),
                            background: isChecked ? 'var(--bordeaux)' : 'transparent',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            {isChecked && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>}
                          </span>
                          <span style={{ fontSize: 15, flex: 1 }}>{c.text}</span>
                        </button>
                      )
                    }),
                  ].filter(Boolean)
                }
                if (node.kind === 'leaf') {
                  const k = `root-${ni}`
                  const isChecked = checked.has(k)
                  return [(
                    <button key={k} onClick={() => onToggle(k)} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', width: '100%',
                      background: 'transparent', border: 0, borderBottom: '0.5px solid rgba(248,244,237,0.08)',
                      color: isChecked ? 'rgba(248,244,237,0.4)' : '#f8f4ed',
                      textDecoration: isChecked ? 'line-through' : 'none', textAlign: 'left', cursor: 'pointer',
                    }}>
                      <span style={{
                        width: 22, height: 22, borderRadius: 6,
                        border: '1.5px solid ' + (isChecked ? 'transparent' : 'rgba(248,244,237,0.4)'),
                        background: isChecked ? 'var(--bordeaux)' : 'transparent',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        {isChecked && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>}
                      </span>
                      <span style={{ fontSize: 15, flex: 1 }}>{node.text}</span>
                    </button>
                  )]
                }
                return []
              })}
            </div>
          )}

          {tab === 'overview' && (
            <div ref={overviewRef} style={{ padding: '20px 24px' }}>
              <div className="lb-eyebrow" style={{ color: 'rgba(248,244,237,0.5)', marginBottom: 14 }}>
                ALLE STAPPEN · TIK OM TE SPRINGEN
              </div>
              {steps.map((s, i) => (
                <button key={i} data-active={i === currentIndex} onClick={() => { setCurrentIndex(i); setTab('step') }} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 0', width: '100%',
                  background: 'transparent', border: 0, borderBottom: '0.5px solid rgba(248,244,237,0.08)',
                  color: '#f8f4ed', textAlign: 'left', cursor: 'pointer',
                }}>
                  <span style={{
                    fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 22,
                    color: i === currentIndex ? 'var(--bordeaux-soft)' : 'rgba(248,244,237,0.5)',
                    minWidth: 28,
                  }}>{i + 1}</span>
                  <div style={{ flex: 1, fontSize: 15, lineHeight: 1.45, opacity: i === currentIndex ? 1 : 0.85 }}>
                    {s.sectionTitle && <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'rgba(248,244,237,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{s.sectionTitle}</div>}
                    {s.text}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bottom controls — step view only */}
      {tab === 'step' && (
        <div style={{ padding: '20px 20px 36px', flexShrink: 0 }}>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(248,244,237,0.3)', overflow: 'hidden' }}>
              STAP{' '}
              <span key={displayIndex} className={stepDir === 'next' ? 'lb-num-right' : stepDir === 'prev' ? 'lb-num-left' : ''} style={{ display: 'inline-block', animationDuration: '200ms' }}>
                {displayIndex + 1}
              </span>
              {' '}VAN {total}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 20, alignItems: 'center' }}>
            {Array.from({ length: total }).map((_, i) => (
              <div key={i} style={{
                width: i === displayIndex ? 18 : 5,
                height: 5,
                borderRadius: 3,
                background: i < displayIndex
                  ? 'rgba(248,244,237,0.34)'
                  : i === displayIndex
                    ? '#f3dee0'
                    : 'rgba(248,244,237,0.13)',
                transition: 'width 0.2s ease, background 0.2s ease',
              }} />
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => goTo(currentIndex - 1)} disabled={currentIndex === 0} style={{
              width: 52, height: 52, borderRadius: 26,
              background: 'transparent',
              border: `0.5px solid ${currentIndex === 0 ? 'rgba(248,244,237,0.15)' : 'rgba(248,244,237,0.38)'}`,
              color: currentIndex === 0 ? 'rgba(248,244,237,0.25)' : '#f8f4ed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: currentIndex === 0 ? 'default' : 'pointer',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              onClick={() => currentIndex < total - 1 ? goTo(currentIndex + 1) : undefined}
              disabled={currentIndex === total - 1}
              style={{
                flex: 1, height: 52, borderRadius: 26, background: 'var(--bordeaux)', border: 0,
                color: '#f8f4ed', fontSize: 16, fontWeight: 500, fontFamily: 'var(--sans)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                cursor: currentIndex < total - 1 ? 'pointer' : 'default',
                opacity: currentIndex === total - 1 ? 0.5 : 1,
              }}>
              {currentIndex < total - 1 ? (
                <>Volgende stap <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg></>
              ) : 'Klaar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
