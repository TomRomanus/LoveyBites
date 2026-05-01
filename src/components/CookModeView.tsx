import { useState, useEffect, useRef } from 'react'
import type { Recipe, IngredientNode as TreeNode } from '../types/recipe'

// ─── Shared helpers (also exported for RecipeDetailPage) ──────────────────────

export interface IngredientListProps {
  nodes: TreeNode[]
  pathPrefix: string
  depth: number
  checked: Set<string>
  onToggle: (path: string) => void
}

export function IngredientList({ nodes, pathPrefix, depth, checked, onToggle }: IngredientListProps) {
  return (
    <ul className="space-y-2">
      {nodes.map((node, i) => {
        const path = `${pathPrefix}${i}`
        if (node.kind === 'leaf') {
          const isChecked = checked.has(path)
          return (
            <li
              key={path}
              onClick={() => onToggle(path)}
              className="flex items-center gap-3 cursor-pointer select-none py-0.5"
            >
              <span
                className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                  isChecked ? 'bg-clay-500 border-clay-500 text-white' : 'border-stone-300'
                }`}
              >
                {isChecked && <span className="text-xs leading-none">✓</span>}
              </span>
              <span className={isChecked ? 'line-through text-stone-300' : 'text-stone-700'}>
                {node.text}
              </span>
            </li>
          )
        }

        const headingClass =
          depth === 0
            ? 'font-display text-sm font-semibold text-stone-800 mt-5 mb-2 italic'
            : 'text-xs font-semibold text-stone-500 uppercase tracking-wider mt-4 mb-1'

        return (
          <li key={path}>
            {node.title && <p className={headingClass}>{node.title}</p>}
            <div className={depth > 0 ? 'pl-3 border-l border-stone-200' : ''}>
              <IngredientList
                nodes={node.children}
                pathPrefix={`${path}.`}
                depth={depth + 1}
                checked={checked}
                onToggle={onToggle}
              />
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
      result.push({
        text: node.text,
        sectionTitle,
        ingredientRefs: node.ingredientRefs,
        globalIndex: counter.n++,
      })
    } else {
      result.push(...flattenSteps(node.children, node.title, counter))
    }
  }
  return result
}

// ─── Bottom sheet ─────────────────────────────────────────────────────────────

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl flex flex-col transition-transform duration-300 max-h-[82vh] ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-stone-200 rounded-full" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100 shrink-0">
          <h3 className="font-display text-lg font-semibold italic text-stone-900">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-600 text-xl leading-none"
          >
            ×
          </button>
        </div>
        {/* Scrollable content */}
        <div className="overflow-y-auto px-5 py-4 flex-1">
          {children}
        </div>
      </div>
    </>
  )
}

// ─── Cook mode view ───────────────────────────────────────────────────────────

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
  const [showIngredients, setShowIngredients] = useState(false)
  const [showAllSteps, setShowAllSteps] = useState(false)

  const allStepsRef = useRef<HTMLDivElement>(null)

  // Scroll active step into view when opening all-steps sheet
  useEffect(() => {
    if (showAllSteps && allStepsRef.current) {
      const active = allStepsRef.current.querySelector('[data-active="true"]')
      active?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [showAllSteps])

  // Prevent body scroll while cook mode is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  if (total === 0) return null

  const prev = steps[currentIndex - 1]
  const current = steps[currentIndex]
  const next = steps[currentIndex + 1]

  const progressPct = total > 1 ? (currentIndex / (total - 1)) * 100 : 100

  function goTo(index: number) {
    setCurrentIndex(Math.max(0, Math.min(total - 1, index)))
    setShowAllSteps(false)
  }

  const currentIngredients = (current.ingredientRefs ?? [])
    .map((id) => ingredientMap.get(id))
    .filter((t): t is string => t !== undefined)

  return (
    <div className="fixed inset-0 z-50 bg-stone-50 flex flex-col select-none">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 px-4 py-3 flex items-center gap-3 shrink-0">
        <button
          onClick={onClose}
          className="text-clay-400 hover:text-clay-600 text-xl w-8 h-8 flex items-center justify-center"
          aria-label="Sluit kookmodus"
        >
          ←
        </button>
        <h1 className="flex-1 font-display text-lg font-bold italic text-stone-900 truncate">
          {recipe.title}
        </h1>
        <span className="text-sm text-stone-400 font-medium shrink-0">
          {currentIndex + 1}/{total}
        </span>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-stone-200 shrink-0">
        <div
          className="h-full bg-clay-500 transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Steps area */}
      <div className="flex-1 overflow-hidden flex flex-col justify-center gap-3 px-4 py-4">
        {/* Previous step */}
        <div
          className={`transition-opacity duration-200 ${prev ? 'opacity-35' : 'opacity-0 pointer-events-none'}`}
          onClick={() => prev && goTo(currentIndex - 1)}
        >
          {prev && (
            <div className="px-4 py-3 cursor-pointer">
              {prev.sectionTitle && (
                <p className="text-xs uppercase tracking-wider text-stone-400 mb-0.5">{prev.sectionTitle}</p>
              )}
              <p className="text-sm text-stone-600 line-clamp-2 leading-relaxed">{prev.text}</p>
            </div>
          )}
        </div>

        {/* Current step card */}
        <div className="bg-white rounded-2xl shadow-md px-5 py-5 mx-0">
          {current.sectionTitle && (
            <p className="text-xs uppercase tracking-wider text-stone-400 mb-2 font-medium">
              {current.sectionTitle}
            </p>
          )}
          {currentIngredients.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {currentIngredients.map((text, j) => (
                <span
                  key={j}
                  className="text-xs bg-clay-50 text-clay-600 border border-clay-200 rounded-full px-2.5 py-0.5"
                >
                  {text}
                </span>
              ))}
            </div>
          )}
          <p className="text-lg leading-relaxed text-stone-800 select-text">{current.text}</p>
        </div>

        {/* Next step */}
        <div
          className={`transition-opacity duration-200 ${next ? 'opacity-35' : 'opacity-0 pointer-events-none'}`}
          onClick={() => next && goTo(currentIndex + 1)}
        >
          {next && (
            <div className="px-4 py-3 cursor-pointer">
              {next.sectionTitle && (
                <p className="text-xs uppercase tracking-wider text-stone-400 mb-0.5">{next.sectionTitle}</p>
              )}
              <p className="text-sm text-stone-600 line-clamp-2 leading-relaxed">{next.text}</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-white border-t border-stone-200 px-3 py-3 flex items-center gap-2 shrink-0 safe-area-bottom">
        <button
          onClick={() => goTo(currentIndex - 1)}
          disabled={currentIndex === 0}
          className="flex-1 h-11 rounded-xl border border-stone-200 text-stone-600 font-medium text-sm disabled:opacity-30 disabled:cursor-default hover:enabled:bg-stone-50 transition-colors"
        >
          ← Vorige
        </button>

        <button
          onClick={() => setShowIngredients(true)}
          className="h-11 px-3 rounded-xl border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50 transition-colors"
          aria-label="Ingrediënten bekijken"
        >
          🥕
        </button>

        <button
          onClick={() => setShowAllSteps(true)}
          className="h-11 px-3 rounded-xl border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50 transition-colors"
          aria-label="Alle stappen bekijken"
        >
          ☰
        </button>

        <button
          onClick={() => goTo(currentIndex + 1)}
          disabled={currentIndex === total - 1}
          className="flex-1 h-11 rounded-xl bg-clay-500 text-white font-medium text-sm disabled:opacity-30 disabled:cursor-default hover:enabled:bg-clay-600 transition-colors"
        >
          Volgende →
        </button>
      </div>

      {/* Ingredients bottom sheet */}
      <BottomSheet
        open={showIngredients}
        onClose={() => setShowIngredients(false)}
        title="Ingrediënten"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-stone-500">Porties</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPortionsChange(Math.max(1, selectedPortions - 1))}
              className="w-9 h-9 rounded-full border border-stone-300 text-stone-500 hover:border-clay-400 hover:text-clay-500 flex items-center justify-center text-sm font-medium transition-colors"
            >
              −
            </button>
            <span className="text-sm text-stone-600 min-w-[4rem] text-center">
              {selectedPortions} {selectedPortions === 1 ? 'portie' : 'porties'}
            </span>
            <button
              onClick={() => onPortionsChange(selectedPortions + 1)}
              className="w-9 h-9 rounded-full border border-stone-300 text-stone-500 hover:border-clay-400 hover:text-clay-500 flex items-center justify-center text-sm font-medium transition-colors"
            >
              +
            </button>
          </div>
        </div>
        <IngredientList
          nodes={scaledIngredients}
          pathPrefix=""
          depth={0}
          checked={checked}
          onToggle={onToggle}
        />
      </BottomSheet>

      {/* All steps bottom sheet */}
      <BottomSheet
        open={showAllSteps}
        onClose={() => setShowAllSteps(false)}
        title="Alle stappen"
      >
        <div ref={allStepsRef} className="space-y-1">
          {steps.map((step, i) => {
            const isPast = i < currentIndex
            const isCurrent = i === currentIndex
            return (
              <button
                key={i}
                data-active={isCurrent}
                onClick={() => goTo(i)}
                className={`w-full text-left px-3 py-3 rounded-xl transition-colors ${
                  isCurrent
                    ? 'bg-clay-50 border-l-4 border-clay-400 pl-3'
                    : isPast
                    ? 'opacity-40 hover:opacity-60'
                    : 'hover:bg-stone-50'
                }`}
              >
                {step.sectionTitle && i > 0 && steps[i - 1].sectionTitle !== step.sectionTitle && (
                  <p className="text-xs uppercase tracking-wider text-stone-400 mb-1">
                    {step.sectionTitle}
                  </p>
                )}
                {step.sectionTitle && i === 0 && (
                  <p className="text-xs uppercase tracking-wider text-stone-400 mb-1">
                    {step.sectionTitle}
                  </p>
                )}
                <div className="flex items-start gap-3">
                  <span
                    className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold font-display mt-0.5 ${
                      isCurrent
                        ? 'bg-clay-500 text-white'
                        : isPast
                        ? 'bg-stone-200 text-stone-400'
                        : 'bg-clay-100 text-clay-600'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <p className={`text-sm leading-relaxed ${isCurrent ? 'text-stone-800 font-medium' : 'text-stone-600'}`}>
                    {step.text}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </BottomSheet>
    </div>
  )
}
