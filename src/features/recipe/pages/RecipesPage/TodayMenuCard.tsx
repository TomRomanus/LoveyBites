import { Link } from 'react-router-dom'
import { StarRating } from '@/features/recipe/components/StarRating'

type TodayMenuCardProps = {
  recipe: { id: string; title: string; description?: string; rating?: number }
}

const TodayMenuCard = ({ recipe }: TodayMenuCardProps) => (
  <Link
    to={`/recipe/${recipe.id}`}
    style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
  >
    <div className="lb-card" style={{ overflow: 'hidden' }}>
      <div
        style={{
          height: 72,
          background: 'var(--bordeaux)',
          display: 'flex',
          alignItems: 'flex-end',
          padding: '0 14px 12px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(120% 80% at 100% 0%, rgba(255,255,255,0.10), transparent 60%), radial-gradient(80% 60% at 0% 100%, rgba(0,0,0,0.18), transparent 60%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            fontFamily: 'var(--serif)',
            fontStyle: 'italic',
            fontSize: 20,
            fontWeight: 500,
            color: 'rgba(255,250,240,0.96)',
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {recipe.title}
        </div>
      </div>
      <div style={{ padding: '10px 14px 12px' }}>
        {recipe.description && (
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: 'var(--ink-2)',
              lineHeight: 1.45,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {recipe.description}
          </p>
        )}
        <div style={{ marginTop: 8 }}>
          <StarRating value={recipe.rating ?? 0} />
        </div>
      </div>
    </div>
  </Link>
)

export default TodayMenuCard
