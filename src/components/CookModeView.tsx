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

  const [currentIndex, setCurrentIndex] = useState(0)
  const [tab, setTab] = useState<CookTab>('step')
  const overviewRef = useRef<HTMLDivElement>(null)

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

  const prev = steps[currentIndex - 1]
  const current = steps[currentIndex]
  const next = steps[currentIndex + 1]

  function goTo(index: number) {
    setCurrentIndex(Math.max(0, Math.min(total - 1, index)))
    setTab('step')
  }

  const currentIngredients = (current.ingredientRefs ?? [])
    .map((id) => ingredientMap.get(id))
    .filter((t): t is string => t !== undefined)

  const dark = { background: '#1f1d1a', color: '#f8f4ed' }
  const muted = 'rgba(248,244,237,0.55)'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, ...dark, display: 'flex', flexDirection: 'column', userSelect: 'none' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '54px 20px 14px' }}>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.1)', border: 0, color: '#f8f4ed',
          width: 40, height: 40, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', color: 'rgba(248,244,237,0.6)', textTransform: 'uppercase' }}>
          Kookmodus · scherm blijft aan
        </div>
        <div style={{ width: 40 }} />
      </div>

      {/* Tab row */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 4, padding: '0 20px 8px' }}>
        {([['step', 'Stappen'], ['ingredients', 'Ingrediënten'], ['overview', 'Overzicht']] as const).map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)} style={{
            background: tab === v ? 'rgba(248,244,237,0.12)' : 'transparent',
            color: tab === v ? '#f8f4ed' : 'rgba(248,244,237,0.5)',
            border: 0, padding: '8px 14px', borderRadius: 16, fontSize: 13, fontWeight: 500, cursor: 'pointer',
            fontFamily: 'var(--sans)',
          }}>{l}</button>
        ))}
      </div>

      {/* Content area */}
      <div style={{ flex: 1, overflow: 'auto', paddingBottom: tab === 'step' ? 120 : 40 }}>
        {/* ── Step view ── */}
        {tab === 'step' && (
          <div style={{ padding: '24px 28px 0', display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Previous peek */}
            {prev ? (
              <button onClick={() => goTo(currentIndex - 1)} style={{
                textAlign: 'left', background: 'rgba(248,244,237,0.04)', border: 0, borderRadius: 14,
                padding: '12px 14px', color: muted, cursor: 'pointer',
              }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4, opacity: 0.7 }}>
                  ← STAP {currentIndex} · VORIGE
                </div>
                <div style={{
                  fontSize: 13, lineHeight: 1.4, fontFamily: 'var(--serif)', fontStyle: 'italic',
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                } as React.CSSProperties}>
                  {prev.text}
                </div>
              </button>
            ) : <div style={{ height: 8 }} />}

            {/* Current step */}
            <div style={{ background: 'rgba(248,244,237,0.04)', borderRadius: 18, padding: '22px 24px', border: '0.5px solid rgba(248,244,237,0.10)' }}>
              {current.sectionTitle && (
                <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14, color: 'var(--bordeaux-soft)', marginBottom: 10 }}>
                  {current.sectionTitle}
                </div>
              )}
              {currentIngredients.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {currentIngredients.map((text, j) => (
                    <span key={j} style={{
                      fontSize: 12, background: 'rgba(243,222,224,0.15)', color: 'var(--bordeaux-soft)',
                      border: '1px solid rgba(243,222,224,0.25)', borderRadius: 20, padding: '3px 10px',
                    }}>{text}</span>
                  ))}
                </div>
              )}
              <div className="lb-eyebrow" style={{ color: 'rgba(248,244,237,0.5)' }}>STAP {currentIndex + 1} VAN {total}</div>
              <div className="lb-display" style={{ marginTop: 14, fontSize: 28, color: '#f8f4ed', lineHeight: 1.3 }}>
                {current.text}
              </div>
            </div>

            {/* Next peek */}
            {next ? (
              <button onClick={() => goTo(currentIndex + 1)} style={{
                textAlign: 'left', background: 'rgba(248,244,237,0.04)', border: 0, borderRadius: 14,
                padding: '12px 14px', color: muted, cursor: 'pointer',
              }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4, opacity: 0.7 }}>
                  STAP {currentIndex + 2} · VOLGENDE →
                </div>
                <div style={{
                  fontSize: 13, lineHeight: 1.4, fontFamily: 'var(--serif)', fontStyle: 'italic',
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                } as React.CSSProperties}>
                  {next.text}
                </div>
              </button>
            ) : null}
          </div>
        )}

        {/* ── Ingredients view ── */}
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

        {/* ── Overview view ── */}
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

      {/* Bottom controls (step view only) */}
      {tab === 'step' && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '16px 20px 36px',
          background: 'linear-gradient(to top, #1f1d1a 70%, transparent)',
        }}>
          <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
            {Array.from({ length: total }).map((_, i) => (
              <div key={i} style={{
                flex: 1, height: 3, borderRadius: 2,
                background: i <= currentIndex ? 'var(--bordeaux-soft)' : 'rgba(248,244,237,0.15)',
                transition: 'background 0.2s',
              }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => goTo(currentIndex - 1)} disabled={currentIndex === 0} style={{
              width: 56, height: 56, borderRadius: 28,
              background: 'rgba(248,244,237,0.1)', border: 0,
              color: currentIndex === 0 ? 'rgba(248,244,237,0.3)' : '#f8f4ed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentIndex === 0 ? 'default' : 'pointer',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              onClick={() => currentIndex < total - 1 ? goTo(currentIndex + 1) : onClose()}
              style={{
                flex: 1, height: 56, borderRadius: 28, background: 'var(--bordeaux)', border: 0,
                color: '#f8f4ed', fontSize: 16, fontWeight: 500, fontFamily: 'var(--sans)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer',
              }}>
              {currentIndex < total - 1 ? (
                <>Volgende stap <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg></>
              ) : 'Klaar · Sluiten'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
