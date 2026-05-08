import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import type { Recipe } from '../types/recipe'


interface Props {
  recipe: Recipe
  variant?: 'feature' | 'default'
  onAddToCalendar?: (recipe: Recipe) => void
  highlightTags?: string[]
}

const STAR_PATH = 'M12 3l3 6 6.5 1-4.7 4.6 1.1 6.4L12 18l-5.9 3 1.1-6.4L2.5 10 9 9l3-6z'

function Stars({ value }: { value: number }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'flex-end', gap: 2 }}>
      {Array.from({ length: 5 }, (_, i) => {
        const frac = Math.max(0, Math.min(1, value - i))
        return (
          <div key={i} style={{ width: 13, height: 13, position: 'relative', flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" style={{ position: 'absolute' }}>
              <path d={STAR_PATH} fill="none" stroke="var(--stone-2)" strokeWidth="1.4" strokeLinejoin="round" />
            </svg>
            <svg width="13" height="13" viewBox="0 0 24 24"
              style={{ position: 'absolute', clipPath: `inset(0 ${((1 - frac) * 100).toFixed(1)}% 0 0)` }}>
              <path d={STAR_PATH} fill="var(--bordeaux)" stroke="var(--bordeaux)" strokeWidth="1.4" strokeLinejoin="round" />
            </svg>
          </div>
        )
      })}
    </div>
  )
}

export default function RecipeCard({ recipe, variant = 'default', onAddToCalendar, highlightTags }: Props) {
  const shortId = recipe.id.slice(-2).toUpperCase()

  if (variant === 'feature') {
    return (
      <motion.div className="lb-card" style={{ overflow: 'hidden' }} whileTap={{ scale: 0.985 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}>
        <Link to={`/recipe/${recipe.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
          {/* Color block hero */}
          <div className="lb-color-block" style={{
            '--block-bg': 'var(--bordeaux)',
            height: 170,
            borderRadius: 0,
          } as React.CSSProperties}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1, position: 'relative' }}>
              <div className="lb-color-block-corner">№ {shortId}</div>
              <div className="lb-color-block-corner">·</div>
            </div>
            <div className="lb-color-block-title" style={{ fontSize: 26, zIndex: 1, position: 'relative' }}>{recipe.title}</div>
          </div>
          <div style={{ padding: '16px 18px 18px' }}>
            <div className="lb-eyebrow" style={{ marginBottom: 6 }}>UITGELICHT</div>
            <h3 className="lb-display" style={{ margin: 0, fontSize: 22 }}>{recipe.title}</h3>
            {recipe.description && (
              <p style={{ margin: '6px 0 12px', fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {recipe.description}
              </p>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Stars value={recipe.rating ?? 0} />
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {recipe.tags.slice(0, 3).map(t => (
                  <span key={t} className="lb-tag">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </Link>
        {onAddToCalendar && (
          <button
            onClick={() => onAddToCalendar(recipe)}
            style={{ position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 16, background: 'rgba(255,250,240,0.2)', border: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cream-card)' }}
            aria-label="Toevoegen aan kalender"
          >
            <CalendarIcon />
          </button>
        )}
      </motion.div>
    )
  }

  return (
    <motion.div whileTap={{ scale: 0.98 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} style={{ padding: '10px 0', borderBottom: '0.5px solid var(--line)', position: 'relative' }}>
      <Link to={`/recipe/${recipe.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
        <h3 style={{ margin: 0, fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 18, fontWeight: 500, lineHeight: 1.15, letterSpacing: '-0.015em', color: 'var(--ink)' }}>
          {recipe.title}
        </h3>
        <div style={{ width: 24, height: 1.5, background: 'var(--bordeaux)', borderRadius: 1, opacity: 0.6, margin: '4px 0' }} />
        {recipe.description && (
          <p style={{ margin: 0, fontSize: 12, color: 'var(--stone)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {recipe.description}
          </p>
        )}
        {recipe.tags.length > 0 && (
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>
            {recipe.tags.map((t, i) => (
              <span key={t}>
                {i > 0 && <span style={{ color: 'rgba(107,31,42,0.40)' }}> · </span>}
                <span style={{ color: highlightTags?.includes(t) ? 'var(--bordeaux)' : 'rgba(107,31,42,0.40)' }}>{t}</span>
              </span>
            ))}
          </div>
        )}
        <Stars value={recipe.rating ?? 0} />
      </Link>
    </motion.div>
  )
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  )
}
