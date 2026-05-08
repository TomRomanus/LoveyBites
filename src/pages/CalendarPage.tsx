import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { getMealPlanEntries, deleteMealPlanEntry, createMealPlanEntry } from '../services/mealPlan'
import { getRecipes, getRecipe } from '../services/recipes'
import type { MealPlanEntry, Recipe } from '../types/recipe'
import { useAuth } from '../contexts/AuthContext'
import { toISO, addDays, startOfWeek, startOfMonth, endOfMonth, isSameDay, weekDays, calendarGrid } from '../utils/dateUtils'
import { NL_DAYS_GRID, NL_DAYS_SHORT, NL_DAYS_LONG, NL_MONTHS, NL_MONTHS_SHORT } from '../constants/locale'
import { extractLeafTexts } from '../utils/ingredientUtils'
import { scaleIngredientText } from '../utils/scaleIngredient'


const titleVariants = {
  enter: (dir: number) => ({
    opacity: 0,
    x: dir === 2 ? 60 : dir === -2 ? -60 : 0,
    y: dir === 1 ? 16 : dir === -1 ? -16 : 0,
    transition: { duration: 0.18, ease: [0.2, 0, 0, 1] },
  }),
  center: {
    opacity: 1, x: 0, y: 0,
    transition: { duration: 0.22, ease: [0.2, 0, 0, 1] },
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir === 2 ? -60 : dir === -2 ? 60 : 0,
    y: dir === 1 ? -16 : dir === -1 ? 16 : 0,
    transition: { duration: 0.14, ease: [0.4, 0, 1, 1] },
  }),
}

const pageVariants = {
  enter: (dir: number) => ({
    opacity: 0,
    x: dir === 0 ? 0 : dir > 0 ? 28 : -28,
    scale: dir === 0 ? 0.97 : 1,
  }),
  center: {
    opacity: 1, x: 0, scale: 1,
    transition: { duration: 0.22, ease: [0.2, 0, 0, 1] },
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir === 0 ? 0 : dir > 0 ? -28 : 28,
    scale: dir === 0 ? 0.97 : 1,
    transition: { duration: 0.16, ease: [0.4, 0, 1, 1] },
  }),
}

const weekContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.045, delayChildren: 0.06 } },
}

const weekRowVariants = {
  hidden: { opacity: 0, y: 5 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.2, 0, 0, 1] } },
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function formatEntryDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  const day = NL_DAYS_SHORT[d.getDay()].toUpperCase()
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${day} ${dd}-${mm}`
}

// ── Date Picker Input ─────────────────────────────────────────────────────────

function DatePickerInput({ label, value, onChange, openLeft }: {
  label: string
  value: string
  onChange: (v: string) => void
  openLeft?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [monthDir, setMonthDir] = useState(1)
  const ref = useRef<HTMLDivElement>(null)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const selected = value ? new Date(value + 'T00:00:00') : null
  const [viewMonth, setViewMonth] = useState<Date>(() =>
    selected
      ? new Date(selected.getFullYear(), selected.getMonth(), 1)
      : new Date(today.getFullYear(), today.getMonth(), 1)
  )

  function handleOpen() {
    setViewMonth(
      selected
        ? new Date(selected.getFullYear(), selected.getMonth(), 1)
        : new Date(today.getFullYear(), today.getMonth(), 1)
    )
    setOpen(o => !o)
  }

  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  const monthStart = startOfMonth(viewMonth)
  const days = calendarGrid(monthStart)

  function moveMonth(dir: -1 | 1) {
    setMonthDir(dir)
    setViewMonth(prev => {
      const d = new Date(prev); d.setMonth(d.getMonth() + dir); return d
    })
  }

  const displayDate = selected
    ? `${String(selected.getDate()).padStart(2, '0')}-${String(selected.getMonth() + 1).padStart(2, '0')}-${selected.getFullYear()}`
    : 'Kies datum'

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1 }}>
      <div className="lb-eyebrow" style={{ marginBottom: 5 }}>{label}</div>
      <button
        onClick={handleOpen}
        style={{
          width: '100%', height: 46,
          background: open ? 'var(--cream-card)' : 'var(--paper-2)',
          border: 0,
          borderRadius: 14,
          display: 'flex', alignItems: 'center', gap: 9, padding: '0 12px',
          cursor: 'pointer',
          boxShadow: open
            ? '0 0 0 1.5px var(--bordeaux), 0 2px 8px rgba(107,31,42,0.08)'
            : '0 0 0 0.5px var(--line)',
          transition: 'background 0.15s ease, box-shadow 0.15s ease',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--bordeaux)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <rect x="3" y="4" width="18" height="18" rx="2.5" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
        <span style={{
          flex: 1, textAlign: 'left',
          fontFamily: 'var(--mono)',
          fontSize: 13,
          fontWeight: selected ? 500 : 400,
          color: selected ? 'var(--ink)' : 'var(--stone)',
          whiteSpace: 'nowrap',
        }}>
          {displayDate}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
          style={{ display: 'flex', flexShrink: 0 }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--stone)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              ...(openLeft ? { right: 0 } : { left: 0 }),
              zIndex: 400,
              background: 'var(--cream-card)',
              borderRadius: 18,
              boxShadow: '0 10px 40px rgba(31,29,26,0.16), 0 0 0 0.5px rgba(31,29,26,0.08)',
              padding: '14px 12px 12px',
              width: 248,
            }}
          >
            {/* Month navigation */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10, gap: 4 }}>
              <button
                onClick={() => moveMonth(-1)}
                style={{ background: 'none', border: 0, padding: 5, color: 'var(--stone)', cursor: 'pointer', borderRadius: 8, display: 'flex', alignItems: 'center' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <div style={{ flex: 1, overflow: 'hidden', textAlign: 'center' }}>
                <AnimatePresence mode="popLayout" custom={monthDir} initial={false}>
                  <motion.div
                    key={`label-${viewMonth.getFullYear()}-${viewMonth.getMonth()}`}
                    custom={monthDir}
                    variants={titleVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14.5, fontWeight: 500, letterSpacing: '-0.01em' }}
                  >
                    <span style={{ color: 'var(--bordeaux)' }}>{NL_MONTHS[viewMonth.getMonth()]}</span>{' '}
                    <span style={{ color: 'var(--ink)' }}>{viewMonth.getFullYear()}</span>
                  </motion.div>
                </AnimatePresence>
              </div>
              <button
                onClick={() => moveMonth(1)}
                style={{ background: 'none', border: 0, padding: 5, color: 'var(--stone)', cursor: 'pointer', borderRadius: 8, display: 'flex', alignItems: 'center' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M9 6l6 6-6 6" /></svg>
              </button>
            </div>

            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
              {NL_DAYS_GRID.map(d => (
                <div key={d} style={{ textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 8, letterSpacing: '0.1em', color: 'var(--stone-2)', fontWeight: 600, textTransform: 'uppercase', padding: '0 0 3px' }}>{d}</div>
              ))}
            </div>

            {/* Calendar days */}
            <div style={{ position: 'relative', overflow: 'hidden' }}>
            <AnimatePresence mode="popLayout" custom={monthDir} initial={false}>
            <motion.div
              key={`grid-${viewMonth.getFullYear()}-${viewMonth.getMonth()}`}
              custom={monthDir}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}
            >
              {days.map(day => {
                const isSelected = selected ? isSameDay(day, selected) : false
                const isToday = isSameDay(day, today)
                const inMonth = day.getMonth() === monthStart.getMonth()
                return (
                  <motion.button
                    key={toISO(day)}
                    onClick={() => { onChange(toISO(day)); setOpen(false) }}
                    whileTap={{ scale: 0.84 }}
                    style={{
                      height: 30, borderRadius: isSelected ? '50%' : 8, border: 0,
                      background: isSelected ? 'var(--bordeaux)' : 'transparent',
                      color: isSelected ? 'var(--cream-card)' : isToday ? 'var(--bordeaux)' : inMonth ? 'var(--ink)' : 'var(--stone-2)',
                      fontFamily: 'var(--sans)',
                      fontSize: 12.5,
                      fontWeight: isSelected || isToday ? 600 : 400,
                      cursor: 'pointer',
                      opacity: inMonth ? 1 : 0.28,
                      position: 'relative',
                    }}
                  >
                    {day.getDate()}
                    {isToday && !isSelected && (
                      <span style={{
                        position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)',
                        width: 3, height: 3, borderRadius: '50%', background: 'var(--bordeaux)',
                        display: 'block',
                      }} />
                    )}
                  </motion.button>
                )
              })}
            </motion.div>
            </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Shopping List Sheet ───────────────────────────────────────────────────────

interface ShoppingListSheetProps {
  defaultStart: string
  defaultEnd: string
  onClose: () => void
}

function ShoppingListSheet({ defaultStart, defaultEnd, onClose }: ShoppingListSheetProps) {
  const [from, setFrom] = useState(defaultStart)
  const [to, setTo] = useState(defaultEnd)
  const [entries, setEntries] = useState<MealPlanEntry[]>([])
  const [recipeMap, setRecipeMap] = useState<Map<string, Recipe>>(new Map())
  const [loading, setLoading] = useState(false)
  const [fetched, setFetched] = useState(false)
  const [copied, setCopied] = useState(false)
  const [checked, setChecked] = useState<Set<string>>(new Set())

  async function fetchIngredients(fromDate: string, toDate: string) {
    setLoading(true)
    setFetched(false)
    setChecked(new Set())
    try {
      const es = await getMealPlanEntries(fromDate, toDate)
      setEntries(es)
      const ids = [...new Set(es.map(e => e.recipeId).filter(Boolean) as string[])]
      const pairs = await Promise.all(ids.map(async id => {
        const r = await getRecipe(id)
        return r ? ([id, r] as [string, Recipe]) : null
      }))
      const map = new Map<string, Recipe>()
      pairs.forEach(p => p && map.set(p[0], p[1]))
      setRecipeMap(map)
    } finally {
      setLoading(false)
      setFetched(true)
    }
  }

  useEffect(() => {
    const t = setTimeout(() => fetchIngredients(from, to), 350)
    return () => clearTimeout(t)
  }, [from, to])

  function toggleChecked(key: string) {
    setChecked(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const sectionsMap = new Map<string, { label: string; days: string[]; baseIngredients: string[]; count: number; portions: number }>()
  entries.forEach(entry => {
    if (!entry.recipeId) return
    const recipe = recipeMap.get(entry.recipeId)
    if (!recipe) return
    const existing = sectionsMap.get(entry.recipeId)
    if (existing) {
      existing.days.push(entry.date)
      existing.count += 1
    } else {
      sectionsMap.set(entry.recipeId, {
        label: recipe.title,
        days: [entry.date],
        baseIngredients: extractLeafTexts(recipe.ingredients),
        count: 1,
        portions: recipe.portions ?? 2,
      })
    }
  })
  const sections = [...sectionsMap.values()].map(s => ({
    label: s.label,
    days: s.days,
    ingredients: s.baseIngredients.map(i => scaleIngredientText(i, (2 * s.count) / s.portions)),
  }))

  function buildCopyText() {
    return sections.map(s => {
      const dayStr = s.days.map(formatEntryDate).join(', ')
      return `${s.label} (${dayStr}):\n${s.ingredients.map(i => `  - ${i}`).join('\n')}`
    }).join('\n\n')
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(buildCopyText())
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <>
      <motion.div
        className="lb-sheet-backdrop" style={{ animation: 'none', background: 'rgba(31,29,26,0.12)', backdropFilter: 'blur(1px)', WebkitBackdropFilter: 'blur(1px)' }}
        variants={{
          hidden: { opacity: 0, transition: { duration: 0.2 } },
          visible: { opacity: 1, transition: { duration: 0.24 } },
        }}
        initial="hidden" animate="visible" exit="hidden"
        onClick={onClose}
      />
      <motion.div
        className="lb-sheet" style={{ animation: 'none', paddingBottom: 30, height: '88%' }}
        variants={{
          hidden: { y: '100%', transition: { type: 'tween', duration: 0.22, ease: [0.4, 0, 1, 1] } },
          visible: { y: 0, transition: { type: 'spring', stiffness: 300, damping: 32 } },
        }}
        initial="hidden" animate="visible" exit="hidden"
      >
        <div className="lb-sheet-grabber" />
        <div style={{ padding: '12px 22px 0' }}>
          <div className="lb-eyebrow">BOODSCHAPPENLIJST</div>
          <h3 className="lb-display" style={{ margin: '4px 0 0', fontSize: 26 }}>
            Wat we <b>nodig hebben</b>
          </h3>
        </div>
        <div style={{ padding: '14px 22px 16px', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <DatePickerInput label="VAN" value={from} onChange={setFrom} />
          <div style={{ color: 'var(--stone-2)', fontSize: 14, marginBottom: 14, flexShrink: 0 }}>→</div>
          <DatePickerInput label="TOT" value={to} onChange={setTo} openLeft />
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '6px 22px' }}>
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {[
                  { title: 60, items: [72, 55, 80] },
                  { title: 45, items: [65, 48] },
                  { title: 70, items: [58, 75, 42, 68] },
                ].map((sec, si) => (
                  <div key={si} style={{ marginBottom: 16, paddingBottom: 14, borderBottom: '0.5px solid var(--line-soft)' }}>
                    <div className="lb-skeleton" style={{ height: 9, width: '28%', borderRadius: 3, marginBottom: 6 }} />
                    <div className="lb-skeleton" style={{ height: 16, width: `${sec.title}%`, borderRadius: 4, marginBottom: 10 }} />
                    {sec.items.map((w, ii) => (
                      <div key={ii} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0' }}>
                        <div className="lb-skeleton" style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0 }} />
                        <div className="lb-skeleton" style={{ height: 13, width: `${w}%`, borderRadius: 4 }} />
                      </div>
                    ))}
                  </div>
                ))}
              </motion.div>
            )}
            {fetched && !loading && sections.length === 0 && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
                style={{ textAlign: 'center', color: 'var(--stone)', fontFamily: 'var(--serif)', fontStyle: 'italic', padding: 30 }}
              >
                Geen geplande recepten in deze periode.
              </motion.div>
            )}
            {!loading && sections.length > 0 && (
              <motion.div
                key="content"
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
                variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } } }}
              >
                {sections.map((s, i) => (
                  <motion.div
                    key={i}
                    variants={{
                      hidden: { opacity: 0, y: 10 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.2, 0, 0, 1] } },
                    }}
                    style={{ marginBottom: 16, paddingBottom: 14, borderBottom: '0.5px solid var(--line-soft)' }}
                  >
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--stone)', letterSpacing: '0.1em' }}>
                      {s.days.map(formatEntryDate).join(' · ')}
                    </div>
                    <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16, fontWeight: 500, marginTop: 2, marginBottom: 6, color: 'var(--bordeaux)' }}>{s.label}</div>
                    <motion.div
                      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.035, delayChildren: 0.06 } } }}
                    >
                    {s.ingredients.map((x, j) => {
                        const key = `${i}-${j}`
                        const isChecked = checked.has(key)
                        return (
                          <motion.div
                            key={j}
                            variants={{ hidden: { opacity: 0, x: -8 }, visible: { opacity: 1, x: 0, transition: { duration: 0.18, ease: [0.2, 0, 0, 1] } } }}
                          >
                          <button onClick={() => toggleChecked(key)} style={{
                            display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0',
                            background: 'transparent', border: 0, textAlign: 'left',
                            width: '100%', cursor: 'pointer',
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
                            <span style={{ flex: 1, fontSize: 14, color: isChecked ? 'var(--stone)' : 'var(--ink)', opacity: isChecked ? 0.5 : 1, transition: 'color 0.2s ease, opacity 0.2s ease', overflow: 'hidden', position: 'relative' }}>
                              <span style={{ display: 'block', position: 'relative', width: 'fit-content' }}>
                                {x}
                                <motion.span
                                  aria-hidden
                                  initial={false}
                                  animate={{ scaleX: isChecked ? 1 : 0 }}
                                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                                  style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1.5, background: 'currentColor', transformOrigin: 'left', pointerEvents: 'none' }}
                                />
                              </span>
                            </span>
                          </button>
                          </motion.div>
                        )
                      })
                    }
                    </motion.div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence>
          {fetched && sections.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              style={{ padding: '20px 22px 14px' }}
            >
              <motion.button
                onClick={handleCopy}
                className="lb-btn lb-btn--primary"
                style={{ width: '100%' }}
                whileTap={{ scale: 0.97 }}
              >
                {/* Content swap */}
                <AnimatePresence mode="wait" initial={false}>
                  {copied ? (
                    <motion.span
                      key="success"
                      initial={{ opacity: 0, y: 10, scale: 0.88 }}
                      animate={{ opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 420, damping: 26 } }}
                      exit={{ opacity: 0, y: -10, scale: 0.88, transition: { duration: 0.1, ease: [0.4, 0, 1, 1] } }}
                      style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <motion.path
                          d="M5 13l4 4L19 7"
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 1 }}
                          transition={{ duration: 0.32, ease: [0.2, 0, 0, 1], delay: 0.06 }}
                        />
                      </svg>
                      Gekopieerd!
                    </motion.span>
                  ) : (
                    <motion.span
                      key="idle"
                      initial={{ opacity: 0, y: -10, scale: 0.88 }}
                      animate={{ opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 420, damping: 26 } }}
                      exit={{ opacity: 0, y: 10, scale: 0.88, transition: { duration: 0.1, ease: [0.4, 0, 1, 1] } }}
                      style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                      </svg>
                      Kopieer
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )
}

// ── Day Detail Sheet ──────────────────────────────────────────────────────────

interface DayDetailSheetProps {
  date: Date
  entries: MealPlanEntry[]
  recipeMap: Map<string, Recipe>
  onDelete: (id: string) => void
  onAdd: () => void
  onClose: () => void
}

function DayDetailSheet({ date, entries, recipeMap, onDelete, onAdd, onClose }: DayDetailSheetProps) {
  const nav = useNavigate()
  return (
    <>
      <motion.div
        className="lb-sheet-backdrop" style={{ animation: 'none', backdropFilter: 'blur(1px)', WebkitBackdropFilter: 'blur(1px)' }}
        variants={{
          hidden: { opacity: 0, transition: { duration: 0.2 } },
          visible: { opacity: 1, transition: { duration: 0.24 } },
        }}
        initial="hidden" animate="visible" exit="hidden"
        onClick={onClose}
      />
      <motion.div
        className="lb-sheet" style={{ animation: 'none', paddingBottom: 30 }}
        variants={{
          hidden: { y: '100%', transition: { type: 'tween', duration: 0.22, ease: [0.4, 0, 1, 1] } },
          visible: { y: 0, transition: { type: 'spring', stiffness: 300, damping: 32 } },
        }}
        initial="hidden" animate="visible" exit="hidden"
      >
        <div className="lb-sheet-grabber" />
        <div style={{ padding: '12px 22px 0' }}>
          <div className="lb-eyebrow">{NL_DAYS_LONG[date.getDay()].toUpperCase()}</div>
          <h3 className="lb-display" style={{ margin: '4px 0 0', fontSize: 26 }}>
            {NL_MONTHS[date.getMonth()]} <b>{date.getDate()}</b>
          </h3>
        </div>
        <div style={{ padding: '16px 22px', overflow: 'auto', flex: 1, minHeight: 0 }}>
          <AnimatePresence initial={false}>
            {entries.length === 0 && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
                style={{ padding: '20px 0', color: 'var(--stone)', fontStyle: 'italic', fontFamily: 'var(--serif)', textAlign: 'center' }}
              >
                Nog niets gepland.
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07, delayChildren: 0.08 } } }}
          >
            <AnimatePresence initial={false}>
              {entries.map(e => {
                const recipe = recipeMap.get(e.recipeId ?? '')
                return (
                  <motion.div
                    key={e.id}
                    variants={{
                      hidden: { opacity: 0, x: 14 },
                      visible: { opacity: 1, x: 0, transition: { duration: 0.22, ease: [0.2, 0, 0, 1] } },
                    }}
                    exit={{ opacity: 0, height: 0, x: 6, transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', borderBottom: '0.5px solid var(--line-soft)' }}>
                      <div style={{ width: 2.5, alignSelf: 'stretch', borderRadius: 2, flexShrink: 0, background: recipe ? 'var(--bordeaux)' : 'var(--stone)' }} />
                      <span
                        onClick={() => recipe && nav(`/recipe/${recipe.id}`)}
                        style={{
                          flex: 1, fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16,
                          lineHeight: 1.25, fontWeight: 500,
                          color: recipe ? 'var(--bordeaux)' : 'var(--stone)',
                          cursor: recipe ? 'pointer' : 'default',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}
                      >
                        {recipe ? recipe.title : e.customDescription}
                      </span>
                      <motion.button
                        onClick={() => onDelete(e.id)}
                        whileTap={{ scale: 0.78 }}
                        style={{ background: 'none', border: 0, padding: 0, marginLeft: 1, color: 'var(--stone-2)', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center' }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </motion.button>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: 0.22, ease: [0.2, 0, 0, 1] }}
            onClick={onAdd} className="lb-btn lb-btn--ghost" style={{ width: '100%', marginTop: 14 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            Maaltijd toevoegen
          </motion.button>
        </div>
      </motion.div>
    </>
  )
}

// ── Add Meal Sheet ────────────────────────────────────────────────────────────

interface AddMealSheetProps {
  date: string
  existingRecipeIds: string[]
  onClose: () => void
  onSaved: () => void
}

function AddMealSheet({ date, existingRecipeIds, onClose, onSaved }: AddMealSheetProps) {
  const { user } = useAuth()
  const [tab, setTab] = useState<'recipe' | 'custom'>('recipe')
  const [tabDir, setTabDir] = useState(0)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [search, setSearch] = useState('')
  const [custom, setCustom] = useState('')
  const [saving, setSaving] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    const load = () => getRecipes()
      .then(r => { if (!cancelled) setRecipes(r) })
      .catch(() => { if (!cancelled) setTimeout(load, 500) })
    load()
    return () => { cancelled = true }
  }, [])
  useEffect(() => { if (tab === 'recipe') searchRef.current?.focus() }, [tab])

  const available = recipes.filter(r => !existingRecipeIds.includes(r.id))
  const filtered = search.trim()
    ? available.filter(r => {
        const q = search.toLowerCase()
        if (r.title.toLowerCase().includes(q)) return true
        if (r.description?.toLowerCase().includes(q)) return true
        return extractLeafTexts(r.ingredients).some(t => t.toLowerCase().includes(q))
      })
    : available

  const dateObj = new Date(date + 'T00:00:00')

  async function handleSelectRecipe(recipeId: string) {
    if (!user) return
    setSelectedId(recipeId)
    setSaving(true)
    try {
      await createMealPlanEntry({ date, recipeId, createdBy: user.uid })
      onSaved()
    } finally { setSaving(false) }
  }

  async function handleSaveCustom() {
    if (!user || !custom.trim()) return
    setSaving(true)
    try {
      await createMealPlanEntry({ date, customDescription: custom.trim(), createdBy: user.uid })
      onSaved()
    } finally { setSaving(false) }
  }

  return (
    <>
      <motion.div
        variants={{
          hidden: { opacity: 0, transition: { duration: 0.2 } },
          visible: { opacity: 1, transition: { duration: 0.24 } },
        }}
        initial="hidden" animate="visible" exit="hidden"
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(31,29,26,0.12)', backdropFilter: 'blur(1px)', WebkitBackdropFilter: 'blur(1px)', zIndex: 200 }}
      />
      <motion.div
        className="lb-sheet" style={{ animation: 'none', paddingBottom: 30, height: '78%' }}
        variants={{
          hidden: { y: '100%', transition: { type: 'tween', duration: 0.22, ease: [0.4, 0, 1, 1] } },
          visible: { y: 0, transition: { type: 'spring', stiffness: 300, damping: 32 } },
        }}
        initial="hidden" animate="visible" exit="hidden"
      >
        <div className="lb-sheet-grabber" />
        <div style={{ padding: '12px 22px 0' }}>
          <div className="lb-eyebrow">{NL_DAYS_LONG[dateObj.getDay()]}, {NL_MONTHS_SHORT[dateObj.getMonth()]} {dateObj.getDate()}</div>
          <h3 className="lb-display" style={{ margin: '4px 0 14px', fontSize: 24 }}>
            Maaltijd <b>toevoegen</b>
          </h3>
        </div>
        <div style={{ padding: '0 22px 12px' }}>
          <LayoutGroup>
          <div style={{ display: 'flex', background: 'var(--paper-2)', padding: 3, borderRadius: 20 }}>
            {([['recipe', 'Uit kookboek'], ['custom', 'Eigen tekst']] as const).map(([v, l]) => (
              <button key={v} onClick={() => { setTabDir(v === 'custom' ? 1 : -1); setTab(v) }} style={{
                position: 'relative', flex: 1, height: 32, borderRadius: 16, border: 0,
                background: 'transparent',
                fontSize: 13, fontWeight: 500, color: tab === v ? 'var(--ink)' : 'var(--stone)',
                fontFamily: 'var(--sans)', cursor: 'pointer',
              }}>
                {tab === v && (
                  <motion.div
                    layoutId="meal-sheet-pill"
                    style={{ position: 'absolute', inset: 0, borderRadius: 16, background: 'var(--cream-card)', zIndex: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span style={{ position: 'relative', zIndex: 1 }}>{l}</span>
              </button>
            ))}
          </div>
          </LayoutGroup>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
        <AnimatePresence mode="wait" initial={false} custom={tabDir}>
          {tab === 'recipe' && (
          <motion.div
            key="recipe"
            custom={tabDir}
            initial={{ opacity: 0, y: tabDir * 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: tabDir * -16 }}
            transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
            style={{ padding: '6px 22px 0', height: '100%', overflowY: 'auto', overflowX: 'hidden' }}
          >
            <>
              <div style={{ position: 'relative', marginBottom: 10 }}>
                <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)', pointerEvents: 'none' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}><circle cx="11" cy="11" r="7" /><path d="M16.5 16.5L21 21" strokeLinecap="round" /></svg>
                </div>
                <input ref={searchRef} className="lb-input" placeholder="Zoek recept of ingrediënt" value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ paddingLeft: 42, paddingRight: search ? 42 : 14 }} />
                <AnimatePresence>
                  {search && (
                    <motion.button
                      key="clear"
                      onClick={() => setSearch('')}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                      style={{
                        position: 'absolute', right: 8, top: '50%', translateY: '-50%',
                        background: 'none', border: 0, width: 26, height: 26, borderRadius: 13,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--stone)', cursor: 'pointer',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
              <div className="lb-eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden', marginTop: 14, marginBottom: 4 }}>
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={filtered.length}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    style={{ display: 'block' }}
                  >
                    {filtered.length}
                  </motion.span>
                </AnimatePresence>
                {filtered.length === 1 ? 'RECEPT' : 'RECEPTEN'}
              </div>
              <AnimatePresence mode="wait">
                {filtered.length === 0 && (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
                    style={{ textAlign: 'center', color: 'var(--stone)', fontFamily: 'var(--serif)', fontStyle: 'italic', padding: 20 }}
                  >
                    Geen recepten gevonden
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {filtered.map((r, i) => (
                  <motion.div
                    key={r.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18, delay: Math.min(i * 0.03, 0.15), layout: { type: 'spring', stiffness: 350, damping: 35 } }}
                  >
                    <motion.button
                      onClick={() => handleSelectRecipe(r.id)}
                      disabled={saving}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        display: 'block', padding: '10px 0',
                        border: 0, borderBottom: '0.5px solid var(--line)',
                        width: '100%', textAlign: 'left', cursor: 'pointer', borderRadius: 4,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ margin: 0, fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 18, fontWeight: 500, lineHeight: 1.15, letterSpacing: '-0.015em', color: 'var(--ink)' }}>
                            {r.title}
                          </div>
                          <div style={{ width: 24, height: 1.5, background: 'var(--bordeaux)', borderRadius: 1, opacity: 0.6, margin: '4px 0' }} />
                          {r.tags.length > 0 && (
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                              {r.tags.map((t, i) => (
                                <span key={t}>
                                  {i > 0 && <span style={{ color: 'rgba(107,31,42,0.40)' }}> · </span>}
                                  <span style={{ color: 'rgba(107,31,42,0.40)' }}>{t}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <AnimatePresence mode="wait" initial={false}>
                          {selectedId === r.id ? (
                            <motion.div key="check"
                              initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                              transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                              style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: 'var(--bordeaux)' }}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 13l4 4L19 7" />
                              </svg>
                            </motion.div>
                          ) : (
                            <motion.div key="chevron"
                              initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                              transition={{ duration: 0.1 }}
                              style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--stone)" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 6l6 6-6 6" />
                              </svg>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </>
          </motion.div>
          )}
          {tab === 'custom' && (
          <motion.div
            key="custom"
            custom={tabDir}
            initial={{ opacity: 0, y: tabDir * -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: tabDir * 16 }}
            transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
            style={{ padding: '6px 22px 0', height: '100%', overflowY: 'auto' }}
          >
            <>
              <input className="lb-input" autoFocus placeholder="bv. Afhalen, Restjes, Uit eten" value={custom}
                onChange={e => setCustom(e.target.value)} />
              <motion.button onClick={handleSaveCustom} disabled={!custom.trim() || saving}
                whileTap={{ scale: 0.97 }}
                className="lb-btn lb-btn--primary" style={{ width: '100%', marginTop: 14 }}>
                {saving ? 'Opslaan…' : 'Aan planning toevoegen'}
              </motion.button>
            </>
          </motion.div>
          )}
        </AnimatePresence>
        </div>
      </motion.div>
    </>
  )
}

// ── Week View ─────────────────────────────────────────────────────────────────

interface WeekViewProps {
  anchor: Date
  today: Date
  entries: MealPlanEntry[]
  recipeMap: Map<string, Recipe>
  onAdd: (iso: string) => void
  onDelete: (id: string) => void
}

function WeekView({ anchor, today, entries, recipeMap, onAdd, onDelete }: WeekViewProps) {
  const nav = useNavigate()
  const days = weekDays(anchor)
  const entriesForDay = (day: Date) => entries.filter(e => e.date === toISO(day))

  return (
    <motion.div initial="hidden" animate="visible" variants={weekContainerVariants} style={{ padding: '12px 20px 120px', overflowY: 'auto', height: '100%' }}>
      {days.map((day, idx) => {
        const dayEntries = entriesForDay(day)
        const isToday = isSameDay(day, today)
        const iso = toISO(day)
        return (
          <motion.div key={iso} variants={weekRowVariants} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 5,
            padding: '15px 0',
            borderBottom: idx < 6 ? '0.5px solid var(--line)' : 'none',
            minHeight: 38,
          }}>
            {/* Day unit — two fixed columns so abbrevs and numbers each stay vertically aligned */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '17px 22px',
              columnGap: 5,
              alignItems: 'center',
              flexShrink: 0,
              width: 48,
              marginTop: 1,
            }}>
              <span style={{
                fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.08em',
                textTransform: 'uppercase', fontWeight: 600, lineHeight: 1,
                color: isToday ? 'var(--bordeaux)' : 'var(--stone)',
              }}>
                {NL_DAYS_SHORT[day.getDay()]}
              </span>
              <span style={{
                fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 17,
                fontWeight: 500, lineHeight: 1,
                color: isToday ? 'var(--cream-card)' : 'var(--ink-2)',
                background: isToday ? 'var(--bordeaux)' : 'transparent',
                borderRadius: '50%',
                width: 22, height: 22,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {day.getDate()}
              </span>
            </div>

            {/* Recipe zone */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5, paddingRight: 6, paddingTop: 3 }}>
              <AnimatePresence initial={false}>
                {dayEntries.map(e => {
                  const recipe = recipeMap.get(e.recipeId ?? '')
                  return (
                    <motion.div
                      key={e.id}
                      initial={{ opacity: 0, height: 0, x: -6 }}
                      animate={{ opacity: 1, height: 'auto', x: 0 }}
                      exit={{ opacity: 0, height: 0, x: 0 }}
                      transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
                      style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 5 }}
                    >
                      <div style={{ width: 2.5, alignSelf: 'stretch', borderRadius: 2, flexShrink: 0, background: recipe ? 'var(--bordeaux)' : 'var(--stone)' }} />
                      <span
                        onClick={() => recipe && nav(`/recipe/${recipe.id}`)}
                        style={{
                          flex: 1, fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13.5,
                          lineHeight: 1.25, fontWeight: 500,
                          color: recipe ? 'var(--bordeaux)' : 'var(--stone)',
                          cursor: recipe ? 'pointer' : 'default',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}
                      >
                        {recipe ? recipe.title : e.customDescription}
                      </span>
                      <motion.button
                        onClick={() => onDelete(e.id)}
                        whileTap={{ scale: 0.78 }}
                        style={{ background: 'none', border: 0, padding: 0, marginLeft: 1, color: 'var(--stone-2)', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center' }}
                      >
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </motion.button>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>

            {/* Separator + add */}
            <div style={{ width: 0, alignSelf: 'stretch', borderLeft: '0.5px solid var(--line)', flexShrink: 0 }} />
            <motion.button
              onClick={() => onAdd(iso)}
              whileTap={{ scale: 0.78 }}
              style={{ background: 'none', border: 0, padding: 2, color: 'var(--bordeaux)', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', marginTop: 3 }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </motion.button>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

// ── Month View ────────────────────────────────────────────────────────────────

interface MonthViewProps {
  anchor: Date
  today: Date
  entries: MealPlanEntry[]
  recipeMap: Map<string, Recipe>
  onPickDay: (day: Date) => void
  selectedDay?: Date | null
}

function MonthView({ anchor, today, entries, recipeMap, onPickDay, selectedDay }: MonthViewProps) {
  const monthStart = startOfMonth(anchor)
  const days = calendarGrid(monthStart)
  const entriesForDay = (day: Date) => entries.filter(e => e.date === toISO(day))

  return (
    <div style={{ padding: '16px 10px 80px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
        {NL_DAYS_GRID.map(d => (
          <div key={d} style={{ textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--stone-2)', fontWeight: 600, textTransform: 'uppercase', padding: '4px 0' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {days.map(day => {
          const dayEntries = entriesForDay(day)
          const isToday = isSameDay(day, today)
          const inMonth = day.getMonth() === monthStart.getMonth()
          const isSelected = selectedDay ? isSameDay(day, selectedDay) : false
          return (
            <motion.button key={toISO(day)} onClick={() => onPickDay(day)}
              animate={{ boxShadow: isSelected ? '0 0 0 2px rgba(107,31,42,0.40)' : '0 0 0 0px rgba(107,31,42,0.00)' }}
              transition={{ duration: 0.15, ease: [0.25, 0, 0, 1] }}
              style={{
              background: 'var(--cream-card)',
              border: '0.5px solid var(--line)',
              borderRadius: 10,
              padding: '8px 4px 12px',
              opacity: inMonth ? 1 : 0.28,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
              color: 'var(--ink)', textAlign: 'left', cursor: 'pointer',
              overflow: 'hidden',
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 600, lineHeight: 1,
                color: isToday ? 'var(--cream-card)' : 'var(--ink-2)',
                background: isToday ? 'var(--bordeaux)' : 'transparent',
              }}>{day.getDate()}</div>
              <div style={{ width: '100%', minHeight: 10, display: 'flex', flexDirection: 'column' }}>
                <AnimatePresence initial={false}>
                {dayEntries.slice(0, 2).map(e => {
                  const recipe = recipeMap.get(e.recipeId ?? '')
                  const label = recipe ? recipe.title : e.customDescription ?? ''
                  return (
                    <motion.div
                      key={e.id}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15, ease: [0.25, 0, 0, 1] }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', paddingBottom: 2 }}>
                        <div style={{ width: 2, height: 10, borderRadius: 2, flexShrink: 0, background: recipe ? 'var(--bordeaux)' : 'var(--stone)' }} />
                        <span style={{
                          fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 500,
                          fontSize: 7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          flex: 1, minWidth: 0,
                          color: recipe ? 'var(--bordeaux)' : 'var(--stone)',
                        }}>{label}</span>
                      </div>
                    </motion.div>
                  )
                })}
                </AnimatePresence>
                <AnimatePresence initial={false}>
                {dayEntries.length > 2 && (
                  <motion.div
                    key="overflow"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
                    style={{ overflow: 'hidden', fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--stone)', letterSpacing: '0.03em' }}
                  >+{dayEntries.length - 2}</motion.div>
                )}
                </AnimatePresence>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

// ── Main CalendarPage ─────────────────────────────────────────────────────────

type ViewMode = 'week' | 'month'

export default function CalendarPage() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [view, setView] = useState<ViewMode>('week')
  const [anchor, setAnchor] = useState<Date>(startOfWeek(today))
  const [navDir, setNavDir] = useState(0)
  const [entries, setEntries] = useState<MealPlanEntry[]>([])
  const [recipeMap, setRecipeMap] = useState<Map<string, Recipe>>(new Map())
  const [loading, setLoading] = useState(true)
  const [modalDate, setModalDate] = useState<string | null>(null)
  const [detailDay, setDetailDay] = useState<Date | null>(null)
  const [showShopping, setShowShopping] = useState(false)

  const { visibleStart, visibleEnd } = (() => {
    if (view === 'week') {
      return { visibleStart: anchor, visibleEnd: addDays(anchor, 6) }
    }
    const ms = startOfMonth(anchor)
    const grid = calendarGrid(ms)
    return { visibleStart: grid[0], visibleEnd: grid[grid.length - 1] }
  })()

  const loadEntries = useCallback(async () => {
    const es = await getMealPlanEntries(toISO(visibleStart), toISO(visibleEnd))
    setEntries(es)
    const ids = [...new Set(es.map(e => e.recipeId).filter(Boolean) as string[])]
    const pairs = await Promise.all(ids.map(async id => {
      const r = await getRecipe(id)
      return r ? ([id, r] as [string, Recipe]) : null
    }))
    const map = new Map<string, Recipe>()
    pairs.forEach(p => p && map.set(p[0], p[1]))
    setRecipeMap(map)
    setLoading(false)
  }, [toISO(visibleStart), toISO(visibleEnd)])

  useEffect(() => { loadEntries() }, [loadEntries])

  async function handleDelete(id: string) {
    await deleteMealPlanEntry(id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  function movePeriod(dir: -1 | 1) {
    setNavDir(dir)
    setAnchor(prev => {
      if (view === 'week') return addDays(prev, dir * 7)
      const d = new Date(prev)
      d.setMonth(d.getMonth() + dir)
      return d
    })
  }

  const isCurrentPeriod = view === 'week'
    ? toISO(anchor) === toISO(startOfWeek(today))
    : anchor.getMonth() === today.getMonth() && anchor.getFullYear() === today.getFullYear()

  function goToToday() {
    setAnchor(view === 'week' ? startOfWeek(today) : startOfMonth(today))
  }

  const shoppingStart = toISO(startOfWeek(today))
  const shoppingEnd = toISO(addDays(startOfWeek(today), 6))

  return (
    <div className="lb-paper" style={{ height: '100dvh', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Header */}
      <div style={{ padding: '24px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div className="lb-eyebrow">HET MENU</div>
            <h1 className="lb-display" style={{ margin: '8px 0 0', fontSize: 34 }}>
              {view === 'week' ? (
                <>
                  {'Week van '}
                  <AnimatePresence mode="popLayout" custom={navDir}>
                    <motion.b
                      key={`wm-${anchor.getFullYear()}-${anchor.getMonth()}`}
                      custom={navDir}
                      variants={titleVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      style={{ color: 'var(--bordeaux)', display: 'inline-block' }}
                    >
                      {NL_MONTHS_SHORT[anchor.getMonth()]}
                    </motion.b>
                  </AnimatePresence>
                  {' '}
                  <AnimatePresence mode="popLayout" custom={navDir}>
                    <motion.b
                      key={`wd-${toISO(anchor)}`}
                      custom={navDir}
                      variants={titleVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      style={{ color: 'var(--bordeaux)', display: 'inline-block' }}
                    >
                      {anchor.getDate()}
                    </motion.b>
                  </AnimatePresence>
                </>
              ) : (
                <>
                  <AnimatePresence mode="popLayout" custom={navDir}>
                    <motion.b
                      key={`month-${anchor.getFullYear()}-${anchor.getMonth()}`}
                      custom={navDir}
                      variants={titleVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      style={{ color: 'var(--bordeaux)', display: 'inline-block' }}
                    >
                      {NL_MONTHS[anchor.getMonth()]}
                    </motion.b>
                  </AnimatePresence>
                  {' '}
                  <AnimatePresence mode="popLayout" custom={navDir}>
                    <motion.b
                      key={`year-${anchor.getFullYear()}`}
                      custom={navDir}
                      variants={titleVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      style={{ display: 'inline-block' }}
                    >
                      {anchor.getFullYear()}
                    </motion.b>
                  </AnimatePresence>
                </>
              )}
            </h1>
          </div>
          <motion.button
            onClick={() => setShowShopping(true)}
            whileTap={{ scale: 0.88 }}
            style={{
              width: 40, height: 40, borderRadius: 20, border: 0,
              background: 'var(--paper)',
              boxShadow: '0 1px 2px rgba(31,29,26,0.04), 0 0 0 0.5px var(--line)',
              color: 'var(--bordeaux)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18" /><path d="M16 10a4 4 0 01-8 0" />
            </svg>
          </motion.button>
        </div>
      </div>

      {/* Controls */}
      <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <LayoutGroup id="calendar-tabs">
          <div style={{ display: 'flex', borderBottom: '0.5px solid var(--line)' }}>
            {([['week', 'WEEK'], ['month', 'MAAND']] as const).map(([v, l]) => (
              <motion.button
                key={v}
                onClick={() => { setNavDir(v === 'month' ? 2 : -2); setView(v); setAnchor(v === 'week' ? startOfWeek(today) : startOfMonth(today)) }}
                animate={{ color: view === v ? 'var(--bordeaux)' : 'var(--stone)' }}
                transition={{ duration: 0.2 }}
                style={{
                  position: 'relative',
                  background: 'none', border: 0, padding: '0 2px 7px',
                  marginRight: v === 'week' ? 20 : 0,
                  marginBottom: -0.5,
                  fontFamily: 'var(--mono)', fontSize: 11.5, letterSpacing: '0.1em',
                  textTransform: 'uppercase', fontWeight: view === v ? 700 : 600,
                  cursor: 'pointer',
                }}
              >
                {l}
                {view === v && (
                  <motion.div
                    layoutId="cal-tab-line"
                    style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      height: 2.5, background: 'var(--bordeaux)', borderRadius: '2px 2px 0 0',
                    }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </LayoutGroup>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <motion.button onClick={() => movePeriod(-1)} className="lb-icon-btn" whileTap={{ scale: 0.88 }} style={{ width: 40, height: 40 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </motion.button>
          <motion.button onClick={goToToday} disabled={isCurrentPeriod} className="lb-btn lb-btn--ghost lb-btn--small"
            whileTap={{ scale: 0.95 }}
            style={{ flex: 1, height: 40, borderRadius: 20, fontSize: 13, opacity: isCurrentPeriod ? 0.45 : 1 }}>
            Vandaag
          </motion.button>
          <motion.button onClick={() => movePeriod(1)} className="lb-icon-btn" whileTap={{ scale: 0.88 }} style={{ width: 40, height: 40 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </motion.button>
        </div>
      </div>

      {/* Calendar views */}
      {loading ? (
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px 120px' }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 5,
              padding: '15px 0',
              borderBottom: i < 6 ? '0.5px solid var(--line)' : 'none',
              minHeight: 38,
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '17px 22px', columnGap: 5, alignItems: 'center', flexShrink: 0, width: 48, marginTop: 1 }}>
                <div className="lb-skeleton" style={{ width: 14, height: 9, borderRadius: 2 }} />
                <div className="lb-skeleton" style={{ width: 22, height: 22, borderRadius: '50%' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5, paddingRight: 6, paddingTop: 3 }}>
                {([1, 2, 1, 0, 1, 2, 0] as const)[i] > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div className="lb-skeleton" style={{ width: 2.5, height: 13, borderRadius: 2, flexShrink: 0 }} />
                    <div className="lb-skeleton" style={{ height: 13, borderRadius: 5, flex: 1, maxWidth: ['60%', '45%', '70%', '30%', '55%', '40%', '65%'][i] }} />
                  </div>
                )}
                {([1, 2, 1, 0, 1, 2, 0] as const)[i] > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div className="lb-skeleton" style={{ width: 2.5, height: 13, borderRadius: 2, flexShrink: 0 }} />
                    <div className="lb-skeleton" style={{ height: 13, borderRadius: 5, flex: 1, maxWidth: ['75%', '35%', '55%', '80%', '40%', '50%', '70%'][i] }} />
                  </div>
                )}
              </div>
              <div style={{ width: 0, alignSelf: 'stretch', borderLeft: '0.5px solid var(--line)', flexShrink: 0 }} />
              <div className="lb-skeleton" style={{ width: 12, height: 12, borderRadius: 3, flexShrink: 0, marginTop: 3 }} />
            </div>
          ))}
        </div>
      ) : (
        <AnimatePresence mode="wait" custom={navDir}>
          <motion.div
            key={`${view}-${view === 'week' ? toISO(anchor) : `${anchor.getFullYear()}-${anchor.getMonth()}`}`}
            custom={navDir}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            style={{ willChange: 'transform, opacity', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
          >
            {view === 'week' ? (
              <WeekView
                anchor={anchor}
                today={today}
                entries={entries}
                recipeMap={recipeMap}
                onAdd={setModalDate}
                onDelete={handleDelete}
              />
            ) : (
              <MonthView
                anchor={anchor}
                today={today}
                entries={entries}
                recipeMap={recipeMap}
                onPickDay={setDetailDay}
                selectedDay={detailDay}
              />
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Day detail sheet (month view) */}
      <AnimatePresence>
        {detailDay && (
          <DayDetailSheet
            date={detailDay}
            entries={entries.filter(e => e.date === toISO(detailDay))}
            recipeMap={recipeMap}
            onDelete={async (id) => { await handleDelete(id) }}
            onAdd={() => { setModalDate(toISO(detailDay)); setDetailDay(null) }}
            onClose={() => setDetailDay(null)}
          />
        )}
      </AnimatePresence>

      {/* Add meal sheet */}
      <AnimatePresence>
        {modalDate && (
          <AddMealSheet
            date={modalDate}
            existingRecipeIds={entries.filter(e => e.date === modalDate && e.recipeId).map(e => e.recipeId!)}
            onClose={() => setModalDate(null)}
            onSaved={() => { setModalDate(null); loadEntries() }}
          />
        )}
      </AnimatePresence>

      {/* Shopping list sheet */}
      <AnimatePresence>
        {showShopping && (
          <ShoppingListSheet
            defaultStart={shoppingStart}
            defaultEnd={shoppingEnd}
            onClose={() => setShowShopping(false)}
          />
        )}
      </AnimatePresence>

    </div>
  )
}
