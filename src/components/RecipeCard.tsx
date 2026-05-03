import { Link } from 'react-router-dom'
import type { Recipe } from '../types/recipe'
import { DEFAULT_RECIPE_COLOR } from '../utils/recipeDisplay'

interface Props {
  recipe: Recipe
  variant?: 'feature' | 'default'
  onAddToCalendar?: (recipe: Recipe) => void
}

function Stars({ value }: { value: number }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="13" height="13" viewBox="0 0 24 24"
          fill={i < value ? 'var(--bordeaux)' : 'none'}
          stroke={i < value ? 'var(--bordeaux)' : 'var(--stone-2)'}
          strokeWidth="1.4">
          <path d="M12 3l3 6 6.5 1-4.7 4.6 1.1 6.4L12 18l-5.9 3 1.1-6.4L2.5 10 9 9l3-6z" strokeLinejoin="round" />
        </svg>
      ))}
    </div>
  )
}

export default function RecipeCard({ recipe, variant = 'default', onAddToCalendar }: Props) {
  const color = recipe.color ?? DEFAULT_RECIPE_COLOR
  const shortId = recipe.id.slice(-2).toUpperCase()

  if (variant === 'feature') {
    return (
      <div className="lb-card" style={{ overflow: 'hidden' }}>
        <Link to={`/recipe/${recipe.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
          {/* Color block hero */}
          <div className="lb-color-block" style={{
            '--block-bg': color,
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
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 14, padding: '6px 0', position: 'relative' }}>
      <Link to={`/recipe/${recipe.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', gap: 14, flex: 1 }}>
        {/* Small color block */}
        <div className="lb-color-block" style={{
          '--block-bg': color,
          width: 84,
          height: 84,
          flexShrink: 0,
          borderRadius: 12,
          padding: '10px 12px',
        } as React.CSSProperties}>
          <div className="lb-color-block-corner" style={{ fontSize: 8 }}>№ {shortId}</div>
          <div className="lb-color-block-title" style={{ fontSize: 12, lineHeight: 1.05 }}>
            {recipe.title.split(' ').slice(0, 2).join(' ')}
          </div>
        </div>
        {/* Text content */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: 0, fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 18, fontWeight: 500, lineHeight: 1.15, letterSpacing: '-0.015em', color: 'var(--ink)' }}>
              {recipe.title}
            </h3>
            {recipe.description && (
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--stone)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {recipe.description}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
            <Stars value={recipe.rating ?? 0} />
            {recipe.tags[0] && (
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {recipe.tags[0]}
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
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
