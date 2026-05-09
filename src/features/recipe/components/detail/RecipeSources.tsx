import { Link } from 'lucide-react'

type RecipeSourcesProps = {
  sources: { url: string; label?: string }[]
}

const RecipeSources = ({ sources }: RecipeSourcesProps) => (
  <div style={{ padding: '28px 22px 0' }}>
    <div className="lb-eyebrow">DEEL III</div>
    <h2
      style={{
        margin: '4px 0 16px',
        fontSize: 24,
        fontFamily: 'var(--serif)',
        fontStyle: 'italic',
        fontWeight: 500,
        letterSpacing: '-0.02em',
        lineHeight: 1.05,
      }}
    >
      Bronnen
    </h2>
    <div style={{ marginTop: 0 }}>
      {sources.map((s, i) => (
        <a
          key={i}
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            const isStandalone =
              (window.navigator as { standalone?: boolean }).standalone === true ||
              window.matchMedia('(display-mode: standalone)').matches
            if (isStandalone) {
              e.preventDefault()
              window.location.href = s.url
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 0',
            color: 'var(--ink)',
            textDecoration: 'none',
            borderBottom: '0.5px solid var(--line-soft)',
          }}
        >
          <Link size={16} strokeWidth={1.6} color="var(--bordeaux)" />
          <span
            style={{
              fontSize: 14,
              fontStyle: 'italic',
              fontFamily: 'var(--serif)',
              color: 'var(--bordeaux)',
            }}
          >
            {s.label || s.url}
          </span>
        </a>
      ))}
    </div>
  </div>
)

export default RecipeSources
