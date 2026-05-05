import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
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
  const [stepDir, setStepDir] = useState<'next' | 'prev' | null>(null)
  const [tab, setTab] = useState<CookTab>('step')
  const [portionDir, setPortionDir] = useState<'up' | 'down' | null>(null)
  const overviewRef = useRef<HTMLDivElement>(null)

  function handlePortionsChange(p: number) {
    setPortionDir(p > selectedPortions ? 'up' : 'down')
    onPortionsChange(p)
  }

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
    if (newIndex === currentIndex) {
      setTab('step')
      return
    }
    setStepDir(newIndex > currentIndex ? 'next' : 'prev')
    setCurrentIndex(newIndex)
    setTab('step')
  }

  const currentIngredients = (current.ingredientRefs ?? [])
    .map((id) => ingredientMap.get(id))
    .filter((t): t is string => t !== undefined)

  const dark = { background: '#1f1d1a', color: '#f8f4ed' }
  const sectionHeaderColor = '#b8394e'

  return (
    <motion.div
      key="cook-mode"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.22, ease: [0.2, 0, 0.2, 1] }}
      style={{ position: 'fixed', inset: 0, zIndex: 100, height: '100dvh', ...dark, display: 'flex', flexDirection: 'column', userSelect: 'none' }}
    >

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '20px 20px 14px', flexShrink: 0 }}>
        <button onClick={onClose} style={{
          background: 'transparent',
          border: '0.5px solid rgba(248,244,237,0.38)',
          color: '#f8f4ed',
          width: 40, height: 40, borderRadius: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <div style={{ flex: 1, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(248,244,237,0.5)' }}>
          Kookmodus
        </div>
        <div style={{ width: 40 }} />
      </div>

      {/* Tabs */}
      <LayoutGroup>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, padding: '0 20px 8px', flexShrink: 0 }}>
          {([['step', 'Instructies'], ['ingredients', 'Ingrediënten'], ['overview', 'Overzicht']] as const).map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)} style={{
              position: 'relative',
              background: 'transparent',
              color: tab === v ? '#f8f4ed' : 'rgba(248,244,237,0.5)',
              border: 0, padding: '8px 14px', borderRadius: 16, fontSize: 13, fontWeight: 500, cursor: 'pointer',
              fontFamily: 'var(--sans)',
            }}>
              {tab === v && (
                <motion.div
                  layoutId="cook-pill"
                  style={{ position: 'absolute', inset: 0, borderRadius: 16, background: 'rgba(248,244,237,0.12)', zIndex: 0 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span style={{ position: 'relative', zIndex: 1 }}>{l}</span>
            </button>
          ))}
        </div>
      </LayoutGroup>

      {/* ── Tab panels ── */}
      <AnimatePresence mode="wait">
      {tab === 'step' && (
        <motion.div
          key="step-panel"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={{ flex: 1, overflow: 'hidden', minHeight: 0, position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
        >
          <AnimatePresence mode="popLayout" custom={stepDir}>
          <motion.div
            key={currentIndex}
            custom={stepDir}
            variants={{
              enter: (dir: 'next' | 'prev' | null) => ({ x: dir === 'next' ? 40 : dir === 'prev' ? -40 : 0, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (dir: 'next' | 'prev' | null) => ({ x: dir === 'next' ? -40 : dir === 'prev' ? 40 : 0, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 400, damping: 38, mass: 0.8 }}
          >

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
                <div style={{ fontFamily: 'var(--mono)', fontSize: 15, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'rgba(243,222,224,0.9)', marginBottom: 10 }}>
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
          </motion.div>
          </AnimatePresence>

          {/* Gradient fades */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 48, background: 'linear-gradient(to bottom, #1f1d1a, transparent)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'linear-gradient(to top, #1f1d1a, transparent)', pointerEvents: 'none' }} />
        </motion.div>
      )}

      {/* ── Ingredients & Overview ── */}
      {tab !== 'step' && (
        <motion.div
          key="list-panel"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={{ flex: 1, overflow: 'auto', paddingBottom: 40 }}
        >

          {tab === 'ingredients' && (
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              style={{ padding: '12px 24px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(248,244,237,0.65)' }}>
                  <span>voor</span>
                  <div style={{ overflow: 'hidden' }}>
                    <AnimatePresence mode="popLayout" custom={portionDir}>
                      <motion.span
                        key={selectedPortions}
                        custom={portionDir}
                        variants={{
                          enter: (d: 'up' | 'down' | null) => ({ y: d === 'up' ? 10 : d === 'down' ? -10 : 0, opacity: 0 }),
                          center: { y: 0, opacity: 1 },
                          exit: (d: 'up' | 'down' | null) => ({ y: d === 'up' ? -10 : d === 'down' ? 10 : 0, opacity: 0 }),
                        }}
                        initial="enter" animate="center" exit="exit"
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                        style={{ display: 'block' }}
                      >
                        {selectedPortions}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                  <span>
                    {recipe.portionsLabel === 'stuks'
                      ? selectedPortions === 1 ? 'stuk' : 'stuks'
                      : selectedPortions === 1 ? 'persoon' : 'personen'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(248,244,237,0.1)', borderRadius: 16, padding: 3 }}>
                  <button onClick={() => handlePortionsChange(Math.max(1, selectedPortions - 1))} style={{
                    width: 30, height: 30, borderRadius: 13, background: 'rgba(248,244,237,0.15)', border: 0,
                    color: '#f8f4ed', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><path d="M5 12h14" /></svg>
                  </button>
                  <div style={{ minWidth: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontFamily: 'var(--mono)', fontSize: 12, color: '#f8f4ed', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    <div style={{ overflow: 'hidden', position: 'relative' }}>
                      <AnimatePresence mode="popLayout" custom={portionDir}>
                        <motion.span
                          key={selectedPortions}
                          custom={portionDir}
                          variants={{
                            enter: (d: 'up' | 'down' | null) => ({ y: d === 'up' ? 10 : d === 'down' ? -10 : 0, opacity: 0 }),
                            center: { y: 0, opacity: 1 },
                            exit: (d: 'up' | 'down' | null) => ({ y: d === 'up' ? -10 : d === 'down' ? 10 : 0, opacity: 0 }),
                          }}
                          initial="enter" animate="center" exit="exit"
                          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                          style={{ display: 'block' }}
                        >
                          {selectedPortions}
                        </motion.span>
                      </AnimatePresence>
                    </div>
                    <span>{recipe.portionsLabel || 'pers'}</span>
                  </div>
                  <button onClick={() => handlePortionsChange(selectedPortions + 1)} style={{
                    width: 30, height: 30, borderRadius: 13, background: 'rgba(248,244,237,0.15)', border: 0,
                    color: '#f8f4ed', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                  </button>
                </div>
              </div>
              {scaledIngredients.flatMap((node, ni) => {
                if (node.kind === 'group') {
                  return [
                    node.title ? (
                      <div key={`h${ni}`} style={{ marginTop: ni > 0 ? 16 : 0 }}>
                        <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14, color: sectionHeaderColor, fontWeight: 500, marginBottom: 3 }}>
                          {node.title}
                        </div>
                        <div style={{ width: 22, height: 1.5, background: sectionHeaderColor, borderRadius: 1, opacity: 0.6, marginBottom: 8 }} />
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
                          textAlign: 'left', cursor: 'pointer',
                        }}>
                          <motion.span
                            initial={false}
                            animate={{
                              background: isChecked ? 'var(--bordeaux)' : 'transparent',
                              borderColor: isChecked ? 'transparent' : 'rgba(248,244,237,0.4)',
                              scale: isChecked ? [1, 0.82, 1] : 1,
                            }}
                            transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
                            style={{ width: 22, height: 22, borderRadius: 6, border: '1.5px solid', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                              <motion.path
                                d="M5 12l5 5L20 7"
                                strokeLinecap="round" strokeLinejoin="round"
                                initial={false}
                                animate={{ pathLength: isChecked ? 1 : 0, opacity: isChecked ? 1 : 0 }}
                                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                              />
                            </svg>
                          </motion.span>
                          <span style={{ fontSize: 15, flex: 1, color: isChecked ? 'rgba(248,244,237,0.4)' : '#f8f4ed', transition: 'color 0.2s ease', overflow: 'hidden', position: 'relative' }}>
                            <AnimatePresence mode="popLayout" custom={portionDir}>
                              <motion.span
                                key={selectedPortions}
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
                                {c.text}
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
                      textAlign: 'left', cursor: 'pointer',
                    }}>
                      <motion.span
                        initial={false}
                        animate={{
                          background: isChecked ? 'var(--bordeaux)' : 'transparent',
                          borderColor: isChecked ? 'transparent' : 'rgba(248,244,237,0.4)',
                          scale: isChecked ? [1, 0.82, 1] : 1,
                        }}
                        transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
                        style={{ width: 22, height: 22, borderRadius: 6, border: '1.5px solid', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <motion.path
                            d="M5 12l5 5L20 7"
                            strokeLinecap="round" strokeLinejoin="round"
                            initial={false}
                            animate={{ pathLength: isChecked ? 1 : 0, opacity: isChecked ? 1 : 0 }}
                            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                          />
                        </svg>
                      </motion.span>
                      <span style={{ fontSize: 15, flex: 1, color: isChecked ? 'rgba(248,244,237,0.4)' : '#f8f4ed', transition: 'color 0.2s ease', overflow: 'hidden', position: 'relative' }}>
                        <AnimatePresence mode="popLayout" custom={portionDir}>
                          <motion.span
                            key={selectedPortions}
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
                            {node.text}
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
                  )]
                }
                return []
              })}
            </motion.div>
          )}

          {tab === 'overview' && (
            <motion.div
              ref={overviewRef}
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              style={{ padding: '20px 24px' }}
            >
              <div className="lb-eyebrow" style={{ color: 'rgba(248,244,237,0.5)', marginBottom: 14 }}>
                TIK EEN STAP AAN OM ERNAAR TE SPRINGEN
              </div>
              {(() => {
                let prevSection = ''
                let num = 0
                return steps.map((s, i) => {
                  num++
                  const showSection = s.sectionTitle !== prevSection
                  if (showSection) prevSection = s.sectionTitle ?? ''
                  const isActive = i === currentIndex
                  const stepIngredients = (s.ingredientRefs ?? [])
                    .map(id => ingredientMap.get(id))
                    .filter((t): t is string => t !== undefined)
                  return (
                    <div key={i} data-active={isActive}>
                      {showSection && s.sectionTitle && (
                        <div style={{ marginTop: i > 0 ? 16 : 0 }}>
                          <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14, color: sectionHeaderColor, fontWeight: 500, marginBottom: 3 }}>
                            {s.sectionTitle}
                          </div>
                          <div style={{ width: 22, height: 1.5, background: sectionHeaderColor, borderRadius: 1, opacity: 0.6, marginBottom: 8 }} />
                        </div>
                      )}
                      <button onClick={() => { setCurrentIndex(i); setTab('step') }} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 14, padding: '8px 0', width: '100%',
                        background: 'transparent', border: 0, borderBottom: '0.5px solid rgba(248,244,237,0.08)',
                        textAlign: 'left', cursor: 'pointer',
                      }}>
                        <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 22, color: isActive ? sectionHeaderColor : 'rgba(248,244,237,0.5)', fontWeight: 500, width: 22, flexShrink: 0, lineHeight: 1.1, paddingTop: 1 }}>
                          {num}
                        </div>
                        <div style={{ flex: 1, opacity: isActive ? 1 : 0.85 }}>
                          {stepIngredients.length > 0 && (
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(243,222,224,0.5)', marginBottom: 5 }}>
                              {stepIngredients.join(' · ')}
                            </div>
                          )}
                          <div style={{ fontSize: 15, color: '#f8f4ed', lineHeight: 1.55 }}>{s.text}</div>
                        </div>
                      </button>
                    </div>
                  )
                })
              })()}
            </motion.div>
          )}
        </motion.div>
      )}
      </AnimatePresence>

      {/* Bottom controls — step view only */}
      <AnimatePresence>
      {tab === 'step' && (
        <motion.div
          key="bottom-controls"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          style={{ padding: '20px 20px 36px', flexShrink: 0 }}
        >

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(248,244,237,0.3)', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 5 }}>
              STAP
              <AnimatePresence mode="popLayout" custom={stepDir}>
                <motion.span
                  key={currentIndex}
                  custom={stepDir}
                  variants={{
                    enter: (dir: 'next' | 'prev' | null) => ({ x: dir === 'next' ? 8 : dir === 'prev' ? -8 : 0, opacity: 0 }),
                    center: { x: 0, opacity: 1 },
                    exit: (dir: 'next' | 'prev' | null) => ({ x: dir === 'next' ? -8 : dir === 'prev' ? 8 : 0, opacity: 0 }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  style={{ display: 'inline-block' }}
                >
                  {currentIndex + 1}
                </motion.span>
              </AnimatePresence>
              VAN {total}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 20, alignItems: 'center' }}>
            {Array.from({ length: total }).map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  width: i === currentIndex ? 18 : 5,
                  background: i < currentIndex
                    ? 'rgba(248,244,237,0.34)'
                    : i === currentIndex
                      ? '#f3dee0'
                      : 'rgba(248,244,237,0.13)',
                }}
                transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                style={{ height: 5, borderRadius: 3, flexShrink: 0 }}
              />
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
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                cursor: currentIndex < total - 1 ? 'pointer' : 'default',
                opacity: currentIndex === total - 1 ? 0.5 : 1,
                overflow: 'hidden',
              }}>
              <AnimatePresence mode="popLayout" custom={stepDir}>
                {currentIndex < total - 1 ? (
                  <motion.span key="next-label" custom={stepDir}
                    variants={{
                      enter: (dir: 'next' | 'prev' | null) => ({ opacity: 0, x: dir === 'prev' ? -16 : 16 }),
                      center: { opacity: 1, x: 0 },
                      exit: (dir: 'next' | 'prev' | null) => ({ opacity: 0, x: dir === 'prev' ? 16 : -16 }),
                    }}
                    initial="enter" animate="center" exit="exit"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    Volgende stap <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </motion.span>
                ) : (
                  <motion.span key="done-label" custom={stepDir}
                    variants={{
                      enter: (dir: 'next' | 'prev' | null) => ({ opacity: 0, x: dir === 'prev' ? -16 : 16 }),
                      center: { opacity: 1, x: 0 },
                      exit: (dir: 'next' | 'prev' | null) => ({ opacity: 0, x: dir === 'prev' ? 16 : -16 }),
                    }}
                    initial="enter" animate="center" exit="exit"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  >
                    Klaar
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </motion.div>
  )
}
